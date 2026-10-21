import { io as ioClient, Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  GameState,
  ServerToClientEvents,
} from '@ludi/protocol';
import { legalMoves, type GameState as RulesGameState } from '@ludi/rules';
import { createLudiServer } from '../src/server.js';

type TestSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const HOUSE_RULES = {
  maxConsecutiveSixes: 2 as const,
  extraRollOnCapture: false,
  blockadeCanMoveTogether: false,
  exactFinishBonus: false,
  playForPlacements: false,
};

function percentile(values: number[], p: number): number {
  if (values.length === 0) {
    return Number.NaN;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index];
}

async function connect(url: string): Promise<TestSocket> {
  const socket = ioClient(url, { transports: ['websocket'], reconnection: false });
  await new Promise<void>((resolve, reject) => {
    socket.once('connect', resolve);
    socket.once('connect_error', reject);
    setTimeout(() => reject(new Error('connect timeout')), 4000);
  });
  return socket;
}

async function playRoom(url: string, samplesNeeded: number): Promise<number[]> {
  const host = await connect(url);
  const guest = await connect(url);
  const samples: number[] = [];
  let state: GameState | null = null;
  host.on('game:state', (next) => {
    state = next;
  });
  guest.on('game:state', (next) => {
    state = next;
  });

  const roomCode = await new Promise<string>((resolve, reject) => {
    host.emit('room:create', { displayName: 'Load Host', houseRules: HOUSE_RULES }, (response) => {
      if (!response.success || !response.roomCode) {
        reject(new Error(response.error ?? 'create failed'));
        return;
      }
      resolve(response.roomCode);
    });
  });

  await new Promise<void>((resolve, reject) => {
    guest.emit('room:join', { roomCode, displayName: 'Load Guest' }, (response) => {
      if (!response.success) {
        reject(new Error(response.error ?? 'join failed'));
        return;
      }
      resolve();
    });
  });

  const started = new Promise<void>((resolve) => {
    host.once('game:state', () => resolve());
  });
  host.emit('room:ready');
  await started;

  const colorOf = new Map<string, TestSocket>();
  const roomReady = new Promise<void>((resolve) => {
    const onRoom = (room: { players: Array<{ color: string; isHost?: boolean }> }) => {
      if (room.players.length < 2) {
        return;
      }
      const hostPlayer = room.players.find((player) => player.isHost) ?? room.players[0];
      const guestPlayer = room.players.find((player) => player !== hostPlayer) ?? room.players[1];
      colorOf.set(hostPlayer.color, host);
      colorOf.set(guestPlayer.color, guest);
      host.off('room:state', onRoom);
      resolve();
    };
    host.on('room:state', onRoom);
  });
  host.emit('room:requestState');
  await roomReady;

  let turns = 0;
  while (samples.length < samplesNeeded && turns < 400 && state && state.phase !== 'finished') {
    turns += 1;
    const actor = colorOf.get(state.turn) ?? host;
    if (state.phase === 'awaiting_roll') {
      await new Promise<void>((resolve) => {
        actor.emit('game:roll', {}, () => resolve());
      });
      continue;
    }
    if (state.phase === 'awaiting_move') {
      const moves = legalMoves(state as unknown as RulesGameState);
      if (moves.length === 0) {
        await new Promise((resolve) => setTimeout(resolve, 5));
        continue;
      }
      const move = moves[0];
      const startedAt = performance.now();
      await new Promise<void>((resolve) => {
        actor.emit('game:move', { tokenIndex: move.tokenIndex, dieIndex: move.dieIndex }, () => {
          samples.push(performance.now() - startedAt);
          resolve();
        });
      });
    }
  }

  host.disconnect();
  guest.disconnect();
  return samples;
}

async function main(): Promise<void> {
  const rooms = Number(process.env.LUDI_LOAD_ROOMS ?? 8);
  const samplesPerRoom = Number(process.env.LUDI_LOAD_SAMPLES ?? 4);
  const url = process.env.LUDI_LOAD_URL;
  let server: ReturnType<typeof createLudiServer> | undefined;
  let target = url;

  if (!target) {
    server = createLudiServer({
      port: 0,
      rateLimit: { maxRequests: 1000, windowMs: 1000 },
      timingConfig: { gracePeriodMs: 500, aiThinkDelayMs: 0 },
    });
    await server.start();
    const addr = server.httpServer.address();
    if (typeof addr !== 'object' || !addr) {
      throw new Error('load-test server has no port');
    }
    target = `http://127.0.0.1:${addr.port}`;
  }

  try {
    const results = await Promise.all(
      Array.from({ length: rooms }, () => playRoom(target!, samplesPerRoom)),
    );
    const samples = results.flat();
    const p95 = percentile(samples, 95);
    const p50 = percentile(samples, 50);
    console.log(
      JSON.stringify({
        rooms,
        samples: samples.length,
        p50_ms: Number(p50.toFixed(2)),
        p95_ms: Number(p95.toFixed(2)),
      }),
    );
    console.log(`p95 move latency: ${p95.toFixed(2)}ms (n=${samples.length})`);
    if (samples.length === 0 || Number.isNaN(p95)) {
      process.exitCode = 1;
    }
  } finally {
    if (server) {
      await server.stop();
    }
  }
}

void main();
