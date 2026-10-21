import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { io as ioClient, Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  DiceRolledPayload,
  GameState,
  InviteCreateResponse,
  RematchStatePayload,
  RecentOpponentsResponse,
  RoomState,
  ServerToClientEvents,
} from '@ludi/protocol';
import { SERVERS_BUSY } from '@ludi/protocol';
import { legalMoves, type GameState as RulesGameState } from '@ludi/rules';
import { createLudiServer } from './server.js';
import { createDiceAuditLog } from './dice/auditLog.js';

type TestSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const HOUSE_RULES = {
  maxConsecutiveSixes: 2 as const,
  extraRollOnCapture: false,
  blockadeCanMoveTogether: false,
  exactFinishBonus: false,
  playForPlacements: false,
};

function addressPort(server: ReturnType<typeof createLudiServer>): number {
  const addr = server.httpServer.address();
  if (typeof addr === 'object' && addr) {
    return addr.port;
  }
  throw new Error('server has no port');
}

function createClient(port: number): TestSocket {
  return ioClient(`http://127.0.0.1:${port}`, {
    transports: ['websocket'],
    reconnection: false,
  });
}

async function waitForConnection(socket: TestSocket): Promise<void> {
  if (socket.connected) {
    return;
  }
  await new Promise<void>((resolve, reject) => {
    socket.once('connect', resolve);
    socket.once('connect_error', reject);
    setTimeout(() => reject(new Error('Connection timeout')), 4000);
  });
}

async function createRoom(client: TestSocket, name: string): Promise<{ roomCode: string; playerId: string }> {
  return new Promise((resolve, reject) => {
    client.emit(
      'room:create',
      { displayName: name, houseRules: HOUSE_RULES },
      (response) => {
        if (!response.success || !response.roomCode || !response.playerId) {
          reject(new Error(response.error ?? 'create failed'));
          return;
        }
        resolve({ roomCode: response.roomCode, playerId: response.playerId });
      },
    );
  });
}

async function joinRoom(client: TestSocket, roomCode: string, name: string): Promise<string> {
  return new Promise((resolve, reject) => {
    client.emit('room:join', { roomCode, displayName: name }, (response) => {
      if (!response.success || !response.playerId) {
        reject(new Error(response.error ?? 'join failed'));
        return;
      }
      resolve(response.playerId);
    });
  });
}

describe('growth server groundwork', () => {
  const diceAudit = createDiceAuditLog();
  let server: ReturnType<typeof createLudiServer>;
  let port: number;

  beforeAll(async () => {
    server = createLudiServer({
      port: 0,
      diceAudit,
      rematchTimeoutMs: 40,
      timingConfig: { gracePeriodMs: 500, aiThinkDelayMs: 0 },
      rateLimit: { maxRequests: 200, windowMs: 1000 },
    });
    await server.start();
    port = addressPort(server);
  });

  afterAll(async () => {
    await server.stop();
  });

  it('records every roll of a simulated full game in the audit log', async () => {
    const clients: TestSocket[] = [];
    const rolls: DiceRolledPayload[] = [];
    let currentGameState: GameState | null = null;
    let gameOver = false;
    let stateVersion = 0;
    let room: RoomState | null = null;

    for (let i = 0; i < 2; i++) {
      const client = createClient(port);
      await waitForConnection(client);
      clients.push(client);
      client.on('game:state', (state) => {
        currentGameState = state;
        stateVersion += 1;
      });
      if (i === 0) {
        client.on('game:diceRolled', (payload) => {
          rolls.push(payload);
        });
      }
      client.on('game:over', () => {
        gameOver = true;
      });
    }

    try {
      const created = await createRoom(clients[0], 'Audit Host');
      clients[0].on('room:state', (state) => {
        room = state;
      });
      await joinRoom(clients[1], created.roomCode, 'Audit Guest');

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('room not full')), 4000);
        const check = () => {
          if (room && room.players.length === 2) {
            clearTimeout(timeout);
            resolve();
            return;
          }
          setTimeout(check, 20);
        };
        check();
      });

      const colorToClient = new Map(room!.players.map((player, index) => [player.color, clients[index]]));
      clients[0].emit('room:ready');

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('game did not start')), 4000);
        const check = () => {
          if (currentGameState) {
            clearTimeout(timeout);
            resolve();
            return;
          }
          setTimeout(check, 20);
        };
        check();
      });

      let turns = 0;
      while (!gameOver && turns < 2000 && currentGameState) {
        turns += 1;
        if (currentGameState.phase === 'finished') {
          break;
        }
        const client = colorToClient.get(currentGameState.turn);
        if (!client) {
          break;
        }
        if (currentGameState.phase === 'awaiting_roll') {
          const before = rolls.length;
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('roll timeout')), 4000);
            client.emit('game:roll', {}, (response) => {
              if (!response.success) {
                clearTimeout(timeout);
                reject(new Error(response.error ?? 'roll failed'));
                return;
              }
              const wait = () => {
                if (rolls.length > before) {
                  clearTimeout(timeout);
                  resolve();
                  return;
                }
                setTimeout(wait, 10);
              };
              wait();
            });
          });
        } else if (currentGameState.phase === 'awaiting_move') {
          const moves = legalMoves(currentGameState as unknown as RulesGameState);
          if (moves.length === 0) {
            await new Promise((resolve) => setTimeout(resolve, 20));
            continue;
          }
          const move = moves[0];
          const versionBefore = stateVersion;
          await new Promise<void>((resolve) => {
            const timeout = setTimeout(resolve, 4000);
            client.emit('game:move', { tokenIndex: move.tokenIndex, dieIndex: move.dieIndex }, (response) => {
              if (!response.success) {
                clearTimeout(timeout);
                resolve();
                return;
              }
              const wait = () => {
                if (stateVersion !== versionBefore) {
                  clearTimeout(timeout);
                  resolve();
                  return;
                }
                setTimeout(wait, 10);
              };
              wait();
            });
          });
        }
      }

      expect(gameOver || currentGameState?.phase === 'finished').toBe(true);
      expect(rolls.length).toBeGreaterThan(0);
      const matchId = diceAudit.list()[0]?.matchId;
      expect(typeof matchId).toBe('string');
      const audited = diceAudit.list(matchId);
      expect(audited).toHaveLength(rolls.length * 2);
      rolls.forEach((roll, index) => {
        const first = audited[index * 2];
        const second = audited[index * 2 + 1];
        expect(first).toMatchObject({
          matchId,
          turn: index + 1,
          playerId: roll.playerId,
          value: roll.values[0],
        });
        expect(second).toMatchObject({
          matchId,
          turn: index + 1,
          playerId: roll.playerId,
          value: roll.values[1],
        });
        expect(first.value).toBeGreaterThanOrEqual(1);
        expect(first.value).toBeLessThanOrEqual(6);
        expect(second.value).toBeGreaterThanOrEqual(1);
        expect(second.value).toBeLessThanOrEqual(6);
      });
    } finally {
      for (const client of clients) {
        client.disconnect();
      }
    }
  }, 300000);

  it('creates a private room from an invite code that is joinable by code', async () => {
    const created = await fetch(`http://127.0.0.1:${port}/invites`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ displayName: 'Inviter', houseRules: HOUSE_RULES, inviterId: 'inviter-raw-1' }),
    });
    expect(created.status).toBe(201);
    const body = (await created.json()) as InviteCreateResponse;
    expect(body.success).toBe(true);
    expect(body.code).toHaveLength(5);
    expect(body.shareUrl).toBe(`http://127.0.0.1:${port}/r/${body.code}`);
    expect(body.inviterId).toMatch(/^[0-9a-f]{16}$/);

    const landing = await fetch(`http://127.0.0.1:${port}/r/${body.code}`);
    expect(landing.status).toBe(200);
    const html = await landing.text();
    expect(html).toContain(`ludi://room/${body.code}`);
    expect(html).toContain('App Store');
    expect(html).toContain('Play Store');

    const guest = createClient(port);
    await waitForConnection(guest);
    try {
      const playerId = await joinRoom(guest, body.code!, 'Invite Guest');
      expect(playerId.length).toBeGreaterThan(0);
    } finally {
      guest.disconnect();
    }

    const events = server.inviteLog.list(body.code);
    expect(events.map((event) => event.kind)).toEqual(['invite_sent', 'invite_opened', 'invite_joined']);
    expect(new Set(events.map((event) => event.inviterId))).toEqual(new Set([body.inviterId]));
    expect(JSON.stringify(events)).not.toContain('inviter-raw-1');
    expect(JSON.stringify(events)).not.toMatch(/@|phone|contact/i);
  });

  it('starts a rematch when every human accepts and expires after 30s', async () => {
    const host = createClient(port);
    const guest = createClient(port);
    await waitForConnection(host);
    await waitForConnection(guest);
    const rematchEvents: RematchStatePayload[] = [];
    host.on('room:rematch', (payload) => {
      rematchEvents.push(payload);
    });

    try {
      const created = await createRoom(host, 'Rematch Host');
      await joinRoom(guest, created.roomCode, 'Rematch Guest');
      const started = new Promise<void>((resolve) => {
        host.once('game:state', () => resolve());
      });
      host.emit('room:ready');
      await started;
      expect(server.finishMatchForTests(created.roomCode)).toBe(true);

      const offered = await new Promise<{ success: boolean; error?: string }>((resolve) => {
        host.emit('room:rematchOffer', {}, (response) => resolve(response));
      });
      expect(offered.success).toBe(true);

      const rematchState = new Promise<GameState>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('rematch game missing')), 4000);
        host.on('game:state', (state) => {
          if (state.phase === 'awaiting_roll' && rematchEvents.some((event) => event.status === 'accepted')) {
            clearTimeout(timeout);
            resolve(state);
          }
        });
      });
      const accepted = await new Promise<{ success: boolean }>((resolve) => {
        guest.emit('room:rematchRespond', { accept: true }, (response) => resolve(response));
      });
      expect(accepted.success).toBe(true);
      expect((await rematchState).phase).toBe('awaiting_roll');
      expect(rematchEvents.some((event) => event.status === 'accepted')).toBe(true);

      const recent = (await (
        await fetch(`http://127.0.0.1:${port}/opponents/recent`, {
          headers: { 'x-ludi-player-id': created.playerId },
        })
      ).json()) as RecentOpponentsResponse;
      expect(recent.success).toBe(true);
      expect(recent.opponents).toHaveLength(1);
      const opponentId = recent.opponents![0].id;
      const blocked = await fetch(`http://127.0.0.1:${port}/opponents/${opponentId}/block`, {
        method: 'POST',
        headers: { 'x-ludi-player-id': created.playerId },
      });
      expect(blocked.status).toBe(200);
      const afterBlock = (await (
        await fetch(`http://127.0.0.1:${port}/opponents/recent`, {
          headers: { 'x-ludi-player-id': created.playerId },
        })
      ).json()) as RecentOpponentsResponse;
      expect(afterBlock.opponents?.[0]?.blocked).toBe(true);
      const removed = await fetch(`http://127.0.0.1:${port}/opponents/${opponentId}`, {
        method: 'DELETE',
        headers: { 'x-ludi-player-id': created.playerId },
      });
      expect(removed.status).toBe(200);
      const afterRemove = (await (
        await fetch(`http://127.0.0.1:${port}/opponents/recent`, {
          headers: { 'x-ludi-player-id': created.playerId },
        })
      ).json()) as RecentOpponentsResponse;
      expect(afterRemove.opponents).toEqual([]);

      expect(server.finishMatchForTests(created.roomCode)).toBe(true);
      const secondOffer = await new Promise<{ success: boolean }>((resolve) => {
        host.emit('room:rematchOffer', {}, (response) => resolve(response));
      });
      expect(secondOffer.success).toBe(true);
      await new Promise((resolve) => setTimeout(resolve, 60));
      expect(rematchEvents.some((event) => event.status === 'expired')).toBe(true);
    } finally {
      host.disconnect();
      guest.disconnect();
    }
  });

  it('rejects new joins with servers busy and still allows in-progress turns', async () => {
    const host = createClient(port);
    const guest = createClient(port);
    await waitForConnection(host);
    await waitForConnection(guest);
    try {
      const created = await createRoom(host, 'Busy Host');
      await joinRoom(guest, created.roomCode, 'Busy Guest');
      const started = new Promise<GameState>((resolve) => {
        host.once('game:state', resolve);
      });
      host.emit('room:ready');
      const game = await started;
      expect(game.phase).toBe('awaiting_roll');

      server.capacity.state.busy = true;
      const outsider = createClient(port);
      await waitForConnection(outsider);
      const createBusy = await new Promise<string | undefined>((resolve) => {
        outsider.emit(
          'room:create',
          { displayName: 'Late', houseRules: HOUSE_RULES },
          (response) => resolve(response.error),
        );
      });
      const joinBusy = await new Promise<string | undefined>((resolve) => {
        outsider.emit(
          'room:join',
          { roomCode: created.roomCode, displayName: 'Late Join' },
          (response) => resolve(response.error),
        );
      });
      outsider.disconnect();
      expect(createBusy).toBe(SERVERS_BUSY);
      expect(joinBusy).toBe(SERVERS_BUSY);

      const rolled = await new Promise<boolean>((resolve) => {
        host.emit('game:roll', {}, (response) => resolve(response.success));
      });
      expect(rolled).toBe(true);
    } finally {
      server.capacity.state.busy = false;
      host.disconnect();
      guest.disconnect();
    }
  });
});
