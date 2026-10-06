import { buildIntrospectFromRegistry } from './introspect.js';
import {
  err,
  ok,
  planned,
  type Command,
  type Ctx,
  type Result,
} from './command.js';
import { runDoctor } from './doctor.js';
import { planSoloVsBots, playSoloVsBots } from './play/soloVsBots.js';
import { planScreensCheck, runScreensCheck, runScreensDoctor } from './screens/run.js';
import {
  bridgeRpc,
  isPidAlive,
  serverStatus,
  startBridgeProcess,
  startServerProcess,
  stopBridgeProcess,
  stopServerProcess,
} from './process.js';
import {
  readBridge,
  resolveRunDir,
  resolveServerUrl,
} from './runDir.js';

function str(args: Readonly<Record<string, unknown>>, key: string): string {
  return String(args[key]);
}

function num(args: Readonly<Record<string, unknown>>, key: string): number {
  return Number(args[key]);
}

async function rpc(
  ctx: Ctx,
  method: string,
  args: Record<string, unknown>,
): Promise<Result> {
  const res = await bridgeRpc(ctx.runDir, method, args);
  if (!res.ok) {
    return err(
      res.code ?? 'UPSTREAM_ERROR',
      res.error,
      res.code === 'PRECONDITION_FAILED'
        ? `ludi session open --run-dir ${ctx.runDir}`
        : `ludi doctor --run-dir ${ctx.runDir} --output json`,
    );
  }
  return ok(res.data);
}

const doctor: Command = {
  name: 'doctor',
  summary: 'Read-only check: is this instance worth driving?',
  args: [],
  mutates: false,
  async run(_args, ctx) {
    const report = await runDoctor({ runDir: ctx.runDir, url: ctx.url });
    if (!report.worth_driving) {
      return err(
        'PRECONDITION_FAILED',
        'Doctor refused to drive this instance',
        `ludi server start --run-dir ${ctx.runDir}`,
      );
    }
    return ok(report);
  },
};

const introspect: Command = {
  name: 'introspect',
  summary: 'Emit the full command tree as JSON',
  args: [],
  mutates: false,
  async run() {
    return ok(buildIntrospectFromRegistry(registry));
  },
};

const serverStart: Command = {
  name: 'start',
  summary: 'Start a detached verification server into the run dir',
  args: [
    { name: 'port', type: 'int', summary: 'Listen port', default: 3100 },
    { name: 'grace-ms', type: 'int', summary: 'Disconnect grace before AI', default: 500 },
    { name: 'ai-delay-ms', type: 'int', summary: 'AI think delay', default: 50 },
  ],
  mutates: true,
  dryRun(args, ctx) {
    const run = resolveRunDir(ctx.runDir);
    return planned([
      {
        action: 'spawn_server',
        port: num(args, 'port'),
        grace_ms: num(args, 'grace-ms'),
        ai_delay_ms: num(args, 'ai-delay-ms'),
        run_dir: run.root,
      },
      { action: 'write', path: run.serverPath },
      { action: 'wait', url: `http://127.0.0.1:${num(args, 'port')}/health` },
    ]);
  },
  async run(args, ctx) {
    try {
      const { meta } = await startServerProcess({
        runDir: ctx.runDir,
        port: num(args, 'port'),
        graceMs: num(args, 'grace-ms'),
        aiDelayMs: num(args, 'ai-delay-ms'),
      });
      return ok(meta);
    } catch (e) {
      const ex = e as Error & { code?: string; hint?: string };
      return err(ex.code ?? 'UPSTREAM_ERROR', ex.message, ex.hint ?? `ludi doctor --run-dir ${ctx.runDir}`);
    }
  },
};

const serverStatusCmd: Command = {
  name: 'status',
  summary: 'Show whether the run-dir server process is alive',
  args: [],
  mutates: false,
  async run(_args, ctx) {
    return ok(serverStatus(ctx.runDir));
  },
};

const serverStop: Command = {
  name: 'stop',
  summary: 'Stop the server process recorded in the run dir',
  args: [],
  mutates: true,
  dryRun(_args, ctx) {
    const run = resolveRunDir(ctx.runDir);
    const status = serverStatus(ctx.runDir);
    return planned([
      { action: 'signal', target: 'SIGTERM', pid: 'pid' in status ? status.pid : null },
      { action: 'remove', path: run.serverPath },
    ]);
  },
  async run(_args, ctx) {
    return ok(await stopServerProcess(ctx.runDir, false));
  },
};

const server: Command = {
  name: 'server',
  summary: 'Lifecycle for a verification-owned Ludi server',
  args: [],
  mutates: false,
  children: [serverStart, serverStatusCmd, serverStop],
};

const sessionOpen: Command = {
  name: 'open',
  summary: 'Open a Socket.IO bridge against the target server',
  args: [],
  mutates: true,
  dryRun(_args, ctx) {
    const run = resolveRunDir(ctx.runDir);
    return planned([{ action: 'spawn_bridge', url: resolveServerUrl(run, ctx.url), run_dir: run.root }]);
  },
  async run(_args, ctx) {
    try {
      const run = resolveRunDir(ctx.runDir);
      const url = resolveServerUrl(run, ctx.url);
      const meta = await startBridgeProcess({ runDir: ctx.runDir, url });
      return ok({ bridge_port: meta.port, bridge_pid: meta.pid, url, run_dir: meta.run.root });
    } catch (e) {
      const ex = e as Error & { code?: string; hint?: string };
      return err(ex.code ?? 'UPSTREAM_ERROR', ex.message, ex.hint ?? `ludi doctor --run-dir ${ctx.runDir}`);
    }
  },
};

const sessionStatus: Command = {
  name: 'status',
  summary: 'Show whether the session bridge is alive',
  args: [],
  mutates: false,
  async run(_args, ctx) {
    const run = resolveRunDir(ctx.runDir);
    const bridge = readBridge(run);
    return ok({ run_dir: run.root, bridge, alive: bridge ? isPidAlive(bridge.pid) : false });
  },
};

const sessionClose: Command = {
  name: 'close',
  summary: 'Close the session bridge for this run dir',
  args: [],
  mutates: true,
  dryRun(_args, ctx) {
    const run = resolveRunDir(ctx.runDir);
    const bridge = readBridge(run);
    return planned([
      { action: 'signal', target: 'SIGTERM', pid: bridge?.pid ?? null },
      { action: 'remove', path: run.bridgeSockHint },
    ]);
  },
  async run(_args, ctx) {
    return ok(await stopBridgeProcess(ctx.runDir, false));
  },
};

const session: Command = {
  name: 'session',
  summary: 'Long-lived Socket.IO bridge for room/match commands',
  args: [],
  mutates: false,
  children: [sessionOpen, sessionStatus, sessionClose],
};

function roomLeaf(
  name: string,
  summary: string,
  method: string,
  args: Command['args'],
  build: (a: Readonly<Record<string, unknown>>) => Record<string, unknown>,
  mutates = true,
): Command {
  return {
    name,
    summary,
    args,
    mutates,
    dryRun: mutates
      ? (a) => planned([{ action: method, args: build(a) }])
      : undefined,
    async run(a, ctx) {
      return rpc(ctx, method, build(a));
    },
  };
}

function houseRulesPatch(
  a: Readonly<Record<string, unknown>>,
): Record<string, unknown> | null {
  const patch: Record<string, unknown> = {};
  if (a['max-consecutive-sixes'] !== undefined) {
    const raw = str(a, 'max-consecutive-sixes');
    patch.maxConsecutiveSixes = raw === 'unlimited' ? 'unlimited' : Number(raw);
  }
  if (a['extra-roll-on-capture'] !== undefined) {
    patch.extraRollOnCapture = Boolean(a['extra-roll-on-capture']);
  }
  if (a['exact-finish-bonus'] !== undefined) {
    patch.exactFinishBonus = Boolean(a['exact-finish-bonus']);
  }
  if (a['play-for-placements'] !== undefined) {
    patch.playForPlacements = Boolean(a['play-for-placements']);
  }
  return Object.keys(patch).length > 0 ? patch : null;
}

const roomHouseRules: Command = {
  name: 'house-rules',
  summary: 'Host sets lobby house-rule toggles before the match',
  args: [
    {
      name: 'max-consecutive-sixes',
      type: 'enum',
      summary: 'Max consecutive throws showing a 6',
      values: ['2', '3', 'unlimited'],
    },
    { name: 'extra-roll-on-capture', type: 'bool', summary: 'Bonus throw on capture' },
    { name: 'exact-finish-bonus', type: 'bool', summary: 'Bonus throw when a token reaches home' },
    { name: 'play-for-placements', type: 'bool', summary: 'Continue after a winner for 2nd/3rd' },
  ],
  mutates: true,
  dryRun(a) {
    const patch = houseRulesPatch(a);
    if (!patch) {
      return err(
        'INVALID_ARGS',
        'Pass at least one house-rule flag (not blockadeCanMoveTogether)',
        'ludi room house-rules --help',
      );
    }
    return planned([
      {
        action: 'room.updateHouseRules',
        args: { ...patch, blockadeCanMoveTogether: false },
      },
    ]);
  },
  async run(a, ctx) {
    const patch = houseRulesPatch(a);
    if (!patch) {
      return err(
        'INVALID_ARGS',
        'Pass at least one house-rule flag (not blockadeCanMoveTogether)',
        'ludi room house-rules --help',
      );
    }
    return rpc(ctx, 'room.updateHouseRules', patch);
  },
};

const room: Command = {
  name: 'room',
  summary: 'Lobby operations (requires session open)',
  args: [],
  mutates: false,
  children: [
    roomLeaf('create', 'Create a private room as host', 'room.create', [
      { name: 'name', type: 'string', summary: 'Display name', default: 'Verifier' },
    ], (a) => ({ displayName: str(a, 'name') })),
    roomLeaf('join', 'Join a room by 5-character code', 'room.join', [
      { name: 'code', type: 'string', summary: '5-character room code', required: true },
      { name: 'name', type: 'string', summary: 'Display name', default: 'Guest' },
      { name: 'session-token', type: 'string', summary: 'Saved seat token for mid-match rejoin' },
    ], (a) => {
      const payload: Record<string, unknown> = {
        roomCode: str(a, 'code'),
        displayName: str(a, 'name'),
      };
      if (a['session-token']) payload.sessionToken = str(a, 'session-token');
      return payload;
    }),
    roomLeaf('seat', 'Select seat color', 'room.seat', [
      {
        name: 'color',
        type: 'enum',
        summary: 'Seat color',
        required: true,
        values: ['red', 'green', 'yellow', 'blue'],
      },
    ], (a) => ({ color: str(a, 'color') })),
    roomLeaf('ready', 'Host starts the match (solo fills bots)', 'room.ready', [], () => ({})),
    roomHouseRules,
    roomLeaf('state', 'Request current room state', 'room.state', [], () => ({}), false),
    roomLeaf('leave', 'Leave the current room', 'room.leave', [], () => ({})),
  ],
};

const match: Command = {
  name: 'match',
  summary: 'In-match operations (requires session + started game)',
  args: [],
  mutates: false,
  children: [
    roomLeaf('state', 'Show current game snapshot', 'match.state', [], () => ({}), false),
    roomLeaf('roll', 'Roll both dice on your turn', 'match.roll', [], () => ({})),
    roomLeaf('move', 'Play one die on a token', 'match.move', [
      { name: 'token', type: 'int', summary: 'Token index 0-3', required: true },
      { name: 'die', type: 'int', summary: 'Die index 0|1', required: true },
    ], (a) => ({ tokenIndex: num(a, 'token'), dieIndex: num(a, 'die') })),
    roomLeaf('play-turn', 'Wait for turn, roll, play legal moves', 'match.playTurn', [
      { name: 'wait-ms', type: 'int', summary: 'Max wait for your turn', default: 20000 },
    ], (a) => ({ waitMs: num(a, 'wait-ms') })),
  ],
};

const playSolo: Command = {
  name: 'solo-vs-bots',
  summary: 'Create room, start vs bots, play turns, write evidence',
  args: [
    { name: 'name', type: 'string', summary: 'Host display name', default: 'Verifier' },
    {
      name: 'color',
      type: 'enum',
      summary: 'Optional seat before ready',
      values: ['red', 'green', 'yellow', 'blue'],
    },
    { name: 'turns', type: 'int', summary: 'Human turns to auto-play', default: 1 },
    { name: 'port', type: 'int', summary: 'Port when starting a managed server', default: 3100 },
    { name: 'grace-ms', type: 'int', summary: 'Grace ms for managed server', default: 500 },
    { name: 'ai-delay-ms', type: 'int', summary: 'AI delay for managed server', default: 50 },
  ],
  mutates: true,
  dryRun(args, ctx) {
    return planned(
      planSoloVsBots({
        runDir: ctx.runDir,
        url: ctx.url,
        name: str(args, 'name'),
        color: args.color ? str(args, 'color') : undefined,
        turns: num(args, 'turns'),
        port: num(args, 'port'),
        graceMs: num(args, 'grace-ms'),
        aiDelayMs: num(args, 'ai-delay-ms'),
        manageServer: !ctx.url,
      }),
    );
  },
  async run(args, ctx) {
    try {
      const out = await playSoloVsBots({
        runDir: ctx.runDir,
        url: ctx.url,
        name: str(args, 'name'),
        color: args.color ? str(args, 'color') : undefined,
        turns: num(args, 'turns'),
        port: num(args, 'port'),
        graceMs: num(args, 'grace-ms'),
        aiDelayMs: num(args, 'ai-delay-ms'),
        manageServer: !ctx.url,
      });
      return ok(out.result);
    } catch (e) {
      const ex = e as Error & { code?: string; hint?: string };
      return err(
        ex.code ?? 'UPSTREAM_ERROR',
        ex.message,
        ex.hint ?? `ludi doctor --run-dir ${ctx.runDir} --output json`,
      );
    }
  },
};

const play: Command = {
  name: 'play',
  summary: 'Deep end-to-end flows (preferred for agents)',
  args: [],
  mutates: false,
  children: [playSolo],
};

const httpHealth: Command = {
  name: 'health',
  summary: 'GET /health',
  args: [],
  mutates: false,
  async run(_args, ctx) {
    const url = resolveServerUrl(resolveRunDir(ctx.runDir), ctx.url);
    try {
      const res = await fetch(`${url}/health`);
      const body = await res.json();
      if (!res.ok) {
        return err('UPSTREAM_ERROR', `HTTP ${res.status} from ${url}/health`, `ludi server start --run-dir ${ctx.runDir}`);
      }
      return ok({ status: res.status, body, url });
    } catch (e) {
      return err(
        'UPSTREAM_ERROR',
        (e as Error).message,
        `ludi server start --run-dir ${ctx.runDir}`,
      );
    }
  },
};

const httpInfo: Command = {
  name: 'info',
  summary: 'GET /',
  args: [],
  mutates: false,
  async run(_args, ctx) {
    const url = resolveServerUrl(resolveRunDir(ctx.runDir), ctx.url);
    try {
      const res = await fetch(url);
      const body = await res.json();
      return ok({ status: res.status, body, url });
    } catch (e) {
      return err(
        'UPSTREAM_ERROR',
        (e as Error).message,
        `ludi server start --run-dir ${ctx.runDir}`,
      );
    }
  },
};

const httpMatches: Command = {
  name: 'matches',
  summary: 'GET /matches/:userId',
  args: [
    { name: 'user-id', type: 'string', summary: 'Player user id', required: true },
    { name: 'limit', type: 'int', summary: 'Max matches to return', default: 50 },
  ],
  mutates: false,
  async run(args, ctx) {
    const url = resolveServerUrl(resolveRunDir(ctx.runDir), ctx.url);
    const userId = encodeURIComponent(str(args, 'user-id'));
    const limit = num(args, 'limit');
    const target = `${url}/matches/${userId}?limit=${limit}`;
    try {
      const res = await fetch(target);
      const body = await res.json();
      return ok({ status: res.status, body, url: target });
    } catch (e) {
      return err(
        'UPSTREAM_ERROR',
        (e as Error).message,
        `ludi doctor --run-dir ${ctx.runDir} --output json`,
      );
    }
  },
};

const http: Command = {
  name: 'http',
  summary: 'Plain HTTP probes (no Socket.IO)',
  args: [],
  mutates: false,
  children: [httpHealth, httpInfo, httpMatches],
};

const screensDoctor: Command = {
  name: 'doctor',
  summary: 'Read-only check: can this machine capture Expo web screens?',
  args: [],
  mutates: false,
  async run(_args, ctx) {
    return runScreensDoctor(ctx);
  },
};

const screensCheck: Command = {
  name: 'check',
  summary: 'Export Expo web, screenshot /dev fixtures, compare to web baselines',
  args: [
    {
      name: 'screen',
      type: 'enum',
      summary: 'One fixture, or all four',
      values: ['all', 'home', 'lobby', 'board-start', 'win'],
      default: 'all',
    },
    {
      name: 'update-baselines',
      type: 'bool',
      summary: 'Overwrite baselines/web from this capture',
      default: false,
    },
    { name: 'port', type: 'int', summary: 'Static server port for the web export', default: 4173 },
  ],
  mutates: true,
  dryRun(args, ctx) {
    return planScreensCheck({
      screen: str(args, 'screen'),
      update: Boolean(args['update-baselines']),
      port: num(args, 'port'),
      url: ctx.url,
      runDir: ctx.runDir,
    });
  },
  async run(args, ctx) {
    return runScreensCheck(args, ctx);
  },
};

const screens: Command = {
  name: 'screens',
  summary: 'Expo web screenshots of /dev home, lobby, board-start, and win',
  args: [],
  mutates: false,
  children: [screensDoctor, screensCheck],
};

/** Root registry. Subcommands disclose the rest. */
export const registry: Command = {
  name: 'ludi',
  summary: 'Drive the Ludi server (HTTP + Socket.IO) and Expo web screens for verification',
  args: [],
  mutates: false,
  children: [doctor, server, session, room, match, play, http, screens, introspect],
};
