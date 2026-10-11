import {
  STATUS_REASON,
  parseLiveWatchArgs,
  runWatch,
  validateLiveWatchArgs,
} from '@ludi/live-connector';
import { err, ok, planned, type Result } from './command.js';

function withWatchUrl(
  args: Readonly<Record<string, unknown>>,
  ctxUrl?: string,
): Record<string, unknown> {
  return { ...args, url: args.url ?? ctxUrl };
}

export function planTikTokWatch(
  args: Readonly<Record<string, unknown>>,
  ctxUrl?: string,
): Result {
  const parsed = parseLiveWatchArgs(withWatchUrl(args, ctxUrl));
  const valid = validateLiveWatchArgs(parsed);
  if (!valid.ok) return err('INVALID_ARGS', valid.message, valid.hint);
  const connect = parsed.replay
    ? { action: 'replay_jsonl', path: parsed.replay }
    : parsed.source === 'connector'
      ? { action: 'connect_tiktok', user: parsed.user, source: parsed.source }
      : { action: 'connect_tikfinity', source: parsed.source, url: parsed.url };
  return planned([
    connect,
    parsed.page
      ? { action: 'serve_latency_page', port: parsed.port }
      : { action: 'skip_latency_page' },
  ]);
}

export async function runTikTokWatchCommand(
  args: Readonly<Record<string, unknown>>,
  output: 'json' | 'text',
  ctxUrl?: string,
): Promise<Result> {
  const parsed = parseLiveWatchArgs({
    ...withWatchUrl(args, ctxUrl),
    json: output === 'json' || args.json === true,
  });
  const valid = validateLiveWatchArgs(parsed);
  if (!valid.ok) return err('INVALID_ARGS', valid.message, valid.hint);
  try {
    const result = await runWatch({
      user: parsed.user,
      replay: parsed.replay,
      source: parsed.source,
      url: parsed.url,
      port: parsed.port,
      servePage: parsed.page,
      durationMs: parsed.durationS > 0 ? parsed.durationS * 1000 : 0,
      prefixes: {
        join: parsed.joinPrefix,
        roll: parsed.rollPrefix,
        move: parsed.movePrefix,
        stay: parsed.stayPrefix,
        leave: parsed.leavePrefix,
      },
      onEvent: (event) => {
        if (output !== 'json') return;
        if (event.kind === 'command' || event.kind === 'status' || event.kind === 'verdict') {
          process.stdout.write(`${JSON.stringify(event)}\n`);
        }
      },
    });
    const data = {
      ...result.verdict,
      commands: result.commands,
      pageUrl: result.pageUrl,
    };
    if (result.verdict.pass) return ok(data);
    if (result.lastStatus?.reason === STATUS_REASON.SIGN_REQUIRED) {
      return err(
        'PRECONDITION_FAILED',
        STATUS_REASON.SIGN_REQUIRED,
        'export TIKTOK_SIGN_API_KEY from Euler Stream, then rerun ludi live tiktok-watch --source connector --user <tiktokUsername> --json',
      );
    }
    if (result.lastStatus?.reason === STATUS_REASON.STREAM_OFFLINE) {
      return err(
        'PRECONDITION_FAILED',
        STATUS_REASON.STREAM_OFFLINE,
        'start a TikTok LIVE then rerun: ludi live tiktok-watch --source connector --user <tiktokUsername> --json',
      );
    }
    if (result.lastStatus?.reason === STATUS_REASON.TIKFINITY_NOT_RUNNING) {
      return err(
        'PRECONDITION_FAILED',
        STATUS_REASON.TIKFINITY_NOT_RUNNING,
        'Open TikFinity Desktop, then rerun: ludi live tiktok-watch --json',
      );
    }
    if (result.lastStatus?.reason === STATUS_REASON.TIKFINITY_NOT_LIVE) {
      return err(
        'PRECONDITION_FAILED',
        STATUS_REASON.TIKFINITY_NOT_LIVE,
        'Start your TikTok LIVE in TikFinity, then rerun: ludi live tiktok-watch --json',
      );
    }
    return err(
      'CONFLICT',
      result.verdict.line,
      'Type !join in TikTok chat while the page is open, or replay packages/live-connector/testdata/pass.jsonl',
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const tikfinityDown = /tikfinity not running/i.test(message);
    const tikfinityIdle = /not connected to a live/i.test(message);
    const offline = /offline|not live/i.test(message);
    if (tikfinityDown) {
      return err(
        'PRECONDITION_FAILED',
        STATUS_REASON.TIKFINITY_NOT_RUNNING,
        'Open TikFinity Desktop, then rerun: ludi live tiktok-watch --json',
      );
    }
    if (tikfinityIdle) {
      return err(
        'PRECONDITION_FAILED',
        STATUS_REASON.TIKFINITY_NOT_LIVE,
        'Start your TikTok LIVE in TikFinity, then rerun: ludi live tiktok-watch --json',
      );
    }
    return err(
      offline ? 'PRECONDITION_FAILED' : 'UPSTREAM_ERROR',
      offline ? STATUS_REASON.STREAM_OFFLINE : message,
      offline
        ? 'start a TikTok LIVE then rerun: ludi live tiktok-watch --source connector --user <tiktokUsername> --json'
        : 'ludi live tiktok-watch --help',
    );
  }
}
