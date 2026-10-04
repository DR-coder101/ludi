import { writeFileSync } from 'node:fs';
import { DEFAULT_HOUSE_RULES } from '../defaults.js';
import {
  bridgeRpc,
  startBridgeProcess,
  startServerProcess,
  stopBridgeProcess,
  stopServerProcess,
} from '../process.js';
import {
  ensureRunDir,
  evidencePath,
  resolveRunDir,
  resolveServerUrl,
  writeSession,
} from '../runDir.js';
import { runDoctor } from '../doctor.js';

export interface SoloVsBotsResult {
  room_code: string;
  player_id: string;
  color: string | null;
  bots: unknown[];
  game_phase: string | null;
  turn: string | null;
  turns_played: number;
  evidence: string;
  server_url: string;
  run_dir: string;
}

export function planSoloVsBots(opts: {
  runDir?: string;
  url?: string;
  name?: string;
  color?: string;
  turns?: number;
  port?: number;
  graceMs?: number;
  aiDelayMs?: number;
  manageServer?: boolean;
}): unknown[] {
  const run = resolveRunDir(opts.runDir);
  const name = opts.name ?? 'Verifier';
  const turns = opts.turns ?? 1;
  const manageServer = opts.manageServer ?? !opts.url;
  return [
    manageServer
      ? {
          action: 'server.start',
          port: opts.port ?? 3100,
          grace_ms: opts.graceMs ?? 500,
          ai_delay_ms: opts.aiDelayMs ?? 50,
          run_dir: run.root,
        }
      : { action: 'server.reuse', url: resolveServerUrl(run, opts.url) },
    {
      action: 'session.open',
      url: manageServer
        ? `http://127.0.0.1:${opts.port ?? 3100}`
        : resolveServerUrl(run, opts.url),
    },
    { action: 'room.create', displayName: name, houseRules: DEFAULT_HOUSE_RULES },
    opts.color ? { action: 'room.seat', color: opts.color } : null,
    { action: 'room.ready', expect: 'fill 3 bot seats + start match' },
    { action: 'match.playTurn', times: turns },
    { action: 'evidence.write', path: evidencePath(run, 'solo-vs-bots.json') },
    { action: 'session.close' },
    manageServer ? { action: 'server.stop' } : null,
  ].filter(Boolean);
}

export async function playSoloVsBots(opts: {
  runDir?: string;
  url?: string;
  name?: string;
  color?: string;
  turns?: number;
  port?: number;
  graceMs?: number;
  aiDelayMs?: number;
  manageServer?: boolean;
}): Promise<{ result: SoloVsBotsResult }> {
  const run = resolveRunDir(opts.runDir);
  ensureRunDir(run);
  const name = opts.name ?? 'Verifier';
  const turns = opts.turns ?? 1;
  const manageServer = opts.manageServer ?? !opts.url;

  let startedServer = false;
  let startedBridge = false;
  try {
    if (manageServer) {
      await startServerProcess({
        runDir: run.root,
        port: opts.port ?? pickPort(),
        graceMs: opts.graceMs ?? 500,
        aiDelayMs: opts.aiDelayMs ?? 50,
      });
      startedServer = true;
    }

    const url = resolveServerUrl(run, opts.url);
    const doctor = await runDoctor({ runDir: run.root, url });
    if (!doctor.worth_driving) {
      throw Object.assign(new Error('Doctor refused to drive this instance'), {
        code: 'PRECONDITION_FAILED',
        hint: doctor.checks
          .filter((c) => !c.ok)
          .map((c) => `${c.name}: ${c.detail}`)
          .join('; '),
      });
    }

    await startBridgeProcess({ runDir: run.root, url });
    startedBridge = true;

    const created = await mustRpc(run.root, 'room.create', {
      displayName: name,
      houseRules: DEFAULT_HOUSE_RULES,
    });
    const createdData = created as {
      room_code: string;
      player_id: string;
      session_token: string;
    };

    if (opts.color) {
      await mustRpc(run.root, 'room.seat', { color: opts.color });
    }

    const ready = await mustRpc(run.root, 'room.ready', {});
    const readyData = ready as {
      room: { players: Array<{ id: string; color: string; status?: string }> };
      game: { phase: string; turn: string } | null;
      bots: unknown[];
    };

    const turnResults: unknown[] = [];
    for (let i = 0; i < turns; i++) {
      const turn = await mustRpc(run.root, 'match.playTurn', { waitMs: 20000 });
      turnResults.push(turn);
    }

    const me = readyData.room.players.find((p) => p.id === createdData.player_id);
    const result: SoloVsBotsResult = {
      room_code: createdData.room_code,
      player_id: createdData.player_id,
      color: me?.color ?? opts.color ?? null,
      bots: readyData.bots,
      game_phase: readyData.game?.phase ?? null,
      turn: readyData.game?.turn ?? null,
      turns_played: turns,
      evidence: evidencePath(run, 'solo-vs-bots.json'),
      server_url: url,
      run_dir: run.root,
    };

    writeFileSync(
      result.evidence,
      JSON.stringify(
        {
          feature: 'solo-vs-bots',
          captured_at: new Date().toISOString(),
          result,
          ready,
          turns: turnResults,
        },
        null,
        2,
      ) + '\n',
    );

    writeSession(run, {
      room_code: createdData.room_code,
      player_id: createdData.player_id,
      session_token: createdData.session_token,
      display_name: name,
      color: result.color ?? undefined,
    });

    return { result };
  } finally {
    if (startedBridge) {
      await stopBridgeProcess(run.root).catch(() => undefined);
    }
    if (startedServer) {
      await stopServerProcess(run.root).catch(() => undefined);
    }
  }
}

async function mustRpc(runDir: string, method: string, args: Record<string, unknown>): Promise<unknown> {
  const res = await bridgeRpc(runDir, method, args);
  if (!res.ok) {
    throw Object.assign(new Error(res.error), {
      code: res.code ?? 'UPSTREAM_ERROR',
      hint: `Bridge method ${method} failed. Run ludi doctor --run-dir ${runDir} --output json`,
    });
  }
  return res.data;
}

function pickPort(): number {
  // Prefer a high ephemeral-ish port to avoid colliding with a developer's :3000.
  return 3100 + Math.floor(Math.random() * 400);
}
