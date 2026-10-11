import {
  STATUS_REASON,
  parseLiveWatchArgs,
  runWatch,
  validateLiveWatchArgs,
} from '@ludi/live-connector';
import { err, ok, planned, type Result } from './command.js';

export function planTikTokWatch(args: Readonly<Record<string, unknown>>): Result {
  const parsed = parseLiveWatchArgs(args);
  const valid = validateLiveWatchArgs(parsed);
  if (!valid.ok) return err('INVALID_ARGS', valid.message, valid.hint);
  return planned([
    parsed.replay
      ? { action: 'replay_jsonl', path: parsed.replay }
      : { action: 'connect_tiktok', user: parsed.user },
    parsed.page
      ? { action: 'serve_latency_page', port: parsed.port }
      : { action: 'skip_latency_page' },
  ]);
}

export async function runTikTokWatchCommand(
  args: Readonly<Record<string, unknown>>,
  output: 'json' | 'text',
): Promise<Result> {
  const parsed = parseLiveWatchArgs({ ...args, json: output === 'json' || args.json === true });
  const valid = validateLiveWatchArgs(parsed);
  if (!valid.ok) return err('INVALID_ARGS', valid.message, valid.hint);
  try {
    const result = await runWatch({
      user: parsed.user,
      replay: parsed.replay,
      port: parsed.port,
      servePage: parsed.page,
      durationMs: parsed.durationS > 0 ? parsed.durationS * 1000 : 0,
      prefixes: {
        join: parsed.joinPrefix,
        roll: parsed.rollPrefix,
        move: parsed.movePrefix,
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
    const offline = result.commands.length === 0;
    return err(
      offline ? 'PRECONDITION_FAILED' : 'CONFLICT',
      offline ? STATUS_REASON.STREAM_OFFLINE : result.verdict.line,
      offline
        ? 'start a TikTok LIVE then rerun: ludi live tiktok-watch --user <tiktokUsername> --json'
        : 'ludi live tiktok-watch --replay packages/live-connector/testdata/pass.jsonl --json',
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const offline = /offline|not live/i.test(message);
    return err(
      offline ? 'PRECONDITION_FAILED' : 'UPSTREAM_ERROR',
      offline ? STATUS_REASON.STREAM_OFFLINE : message,
      offline
        ? 'start a TikTok LIVE then rerun: ludi live tiktok-watch --user <tiktokUsername> --json'
        : 'ludi live tiktok-watch --help',
    );
  }
}
