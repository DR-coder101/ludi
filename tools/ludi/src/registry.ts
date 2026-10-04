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
    ], (a) => ({ roomCode: str(a, 'code'), displayName: str(a, 'name') })),
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

const http: Command = {
  name: 'http',
  summary: 'Plain HTTP probes (no Socket.IO)',
  args: [],
  mutates: false,
  children: [httpHealth, httpInfo],
};

/** Root registry. Subcommands disclose the rest. */
export const registry: Command = {
  name: 'ludi',
  summary: 'Drive the Ludi server (HTTP + Socket.IO) for verification',
  args: [],
  mutates: false,
  children: [doctor, server, session, room, match, play, http, introspect],
};
