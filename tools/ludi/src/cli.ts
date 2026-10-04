#!/usr/bin/env node
/**
 * ludi — agent-friendly control surface for the Ludi server.
 *
 * Drives HTTP + Socket.IO (guest room, lobby, match, solo vs bots).
 * Does not drive the Expo mobile UI; that surface is not agent-reachable here.
 */
import { Command, CommanderError } from 'commander';
import { ExitCode } from './exit.js';
import { buildIntrospect } from './introspect.js';
import { doctorFailureHint, runDoctor } from './doctor.js';
import {
  ACLI_VERSION,
  CLI_VERSION,
  defaultIo,
  emitErr,
  emitOk,
  type OutputFormat,
} from './output.js';
import { playSoloVsBots } from './play/soloVsBots.js';
import {
  bridgeRpc,
  serverStatus,
  startBridgeProcess,
  startServerProcess,
  stopBridgeProcess,
  stopServerProcess,
  isPidAlive,
} from './process.js';
import {
  readBridge,
  resolveRunDir,
  resolveServerUrl,
} from './runDir.js';

interface GlobalOpts {
  output: OutputFormat;
  runDir?: string;
  url?: string;
  json?: boolean;
}

function formatOf(opts: { output?: string; json?: boolean }): OutputFormat {
  if (opts.json) return 'json';
  if (opts.output === 'text' || opts.output === 'json') return opts.output;
  return 'json';
}

/** Resolve output format from raw argv (for early CommanderError before opts are reliable). */
function formatFromArgv(argv: string[]): OutputFormat {
  if (argv.includes('--json')) return 'json';
  const i = argv.indexOf('--output');
  if (i >= 0 && argv[i + 1]) {
    return formatOf({ output: argv[i + 1] });
  }
  return 'json';
}

function globalFrom(cmd: Command): GlobalOpts {
  const opts = cmd.optsWithGlobals() as {
    output?: string;
    runDir?: string;
    url?: string;
    json?: boolean;
  };
  return {
    output: formatOf(opts),
    runDir: opts.runDir,
    url: opts.url,
    json: opts.json,
  };
}

function fail(
  command: string,
  started: number,
  format: OutputFormat,
  err: unknown,
  fallback: number = ExitCode.GENERAL_ERROR,
): never {
  const io = defaultIo();
  const e = err as Error & { code?: string; hint?: string; hints?: string[] };
  const codeName = e.code ?? 'GENERAL_ERROR';
  const exit =
    codeName in ExitCode
      ? ExitCode[codeName as keyof typeof ExitCode]
      : fallback;
  emitErr(
    io,
    format,
    command,
    started,
    {
      code: codeName,
      message: e.message,
      hint: e.hint,
      hints: e.hints,
      docs: 'tools/ludi/.cli/README.md',
    },
    exit,
  );
}

/** One-line parent listing + rich help only on this command's own --help. */
function describe(
  cmd: Command,
  oneLine: string,
  afterLines: string[],
): Command {
  return cmd.description(oneLine).addHelpText('after', ['', ...afterLines].join('\n'));
}

async function main(argv: string[]): Promise<void> {
  const program = new Command('ludi');
  program
    .description(
      [
        'Drive the Ludi game server the way a verifier does.',
        '',
        'SURFACE:',
        '  Primary: Ludi server (HTTP + Socket.IO) — guest room, lobby, match, solo vs bots.',
        '  Not driven: Expo mobile UI (no simulator in this environment).',
        '',
        'DISCOVERY:',
        '  ludi --help            modules only (progressive disclosure)',
        '  ludi <module> --help   commands inside a module',
        '  ludi introspect        full machine-readable command tree',
        '',
        'OUTPUT:',
        '  Default --output json (agent contract). Use --output text for humans.',
        '  Mutating commands accept --dry-run (exit 9, no side effects).',
      ].join('\n'),
    )
    .version(`ludi ${CLI_VERSION}\nacli ${ACLI_VERSION}`)
    .option('--output <format>', 'enum[json|text]  Output format', 'json')
    .option('--json', 'Alias for --output json')
    .option('--run-dir <path>', 'Isolated run directory (default: $LUDI_RUN_DIR or /tmp/ludi-verify-default)')
    .option('--url <url>', 'Server URL override (else run-dir server.json, else $LUDI_URL, else :3000)')
    .showHelpAfterError(true)
    .configureHelp({ sortSubcommands: true })
    // Must run before subcommands so copyInheritedSettings picks up _exitCallback.
    .exitOverride()
    .addHelpText(
      'after',
      [
        '',
        'EXAMPLES:',
        '  # Compose yourself: server → session → room → match',
        '  ludi server start --run-dir /tmp/ludi-v1 --port 3100',
        '  ludi doctor --run-dir /tmp/ludi-v1',
        '  ludi session open --run-dir /tmp/ludi-v1',
        '  ludi room create --name Dean',
        '  ludi room ready',
        '  ludi match play-turn',
        '  ludi session close && ludi server stop',
        '',
        '  # Prefer deep flows when available: ludi play --help',
        '',
        'SEE ALSO:',
        '  tools/ludi/.cli/README.md, .cursor/skills/verify-ludi/SKILL.md',
        '',
        'EXIT CODES:',
        '  0 success · 2 bad args · 3 not found · 5 conflict · 6 timeout',
        '  7 upstream · 8 precondition · 9 dry-run',
      ].join('\n'),
    );

  // ——— doctor ———
  describe(
    program.command('doctor'),
    'Read-only: is this Ludi instance worth driving?',
    [
      'DESCRIPTION:',
      '  Checks /health, server identity, and optional run-dir process ownership.',
      '  Run this first whenever anything looks off.',
      '',
      'EXAMPLES:',
      '  ludi doctor --output json',
      '  ludi doctor --run-dir /tmp/ludi-v1 --url http://127.0.0.1:3100',
      '',
      'SEE ALSO: server start, play solo-vs-bots',
    ],
  ).action(async (_args, cmd: Command) => {
    const g = globalFrom(cmd);
    const started = Date.now();
    try {
      const report = await runDoctor({ runDir: g.runDir, url: g.url });
      emitOk(defaultIo(), g.output, 'doctor', started, report);
      if (!report.worth_driving) {
        defaultIo().exit(ExitCode.PRECONDITION_FAILED);
      }
    } catch (err) {
      fail('doctor', started, g.output, err);
    }
  });

  // ——— introspect ———
  describe(
    program.command('introspect'),
    'Emit the full command tree as JSON for agent capability mapping.',
    [
      'EXAMPLES:',
      '  ludi introspect',
      '  ludi introspect --output json',
      '',
      'SEE ALSO: ludi --help',
    ],
  ).action((_args, cmd: Command) => {
    const g = globalFrom(cmd);
    emitOk(defaultIo(), g.output, 'introspect', Date.now(), buildIntrospect());
  });

  // ——— server ———
  const server = describe(
    program.command('server'),
    'Lifecycle for a verification-owned Ludi server.',
    [
      'DESCRIPTION:',
      '  Starts createLudiServer in a detached process with short AI timing.',
      '  Never kill by process name — only stop what this CLI recorded in the run dir.',
      '',
      'SUBCOMMANDS:',
      '  start | status | stop',
      '',
      'SEE ALSO: doctor, play solo-vs-bots',
    ],
  );

  describe(
    server.command('start'),
    'Start a detached Ludi server into the run directory.',
    [
      'OPTIONS:',
      '  --port <int>           Listen port (default 3100)',
      '  --grace-ms <int>       Disconnect grace before AI (default 500)',
      '  --ai-delay-ms <int>    AI think delay (default 50)',
      '  --dry-run              Plan only (exit 9)',
      '',
      'EXAMPLES:',
      '  ludi server start --run-dir /tmp/ludi-v1 --port 3100',
      '  ludi server start --dry-run --output json',
      '',
      'SEE ALSO: server stop, doctor',
    ],
  )
    .option('--port <int>', 'Listen port', (v) => Number(v), 3100)
    .option('--grace-ms <int>', 'Grace period ms', (v) => Number(v), 500)
    .option('--ai-delay-ms <int>', 'AI think delay ms', (v) => Number(v), 50)
    .option('--dry-run', 'Describe actions without starting', false)
    .action(async (opts: { port: number; graceMs: number; aiDelayMs: number; dryRun?: boolean }, cmd: Command) => {
      const g = globalFrom(cmd);
      const started = Date.now();
      try {
        const run = resolveRunDir(g.runDir);
        if (opts.dryRun) {
          emitOk(defaultIo(), g.output, 'server.start', started, null, {
            dry_run: true,
            planned_actions: [
              {
                action: 'spawn_server',
                port: opts.port,
                grace_ms: opts.graceMs,
                ai_delay_ms: opts.aiDelayMs,
                run_dir: run.root,
              },
              { action: 'write', path: run.serverPath },
              { action: 'wait', url: `http://127.0.0.1:${opts.port}/health` },
            ],
          });
          defaultIo().exit(ExitCode.DRY_RUN);
        }
        const { meta } = await startServerProcess({
          runDir: g.runDir,
          port: opts.port,
          graceMs: opts.graceMs,
          aiDelayMs: opts.aiDelayMs,
        });
        emitOk(defaultIo(), g.output, 'server.start', started, meta);
      } catch (err) {
        fail('server.start', started, g.output, err, ExitCode.UPSTREAM_ERROR);
      }
    });

  describe(
    server.command('status'),
    'Show run-dir server process status.',
    [
      'EXAMPLES:',
      '  ludi server status --run-dir /tmp/ludi-v1',
      '',
      'SEE ALSO: server start, doctor',
    ],
  ).action((_opts, cmd: Command) => {
    const g = globalFrom(cmd);
    emitOk(defaultIo(), g.output, 'server.status', Date.now(), serverStatus(g.runDir));
  });

  describe(
    server.command('stop'),
    'Stop the server process recorded in the run directory.',
    [
      'EXAMPLES:',
      '  ludi server stop --run-dir /tmp/ludi-v1',
      '  ludi server stop --dry-run',
      '',
      'SEE ALSO: server start',
    ],
  )
    .option('--dry-run', 'Plan only', false)
    .action(async (opts: { dryRun?: boolean }, cmd: Command) => {
      const g = globalFrom(cmd);
      const started = Date.now();
      try {
        const result = await stopServerProcess(g.runDir, !!opts.dryRun);
        if (opts.dryRun) {
          emitOk(defaultIo(), g.output, 'server.stop', started, null, {
            dry_run: true,
            planned_actions: result.planned ?? [],
          });
          defaultIo().exit(ExitCode.DRY_RUN);
        }
        emitOk(defaultIo(), g.output, 'server.stop', started, result);
      } catch (err) {
        fail('server.stop', started, g.output, err);
      }
    });

  // ——— session ———
  const session = describe(
    program.command('session'),
    'Long-lived Socket.IO bridge for room/match commands.',
    [
      'DESCRIPTION:',
      '  Holds one websocket so lobby and match commands share connection state.',
      '  Deep `play` flows open/close a bridge for you.',
      '',
      'SUBCOMMANDS: open | status | close',
      '',
      'SEE ALSO: room, match, play solo-vs-bots',
    ],
  );

  describe(
    session.command('open'),
    'Open a Socket.IO bridge against the target server.',
    [
      'EXAMPLES:',
      '  ludi session open --run-dir /tmp/ludi-v1',
      '  ludi session open --dry-run',
      '',
      'SEE ALSO: session close, room create',
    ],
  )
    .option('--dry-run', 'Plan only', false)
    .action(async (opts: { dryRun?: boolean }, cmd: Command) => {
      const g = globalFrom(cmd);
      const started = Date.now();
      try {
        const run = resolveRunDir(g.runDir);
        const url = resolveServerUrl(run, g.url);
        if (opts.dryRun) {
          emitOk(defaultIo(), g.output, 'session.open', started, null, {
            dry_run: true,
            planned_actions: [{ action: 'spawn_bridge', url, run_dir: run.root }],
          });
          defaultIo().exit(ExitCode.DRY_RUN);
        }
        const meta = await startBridgeProcess({ runDir: g.runDir, url });
        emitOk(defaultIo(), g.output, 'session.open', started, {
          bridge_port: meta.port,
          bridge_pid: meta.pid,
          url,
          run_dir: meta.run.root,
        });
      } catch (err) {
        fail('session.open', started, g.output, err);
      }
    });

  describe(
    session.command('status'),
    'Show whether the session bridge is alive.',
    [
      'EXAMPLES:',
      '  ludi session status',
      '',
      'SEE ALSO: session open',
    ],
  ).action((_opts, cmd: Command) => {
    const g = globalFrom(cmd);
    const run = resolveRunDir(g.runDir);
    const bridge = readBridge(run);
    emitOk(defaultIo(), g.output, 'session.status', Date.now(), {
      run_dir: run.root,
      bridge,
      alive: bridge ? isPidAlive(bridge.pid) : false,
    });
  });

  describe(
    session.command('close'),
    'Close the session bridge for this run dir.',
    [
      'EXAMPLES:',
      '  ludi session close --run-dir /tmp/ludi-v1',
      '  ludi session close --dry-run',
      '',
      'SEE ALSO: session open, server stop',
    ],
  )
    .option('--dry-run', 'Plan only', false)
    .action(async (opts: { dryRun?: boolean }, cmd: Command) => {
      const g = globalFrom(cmd);
      const started = Date.now();
      try {
        const result = await stopBridgeProcess(g.runDir, !!opts.dryRun);
        if (opts.dryRun) {
          emitOk(defaultIo(), g.output, 'session.close', started, null, {
            dry_run: true,
            planned_actions: result.planned ?? [],
          });
          defaultIo().exit(ExitCode.DRY_RUN);
        }
        emitOk(defaultIo(), g.output, 'session.close', started, result);
      } catch (err) {
        fail('session.close', started, g.output, err);
      }
    });

  // ——— room ———
  const room = describe(
    program.command('room'),
    'Lobby operations against the open session bridge.',
    [
      'SUBCOMMANDS: create | join | seat | ready | state | leave',
      '',
      'PRECONDITION: ludi session open (or use ludi play … which opens one for you)',
      '',
      'SEE ALSO: session open, match, play solo-vs-bots',
    ],
  );

  function roomAction(
    name: string,
    method: string,
    buildArgs: (opts: Record<string, unknown>) => Record<string, unknown>,
    oneLine: string,
    afterLines: string[],
    extra?: (c: Command) => void,
  ): void {
    const c = describe(room.command(name), oneLine, afterLines);
    extra?.(c);
    c.option('--dry-run', 'Plan only', false);
    c.action(async (opts: Record<string, unknown>, cmd: Command) => {
      const g = globalFrom(cmd);
      const started = Date.now();
      const args = buildArgs(opts);
      try {
        if (opts.dryRun) {
          emitOk(defaultIo(), g.output, `room.${name}`, started, null, {
            dry_run: true,
            planned_actions: [{ action: method, args }],
          });
          defaultIo().exit(ExitCode.DRY_RUN);
        }
        const res = await bridgeRpc(g.runDir, method, args);
        if (!res.ok) {
          throw Object.assign(new Error(res.error), {
            code: res.code ?? 'UPSTREAM_ERROR',
            hint:
              res.code === 'PRECONDITION_FAILED'
                ? `Run: ludi session open --run-dir ${(g.runDir ?? '/tmp/ludi-verify-default')}`
                : `Run: ludi doctor --run-dir ${(g.runDir ?? '/tmp/ludi-verify-default')} --output json`,
          });
        }
        emitOk(defaultIo(), g.output, `room.${name}`, started, res.data);
      } catch (err) {
        fail(`room.${name}`, started, g.output, err);
      }
    });
  }

  roomAction(
    'create',
    'room.create',
    (o) => ({ displayName: o.name ?? 'Verifier' }),
    'Create a private room as host.',
    [
      'EXAMPLES:',
      '  ludi room create --name Dean',
      '  ludi room create --dry-run',
      '',
      'SEE ALSO: room ready, play solo-vs-bots',
    ],
    (c) => {
      c.option('--name <string>', 'Display name', 'Verifier');
    },
  );

  roomAction(
    'join',
    'room.join',
    (o) => ({ roomCode: o.code, displayName: o.name ?? 'Guest' }),
    'Join a room by 5-character code.',
    [
      'EXAMPLES:',
      '  ludi room join --code ABC12 --name Guest',
      '',
      'SEE ALSO: room create',
    ],
    (c) => {
      c.requiredOption('--code <string>', '5-character room code');
      c.option('--name <string>', 'Display name', 'Guest');
    },
  );

  roomAction(
    'seat',
    'room.seat',
    (o) => ({ color: o.color }),
    'Select seat color (red|green|yellow|blue).',
    [
      'EXAMPLES:',
      '  ludi room seat --color green',
      '',
      'SEE ALSO: room ready',
    ],
    (c) => {
      c.requiredOption('--color <color>', 'enum[red|green|yellow|blue]');
    },
  );

  roomAction(
    'ready',
    'room.ready',
    () => ({}),
    'Host starts the match.',
    [
      'DESCRIPTION:',
      '  If alone, empty seats become ai-substitute bots (solo vs bots).',
      '  If 2+ humans, starts without filling bots.',
      '',
      'EXAMPLES:',
      '  ludi room ready',
      '  ludi room ready --dry-run',
      '',
      'SEE ALSO: play solo-vs-bots, match play-turn',
    ],
  );

  roomAction(
    'state',
    'room.state',
    () => ({}),
    'Request current room (+ game if started).',
    [
      'EXAMPLES:',
      '  ludi room state',
      '',
      'SEE ALSO: match state',
    ],
  );

  roomAction(
    'leave',
    'room.leave',
    () => ({}),
    'Leave the current room.',
    [
      'EXAMPLES:',
      '  ludi room leave',
      '  ludi room leave --dry-run',
      '',
      'SEE ALSO: session close',
    ],
  );

  // ——— match ———
  const match = describe(
    program.command('match'),
    'In-match operations (requires session + started game).',
    [
      'SUBCOMMANDS: state | roll | move | play-turn',
      '',
      'SEE ALSO: room ready, play solo-vs-bots',
    ],
  );

  function matchAction(
    name: string,
    method: string,
    buildArgs: (opts: Record<string, unknown>) => Record<string, unknown>,
    oneLine: string,
    afterLines: string[],
    extra?: (c: Command) => void,
  ): void {
    const c = describe(match.command(name), oneLine, afterLines);
    extra?.(c);
    c.option('--dry-run', 'Plan only', false);
    c.action(async (opts: Record<string, unknown>, cmd: Command) => {
      const g = globalFrom(cmd);
      const started = Date.now();
      const args = buildArgs(opts);
      try {
        if (opts.dryRun) {
          emitOk(defaultIo(), g.output, `match.${name}`, started, null, {
            dry_run: true,
            planned_actions: [{ action: method, args }],
          });
          defaultIo().exit(ExitCode.DRY_RUN);
        }
        const res = await bridgeRpc(g.runDir, method, args);
        if (!res.ok) {
          throw Object.assign(new Error(res.error), {
            code: res.code ?? 'UPSTREAM_ERROR',
            hint: `Run ludi match state, then retry. Doctor: ludi doctor --output json`,
          });
        }
        emitOk(defaultIo(), g.output, `match.${name}`, started, res.data);
      } catch (err) {
        fail(`match.${name}`, started, g.output, err);
      }
    });
  }

  matchAction(
    'state',
    'match.state',
    () => ({}),
    'Show current game snapshot.',
    [
      'EXAMPLES:',
      '  ludi match state',
      '',
      'SEE ALSO: match play-turn',
    ],
  );
  matchAction(
    'roll',
    'match.roll',
    () => ({}),
    'Roll both dice on your turn.',
    [
      'EXAMPLES:',
      '  ludi match roll',
      '  ludi match roll --dry-run',
      '',
      'SEE ALSO: match move, match play-turn',
    ],
  );
  matchAction(
    'move',
    'match.move',
    (o) => ({ tokenIndex: Number(o.token), dieIndex: Number(o.die) }),
    'Play one die on a token.',
    [
      'EXAMPLES:',
      '  ludi match move --token 0 --die 0',
      '',
      'SEE ALSO: match play-turn',
    ],
    (c) => {
      c.requiredOption('--token <int>', 'Token index 0-3', (v) => Number(v));
      c.requiredOption('--die <int>', 'Die index 0|1', (v) => Number(v));
    },
  );
  matchAction(
    'play-turn',
    'match.playTurn',
    (o) => ({ waitMs: o.waitMs ?? 20000 }),
    'Deep: wait until it is your turn, roll, play every legal die.',
    [
      'EXAMPLES:',
      '  ludi match play-turn',
      '  ludi match play-turn --dry-run',
      '',
      'SEE ALSO: play solo-vs-bots',
    ],
    (c) => {
      c.option('--wait-ms <int>', 'Max wait for your turn', (v) => Number(v), 20000);
    },
  );

  // ——— play (deep) ———
  const play = describe(
    program.command('play'),
    'Deep end-to-end flows. Prefer these over composing shallow commands.',
    [
      'SUBCOMMANDS: solo-vs-bots',
      '',
      'EXAMPLES:',
      '  # Preferred deep flow (starts server, solo vs bots, writes evidence, cleans up)',
      '  ludi play solo-vs-bots --run-dir /tmp/ludi-v1 --turns 1',
      '',
      '  # Preview without side effects',
      '  ludi play solo-vs-bots --dry-run',
      '',
      'SEE ALSO: room, match, doctor',
    ],
  );

  describe(
    play.command('solo-vs-bots'),
    'Create a room alone, start vs bots, optionally play turns, write evidence.',
    [
      'DESCRIPTION:',
      '  Mirrors the mobile lobby Start · vs bots path: room:create → room:ready',
      '  fills empty seats with ai-substitute bots, then the match runs.',
      '  By default starts (and later stops) a verification server in --run-dir.',
      '  Evidence is written under <run-dir>/evidence/ and survives cleanup.',
      '',
      'OPTIONS:',
      '  --name <string>     Host display name (default Verifier)',
      '  --color <color>     Optional seat before ready',
      '  --turns <int>       Human turns to play after start (default 1)',
      '  --port <int>        Server port when managing server',
      '  --url <url>         Reuse an existing server (skip manage)',
      '  --dry-run           Plan only (exit 9)',
      '',
      'EXAMPLES:',
      '  ludi play solo-vs-bots --run-dir /tmp/ludi-v1 --turns 1',
      '  ludi play solo-vs-bots --dry-run --output json',
      '  ludi play solo-vs-bots --url http://127.0.0.1:3000 --turns 0',
      '',
      'SEE ALSO: room ready, match play-turn, doctor',
    ],
  )
    .option('--name <string>', 'Host display name', 'Verifier')
    .option('--color <color>', 'Seat color before ready')
    .option('--turns <int>', 'Human turns to auto-play', (v) => Number(v), 1)
    .option('--port <int>', 'Port when starting a server', (v) => Number(v))
    .option('--grace-ms <int>', 'Grace ms for managed server', (v) => Number(v), 500)
    .option('--ai-delay-ms <int>', 'AI delay for managed server', (v) => Number(v), 50)
    .option('--dry-run', 'Plan only', false)
    .action(
      async (
        opts: {
          name: string;
          color?: string;
          turns: number;
          port?: number;
          graceMs: number;
          aiDelayMs: number;
          dryRun?: boolean;
        },
        cmd: Command,
      ) => {
        const g = globalFrom(cmd);
        const started = Date.now();
        try {
          const out = await playSoloVsBots({
            runDir: g.runDir,
            url: g.url,
            name: opts.name,
            color: opts.color,
            turns: opts.turns,
            port: opts.port,
            graceMs: opts.graceMs,
            aiDelayMs: opts.aiDelayMs,
            manageServer: !g.url,
            dryRun: !!opts.dryRun,
          });
          if (out.dry_run) {
            emitOk(defaultIo(), g.output, 'play.solo-vs-bots', started, null, {
              dry_run: true,
              planned_actions: out.planned_actions,
            });
            defaultIo().exit(ExitCode.DRY_RUN);
          }
          emitOk(defaultIo(), g.output, 'play.solo-vs-bots', started, out.result);
        } catch (err) {
          const run = resolveRunDir(g.runDir);
          fail(
            'play.solo-vs-bots',
            started,
            g.output,
            Object.assign(err as Error, {
              hints: [(err as Error & { hint?: string }).hint, doctorFailureHint(run)].filter(
                Boolean,
              ) as string[],
            }),
          );
        }
      },
    );

  // ——— http ———
  const http = describe(
    program.command('http'),
    'Plain HTTP probes (no Socket.IO).',
    [
      'SUBCOMMANDS: health | info',
      '',
      'SEE ALSO: doctor',
    ],
  );

  describe(
    http.command('health'),
    'GET /health',
    [
      'EXAMPLES:',
      '  ludi http health',
      '',
      'SEE ALSO: doctor',
    ],
  ).action(async (_opts, cmd: Command) => {
    const g = globalFrom(cmd);
    const started = Date.now();
    try {
      const url = resolveServerUrl(resolveRunDir(g.runDir), g.url);
      const res = await fetch(`${url}/health`);
      const body = await res.json();
      emitOk(defaultIo(), g.output, 'http.health', started, { status: res.status, body, url });
      if (!res.ok) defaultIo().exit(ExitCode.UPSTREAM_ERROR);
    } catch (err) {
      fail('http.health', started, g.output, err, ExitCode.UPSTREAM_ERROR);
    }
  });

  describe(
    http.command('info'),
    'GET /',
    [
      'EXAMPLES:',
      '  ludi http info',
      '',
      'SEE ALSO: doctor',
    ],
  ).action(async (_opts, cmd: Command) => {
    const g = globalFrom(cmd);
    const started = Date.now();
    try {
      const url = resolveServerUrl(resolveRunDir(g.runDir), g.url);
      const res = await fetch(url);
      const body = await res.json();
      emitOk(defaultIo(), g.output, 'http.info', started, { status: res.status, body, url });
    } catch (err) {
      fail('http.info', started, g.output, err, ExitCode.UPSTREAM_ERROR);
    }
  });

  try {
    await program.parseAsync(argv);
  } catch (err) {
    if (err instanceof CommanderError) {
      if (err.code === 'commander.helpDisplayed' || err.code === 'commander.version') {
        process.exit(err.exitCode);
      }
      emitErr(
        defaultIo(),
        formatFromArgv(argv),
        'ludi',
        Date.now(),
        {
          code: 'INVALID_ARGS',
          message: err.message,
          hint: 'Run `ludi --help` or `ludi <module> --help`. For the full tree: `ludi introspect`.',
          docs: 'tools/ludi/.cli/README.md',
        },
        ExitCode.INVALID_ARGS,
      );
    }
    throw err;
  }
}

await main(process.argv);
