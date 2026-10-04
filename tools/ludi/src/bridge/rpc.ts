import { createServer } from 'node:http';
import { io as ioClient, type Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  RoomState,
  GameState,
  Color,
  HouseRules,
  LegalMove,
} from '@ludi/protocol';
import { legalMoves, type GameState as RulesGameState } from '@ludi/rules';
import { DEFAULT_HOUSE_RULES, withTimeout } from '../defaults.js';
import { writeSession, type RunDir } from '../runDir.js';

export type BridgeSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface BridgeState {
  socket: BridgeSocket | null;
  url: string;
  room: RoomState | null;
  game: GameState | null;
  sessionToken: string | null;
  playerId: string | null;
  displayName: string | null;
  lastError: string | null;
}

type RpcResult = { ok: true; data: unknown } | { ok: false; error: string; code?: string };

export function createBridgeState(url: string): BridgeState {
  return {
    socket: null,
    url,
    room: null,
    game: null,
    sessionToken: null,
    playerId: null,
    displayName: null,
    lastError: null,
  };
}

function requireSocket(state: BridgeState): BridgeSocket {
  if (!state.socket?.connected) {
    throw Object.assign(new Error('Not connected to the Ludi server'), {
      code: 'PRECONDITION_FAILED',
      hint: 'Run `ludi session open` (or a `ludi play …` flow) first, then retry.',
    });
  }
  return state.socket;
}

async function connectSocket(state: BridgeState): Promise<BridgeSocket> {
  if (state.socket?.connected) return state.socket;
  const socket = ioClient(state.url, {
    transports: ['websocket'],
    reconnection: false,
    autoConnect: false,
  }) as BridgeSocket;

  socket.on('room:state', (room) => {
    state.room = room;
  });
  socket.on('game:state', (game) => {
    state.game = game;
  });
  socket.on('error', (msg) => {
    state.lastError = typeof msg === 'string' ? msg : JSON.stringify(msg);
  });

  await withTimeout(
    new Promise<void>((resolve, reject) => {
      socket.once('connect', () => resolve());
      socket.once('connect_error', (err) => reject(err));
      socket.connect();
    }),
    5000,
    `connect ${state.url}`,
  );

  state.socket = socket;
  return socket;
}

function emitAck<T>(
  socket: BridgeSocket,
  event: Parameters<BridgeSocket['emit']>[0],
  payload: unknown,
  timeoutMs = 5000,
): Promise<T> {
  return withTimeout(
    new Promise<T>((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socket as any).emit(event, payload, (response: T) => {
        resolve(response);
      });
      setTimeout(() => reject(new Error(`${String(event)} ack timed out`)), timeoutMs);
    }),
    timeoutMs + 100,
    String(event),
  );
}

function toRulesState(game: GameState): RulesGameState {
  return game as unknown as RulesGameState;
}

export async function handleRpc(state: BridgeState, run: RunDir, method: string, args: Record<string, unknown>): Promise<RpcResult> {
  try {
    switch (method) {
      case 'ping':
        return { ok: true, data: { url: state.url, connected: !!state.socket?.connected } };

      case 'connect': {
        await connectSocket(state);
        return { ok: true, data: { url: state.url, connected: true } };
      }

      case 'disconnect': {
        if (state.socket) {
          state.socket.disconnect();
          state.socket = null;
        }
        return { ok: true, data: { connected: false } };
      }

      case 'room.create': {
        const socket = await connectSocket(state);
        const displayName = String(args.displayName ?? 'Verifier');
        const houseRules = (args.houseRules as HouseRules | undefined) ?? DEFAULT_HOUSE_RULES;
        const response = await emitAck<{
          success: boolean;
          roomCode?: string;
          sessionToken?: string;
          playerId?: string;
          error?: string;
        }>(socket, 'room:create', { displayName, houseRules });
        if (!response.success) {
          return { ok: false, error: response.error ?? 'room:create failed', code: 'UPSTREAM_ERROR' };
        }
        state.displayName = displayName;
        state.sessionToken = response.sessionToken ?? null;
        state.playerId = response.playerId ?? null;
        writeSession(run, {
          room_code: response.roomCode,
          session_token: response.sessionToken,
          player_id: response.playerId,
          display_name: displayName,
        });
        // room:state is emitted before ack; wait briefly if needed
        await waitFor(() => state.room?.roomCode === response.roomCode, 2000);
        return {
          ok: true,
          data: {
            room_code: response.roomCode,
            session_token: response.sessionToken,
            player_id: response.playerId,
            room: state.room,
          },
        };
      }

      case 'room.join': {
        const socket = await connectSocket(state);
        const roomCode = String(args.roomCode ?? '').toUpperCase();
        const displayName = String(args.displayName ?? state.displayName ?? 'Guest');
        const sessionToken =
          (args.sessionToken as string | undefined) ?? state.sessionToken ?? undefined;
        const response = await emitAck<{
          success: boolean;
          sessionToken?: string;
          playerId?: string;
          isReconnect?: boolean;
          error?: string;
        }>(socket, 'room:join', { roomCode, displayName, sessionToken });
        if (!response.success) {
          return { ok: false, error: response.error ?? 'room:join failed', code: 'UPSTREAM_ERROR' };
        }
        state.displayName = displayName;
        state.sessionToken = response.sessionToken ?? sessionToken ?? null;
        state.playerId = response.playerId ?? state.playerId;
        writeSession(run, {
          room_code: roomCode,
          session_token: state.sessionToken ?? undefined,
          player_id: state.playerId ?? undefined,
          display_name: displayName,
        });
        await waitFor(() => !!state.room, 2000);
        return {
          ok: true,
          data: {
            room_code: roomCode,
            session_token: state.sessionToken,
            player_id: state.playerId,
            is_reconnect: !!response.isReconnect,
            room: state.room,
          },
        };
      }

      case 'room.seat': {
        const socket = requireSocket(state);
        const color = String(args.color) as Color;
        const response = await emitAck<{ success: boolean; error?: string }>(
          socket,
          'room:selectSeat',
          { color },
        );
        if (!response.success) {
          return { ok: false, error: response.error ?? 'seat failed', code: 'CONFLICT' };
        }
        writeSession(run, { color });
        await waitFor(() => state.room?.players.some((p) => p.id === state.playerId && p.color === color), 2000);
        return { ok: true, data: { color, room: state.room } };
      }

      case 'room.ready': {
        const socket = requireSocket(state);
        const wantBots = state.room?.players.length === 1;
        const roomFilled = wantBots
          ? waitFor(
              () =>
                !!state.room &&
                state.room.players.length === 4 &&
                state.room.players.filter((p) => p.status === 'ai-substitute').length === 3,
              5000,
            )
          : Promise.resolve(true);
        const gameStarted = waitFor(() => !!state.game, 5000);
        socket.emit('room:ready');
        await roomFilled;
        await gameStarted;
        if (state.room) {
          const me = state.room.players.find((p) => p.id === state.playerId);
          if (me) writeSession(run, { color: me.color });
        }
        return {
          ok: true,
          data: {
            room: state.room,
            game: state.game,
            bots:
              state.room?.players
                .filter((p) => p.status === 'ai-substitute')
                .map((p) => ({ id: p.id, color: p.color, name: p.displayName })) ?? [],
          },
        };
      }

      case 'room.leave': {
        const socket = requireSocket(state);
        socket.emit('room:leave');
        state.room = null;
        state.game = null;
        writeSession(run, { room_code: undefined, session_token: undefined, player_id: undefined, color: undefined });
        return { ok: true, data: { left: true } };
      }

      case 'room.state': {
        const socket = requireSocket(state);
        socket.emit('room:requestState');
        await waitFor(() => !!state.room, 2000);
        return { ok: true, data: { room: state.room, game: state.game } };
      }

      case 'match.state': {
        requireSocket(state);
        return {
          ok: true,
          data: {
            game: state.game,
            room: state.room,
            my_player_id: state.playerId,
            my_color: state.room?.players.find((p) => p.id === state.playerId)?.color ?? null,
          },
        };
      }

      case 'match.roll': {
        const socket = requireSocket(state);
        if (!state.game) return { ok: false, error: 'No game in progress', code: 'PRECONDITION_FAILED' };
        const myColor = state.room?.players.find((p) => p.id === state.playerId)?.color;
        if (state.game.turn !== myColor) {
          return {
            ok: false,
            error: `Not your turn (turn=${state.game.turn}, you=${myColor})`,
            code: 'PRECONDITION_FAILED',
          };
        }
        if (state.game.phase !== 'awaiting_roll') {
          return {
            ok: false,
            error: `Cannot roll in phase ${state.game.phase}`,
            code: 'PRECONDITION_FAILED',
          };
        }
        const before = state.game;
        const response = await emitAck<{ success: boolean; error?: string }>(socket, 'game:roll', {});
        if (!response.success) {
          return { ok: false, error: response.error ?? 'roll failed', code: 'UPSTREAM_ERROR' };
        }
        await waitFor(() => state.game !== before && state.game?.dice !== null, 5000);
        return { ok: true, data: { game: state.game } };
      }

      case 'match.move': {
        const socket = requireSocket(state);
        const tokenIndex = Number(args.tokenIndex);
        const dieIndex = Number(args.dieIndex) as 0 | 1;
        const response = await emitAck<{ success: boolean; error?: string; hint?: string }>(
          socket,
          'game:move',
          { tokenIndex, dieIndex },
        );
        if (!response.success) {
          return {
            ok: false,
            error: response.error ?? 'move failed',
            code: 'UPSTREAM_ERROR',
          };
        }
        await sleep(50);
        return { ok: true, data: { game: state.game, hint: response.hint } };
      }

      case 'match.playTurn': {
        const socket = requireSocket(state);
        if (!state.game) return { ok: false, error: 'No game in progress', code: 'PRECONDITION_FAILED' };
        const myColor = state.room?.players.find((p) => p.id === state.playerId)?.color;
        if (!myColor) return { ok: false, error: 'Unknown seat color', code: 'PRECONDITION_FAILED' };

        // Wait until it is our turn (bots may be playing).
        await waitFor(() => {
          if (!state.game) return false;
          if (state.game.phase === 'finished') return true;
          return state.game.turn === myColor && state.game.phase === 'awaiting_roll';
        }, Number(args.waitMs ?? 15000));

        if (state.game?.phase === 'finished') {
          return { ok: true, data: { finished: true, game: state.game, moves: [] } };
        }
        if (state.game?.turn !== myColor) {
          return {
            ok: false,
            error: `Timed out waiting for your turn (turn=${state.game?.turn})`,
            code: 'TIMEOUT',
          };
        }

        const moves: unknown[] = [];
        const beforeRoll = state.game;
        const rollResp = await emitAck<{ success: boolean; error?: string }>(socket, 'game:roll', {});
        if (!rollResp.success) {
          return { ok: false, error: rollResp.error ?? 'roll failed', code: 'UPSTREAM_ERROR' };
        }
        await waitFor(() => state.game !== beforeRoll, 5000);
        moves.push({ action: 'roll', dice: state.game?.dice });

        // Play every legal die while it is still our move phase.
        for (let guard = 0; guard < 8; guard++) {
          if (!state.game || state.game.phase !== 'awaiting_move') break;
          if (state.game.turn !== myColor) break;
          const legal = legalMoves(toRulesState(state.game)) as LegalMove[];
          if (legal.length === 0) break;
          const pick = legal[0]!;
          const before = state.game;
          const moveResp = await emitAck<{ success: boolean; error?: string }>(socket, 'game:move', {
            tokenIndex: pick.tokenIndex,
            dieIndex: pick.dieIndex,
          });
          if (!moveResp.success) {
            return { ok: false, error: moveResp.error ?? 'move failed', code: 'UPSTREAM_ERROR' };
          }
          moves.push({
            action: 'move',
            tokenIndex: pick.tokenIndex,
            dieIndex: pick.dieIndex,
            steps: pick.steps,
          });
          await waitFor(() => state.game !== before, 5000);
        }

        return { ok: true, data: { game: state.game, moves } };
      }

      default:
        return {
          ok: false,
          error: `Unknown bridge method: ${method}`,
          code: 'INVALID_ARGS',
        };
    }
  } catch (err) {
    const e = err as Error & { code?: string; hint?: string };
    return { ok: false, error: e.message, code: e.code };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitFor(pred: () => boolean, ms: number): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < ms) {
    if (pred()) return;
    await sleep(25);
  }
  if (!pred()) throw Object.assign(new Error('Condition not met in time'), { code: 'TIMEOUT' });
}

/** Run the bridge as an HTTP JSON-RPC server on an ephemeral port. */
export async function startBridgeHttp(run: RunDir, url: string): Promise<{ port: number; close: () => Promise<void> }> {
  const state = createBridgeState(url);
  await connectSocket(state);

  const server = createServer(async (req, res) => {
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: true, connected: !!state.socket?.connected }));
      return;
    }
    if (req.method !== 'POST' || req.url !== '/rpc') {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    let body: { method: string; args?: Record<string, unknown> };
    try {
      body = JSON.parse(Buffer.concat(chunks).toString('utf8')) as typeof body;
    } catch {
      res.writeHead(400, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Invalid JSON body' }));
      return;
    }
    const result = await handleRpc(state, run, body.method, body.args ?? {});
    res.writeHead(result.ok ? 200 : 400, { 'content-type': 'application/json' });
    res.end(JSON.stringify(result));
  });

  const port = await new Promise<number>((resolve, reject) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') resolve(addr.port);
      else reject(new Error('Failed to bind bridge port'));
    });
  });

  return {
    port,
    close: async () => {
      if (state.socket) state.socket.disconnect();
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    },
  };
}
