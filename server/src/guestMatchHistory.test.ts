import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { io as ioClient, Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  Color,
  GameOverPayload,
  GameState,
  ServerToClientEvents,
} from '@ludi/protocol';
import { legalMoves, type GameState as RulesGameState } from '@ludi/rules';
import { createMockStorage, createMockSupabaseClient } from './db/mock.js';
import { createLudiServer } from './server.js';

type TestSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const HOUSE_RULES = {
  maxConsecutiveSixes: 2 as const,
  extraRollOnCapture: false,
  blockadeCanMoveTogether: false,
  exactFinishBonus: false,
  playForPlacements: true,
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe('guest match history persist', () => {
  const storage = createMockStorage();
  let server: ReturnType<typeof createLudiServer>;
  let baseUrl: string;

  beforeAll(async () => {
    server = createLudiServer({
      port: 0,
      supabase: createMockSupabaseClient(storage),
      timingConfig: {
        gracePeriodMs: 500,
        aiThinkDelayMs: 10,
      },
    });
    await server.start();
    const address = server.httpServer.address();
    if (typeof address !== 'object' || address === null) {
      throw new Error('Failed to get server address');
    }
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await server.stop();
  });

  it('saves the guest auth user id as the human participant id', async () => {
    const guestRes = await fetch(`${baseUrl}/auth/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: 'GuestHost' }),
    });
    const guestBody = (await guestRes.json()) as {
      success: boolean;
      userId?: string;
    };
    expect(guestRes.status).toBe(200);
    expect(guestBody.success).toBe(true);
    const guestUserId = guestBody.userId;
    expect(guestUserId).toEqual(expect.any(String));

    const client: TestSocket = ioClient(baseUrl, {
      transports: ['websocket'],
      reconnection: false,
      auth: { userId: guestUserId },
    });

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('connect timeout')), 5000);
      client.once('connect', () => {
        clearTimeout(timeout);
        resolve();
      });
      client.once('connect_error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    let roomCode = '';
    let playerId = '';
    let humanColor: Color = 'red';
    let currentGameState: GameState | null = null;
    let gameOverPayload: GameOverPayload | null = null;
    let stateVersion = 0;

    client.on('game:state', (state) => {
      currentGameState = state;
      stateVersion += 1;
    });
    client.on('game:over', (payload) => {
      gameOverPayload = payload;
    });

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('room:create timeout')), 5000);
      client.emit(
        'room:create',
        { displayName: 'GuestHost', houseRules: HOUSE_RULES },
        (response) => {
          clearTimeout(timeout);
          if (!response.success || !response.roomCode || !response.playerId) {
            reject(new Error(response.error ?? 'room:create failed'));
            return;
          }
          roomCode = response.roomCode;
          playerId = response.playerId;
          resolve();
        },
      );
    });

    expect(playerId).not.toBe(guestUserId);

    const roomFilled = new Promise<void>((resolve) => {
      client.on('room:state', (room) => {
        const host = room.players.find((p) => p.id === playerId);
        if (host) {
          humanColor = host.color;
        }
        if (room.players.length === 4 && room.players.filter((p) => p.status === 'ai-substitute').length === 3) {
          resolve();
        }
      });
    });

    client.emit('room:ready');
    await roomFilled;

    const started = Date.now();
    while (!gameOverPayload && Date.now() - started < 180000) {
      if (currentGameState?.phase === 'finished') {
        break;
      }

      if (!currentGameState || currentGameState.turn !== humanColor) {
        await sleep(20);
        continue;
      }

      if (currentGameState.phase === 'awaiting_roll') {
        const versionBefore = stateVersion;
        const rolled = await new Promise<boolean>((resolve) => {
          const timeout = setTimeout(() => resolve(false), 5000);
          client.emit('game:roll', {}, (response) => {
            if (!response.success) {
              clearTimeout(timeout);
              resolve(false);
              return;
            }
            const check = () => {
              if (stateVersion !== versionBefore || gameOverPayload) {
                clearTimeout(timeout);
                resolve(true);
              } else {
                setTimeout(check, 20);
              }
            };
            check();
          });
        });
        if (!rolled) {
          await sleep(120);
        }
        continue;
      }

      if (currentGameState.phase === 'awaiting_move') {
        const moves = legalMoves(currentGameState as unknown as RulesGameState);
        if (moves.length === 0) {
          await sleep(20);
          continue;
        }
        const move = moves[0];
        const versionBefore = stateVersion;
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(() => resolve(), 5000);
          client.emit(
            'game:move',
            { tokenIndex: move.tokenIndex, dieIndex: move.dieIndex },
            (response) => {
              if (!response.success) {
                clearTimeout(timeout);
                resolve();
                return;
              }
              const check = () => {
                if (stateVersion !== versionBefore || gameOverPayload) {
                  clearTimeout(timeout);
                  resolve();
                } else {
                  setTimeout(check, 20);
                }
              };
              check();
            },
          );
        });
        continue;
      }

      await sleep(20);
    }

    expect(gameOverPayload).toBeTruthy();
    expect(roomCode.length).toBe(5);

    const persistDeadline = Date.now() + 3000;
    while (storage.match_players.length === 0 && Date.now() < persistDeadline) {
      await sleep(20);
    }

    const participantIds = storage.match_players.map((row) => row.user_id);
    expect(participantIds).toContain(guestUserId);
    expect(participantIds).not.toContain(playerId);

    const historyRes = await fetch(`${baseUrl}/matches/${encodeURIComponent(guestUserId)}`);
    const historyBody = (await historyRes.json()) as {
      success: boolean;
      matches?: Array<{ players: Array<{ userId: string }> }>;
    };
    expect(historyRes.status).toBe(200);
    expect(historyBody.success).toBe(true);
    expect(historyBody.matches?.some((match) => match.players.some((p) => p.userId === guestUserId))).toBe(
      true,
    );

    client.disconnect();
  }, 240000);
});
