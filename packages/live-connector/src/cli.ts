import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runWatch, type WatchResult } from './harness.js';
import { DEFAULT_PREFIXES, P95_PASS_MS, STATUS_REASON } from './types.js';

export type LiveWatchArgs = {
  user?: string;
  replay?: string;
  port: number;
  durationS: number;
  joinPrefix: string;
  rollPrefix: string;
  movePrefix: string;
  page: boolean;
  json: boolean;
};

export const LIVE_WATCH_HELP = `Watch TikTok LIVE chat (or a replay file) and measure command lag.

USAGE:
  ludi live tiktok-watch --user <tiktokUsername> [--json]
  ludi live tiktok-watch --replay <file.jsonl> [--json]

Dean types !join in TikTok chat on his phone. This process prints each matching
command with its lag and serves a local page that shows rolling p50/p95.
PASS is p95 under ${P95_PASS_MS}ms.

OPTIONS:
  --user <name>           TikTok unique id (the @name, with or without @)
  --replay <file.jsonl>   Offline fixture. One JSON object per line
  --port <int>            Local page port (default 8787, 0 for ephemeral)
  --duration-s <int>      Stop after N seconds (default 0 = until Ctrl+C)
  --join-prefix <text>    Join command (default ${DEFAULT_PREFIXES.join})
  --roll-prefix <text>    Roll command (default ${DEFAULT_PREFIXES.roll})
  --move-prefix <text>    Move command (default ${DEFAULT_PREFIXES.move})
  --page <bool>           Serve the latency page (default true)
  --json                  Stream one JSON object per line

ENV (optional, never commit these):
  TIKTOK_SIGN_API_KEY     Euler Stream sign key, if the library asks for one
  EULER_API_KEY           Alias of TIKTOK_SIGN_API_KEY
  TIKTOK_SESSION_COOKIE   sessionid cookie, only if you need an authenticated socket
  TIKTOK_SESSION_IDC      tt-target-idc for that session

ERRORS:
  user is not live: start a TikTok LIVE then rerun
  TikTok chat signing needs TIKTOK_SIGN_API_KEY from Euler Stream
  Missing --user or --replay: ludi live tiktok-watch --help

EXAMPLES:
  ludi live tiktok-watch --user deanplays --json
  ludi live tiktok-watch --replay packages/live-connector/testdata/pass.jsonl --json
`;

function asBool(value: unknown, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  if (typeof value === 'boolean') return value;
  const text = String(value).toLowerCase();
  return text !== 'false' && text !== '0';
}

export function parseLiveWatchArgs(raw: Readonly<Record<string, unknown>>): LiveWatchArgs {
  const user = raw.user !== undefined ? String(raw.user).replace(/^@/, '').trim() : undefined;
  const replay = raw.replay !== undefined ? resolve(String(raw.replay)) : undefined;
  return {
    user: user || undefined,
    replay,
    port: raw.port !== undefined ? Number(raw.port) : 8787,
    durationS: raw['duration-s'] !== undefined ? Number(raw['duration-s']) : 0,
    joinPrefix: raw['join-prefix'] !== undefined ? String(raw['join-prefix']) : DEFAULT_PREFIXES.join,
    rollPrefix: raw['roll-prefix'] !== undefined ? String(raw['roll-prefix']) : DEFAULT_PREFIXES.roll,
    movePrefix: raw['move-prefix'] !== undefined ? String(raw['move-prefix']) : DEFAULT_PREFIXES.move,
    page: asBool(raw.page, true),
    json: raw.json === true || raw.output === 'json' || raw.json === 'true',
  };
}

export function validateLiveWatchArgs(args: LiveWatchArgs): { ok: true } | { ok: false; message: string; hint: string } {
  if (!args.user && !args.replay) {
    return {
      ok: false,
      message: 'Missing --user <tiktokUsername> or --replay <file.jsonl>',
      hint: 'ludi live tiktok-watch --help',
    };
  }
  if (args.user && !args.replay && args.user.length < 2) {
    return {
      ok: false,
      message: 'TikTok username looks empty. Pass the unique id from tiktok.com/@name/live',
      hint: 'ludi live tiktok-watch --user <tiktokUsername> --json',
    };
  }
  if (!Number.isInteger(args.port) || args.port < 0) {
    return {
      ok: false,
      message: '--port must be an integer >= 0',
      hint: 'ludi live tiktok-watch --help',
    };
  }
  if (!Number.isInteger(args.durationS) || args.durationS < 0) {
    return {
      ok: false,
      message: '--duration-s must be an integer >= 0',
      hint: 'ludi live tiktok-watch --help',
    };
  }
  return { ok: true };
}

export async function runTikTokWatch(args: LiveWatchArgs): Promise<WatchResult> {
  return runWatch({
    user: args.user,
    replay: args.replay,
    port: args.port,
    servePage: args.page,
    durationMs: args.durationS > 0 ? args.durationS * 1000 : 0,
    prefixes: {
      join: args.joinPrefix,
      roll: args.rollPrefix,
      move: args.movePrefix,
    },
    onEvent: (event) => {
      if (args.json) {
        process.stdout.write(`${JSON.stringify(event)}\n`);
        return;
      }
      if (event.kind === 'command') {
        const lag = event.lagMs === null ? 'lag=n/a' : `lag=${Math.round(event.lagMs)}ms`;
        process.stdout.write(`${event.displayName} ${event.text} ${lag}\n`);
        return;
      }
      if (event.kind === 'status') {
        process.stderr.write(
          event.reason ? `${event.phase}: ${event.reason}\n` : `${event.phase}\n`,
        );
      }
      if (event.kind === 'verdict') {
        process.stdout.write(`${event.line}\n`);
      }
    },
  });
}

export function watchErrorHint(result: WatchResult): string | undefined {
  const offline = result.verdict.line.includes('FAIL') && result.commands.length === 0;
  if (offline) return STATUS_REASON.STREAM_OFFLINE;
  return undefined;
}

function flagName(token: string): string | null {
  if (token === '-h' || token === '--help') return 'help';
  if (token.startsWith('--')) return token.slice(2);
  return null;
}

export function parseStandaloneArgv(argv: string[]): {
  help: boolean;
  args: Record<string, unknown>;
} {
  const tokens = argv.slice(2).filter((t) => t !== '--' && t !== 'live' && t !== 'tiktok-watch');
  const args: Record<string, unknown> = { json: true };
  let help = false;
  for (let i = 0; i < tokens.length; i++) {
    const name = flagName(tokens[i]!);
    if (name === null) continue;
    if (name === 'help') {
      help = true;
      continue;
    }
    if (name === 'json') {
      args.json = true;
      continue;
    }
    const next = tokens[i + 1];
    if (next !== undefined && !next.startsWith('-')) {
      args[name] = next;
      i++;
    } else {
      args[name] = true;
    }
  }
  return { help, args };
}

async function main(argv: string[]): Promise<number> {
  const parsed = parseStandaloneArgv(argv);
  if (parsed.help) {
    process.stdout.write(LIVE_WATCH_HELP);
    return 0;
  }
  const args = parseLiveWatchArgs(parsed.args);
  const valid = validateLiveWatchArgs(args);
  if (!valid.ok) {
    process.stdout.write(
      `${JSON.stringify({ ok: false, error: { code: 'INVALID_ARGS', message: valid.message, hint: valid.hint } }, null, 2)}\n`,
    );
    return 2;
  }
  try {
    const result = await runTikTokWatch(args);
    return result.verdict.pass ? 0 : 5;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const offline = /offline|not live/i.test(message);
    process.stdout.write(
      `${JSON.stringify({
        ok: false,
        error: {
          code: offline ? 'PRECONDITION_FAILED' : 'UPSTREAM_ERROR',
          message: offline ? STATUS_REASON.STREAM_OFFLINE : message,
          hint: offline
            ? 'start a TikTok LIVE then rerun: ludi live tiktok-watch --user <tiktokUsername> --json'
            : 'ludi live tiktok-watch --help',
        },
      }, null, 2)}\n`,
    );
    return offline ? 8 : 7;
  }
}

const launchedDirectly =
  !!process.argv[1] &&
  (import.meta.url === pathToFileURL(process.argv[1]).href ||
    process.argv[1].endsWith(`${'live-connector'}/src/cli.ts`) ||
    process.argv[1].includes('ludi-live'));
if (launchedDirectly) {
  void main(process.argv).then((code) => process.exit(code));
}
