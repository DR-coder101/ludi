import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { io as ioClient, Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  InviteCreateResponse,
  LeaderboardResponse,
  PlayerPrefsResponse,
  PresenceResponse,
  CasualMatchResponse,
  ServerToClientEvents,
} from '@ludi/protocol';
import { visibleOnlineCount } from '@ludi/protocol';
import { createLudiServer } from '../server.js';

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

describe('home lobby endpoints', () => {
  let server: ReturnType<typeof createLudiServer>;
  let port: number;
  let base: string;

  beforeAll(async () => {
    server = createLudiServer({
      port: 0,
      now: () => Date.parse('2026-10-21T12:00:00Z'),
      rateLimit: { maxRequests: 200, windowMs: 1000 },
    });
    await server.start();
    port = addressPort(server);
    base = `http://127.0.0.1:${port}`;
    server.matchLedger.add({
      id: 'week-1',
      startedAt: '2026-10-20T18:00:00Z',
      endedAt: '2026-10-20T18:00:00Z',
      winnerId: 'marcus',
      winnerIsBot: false,
      houseRules: HOUSE_RULES,
      players: [
        { userId: 'marcus', displayName: 'Marcus T.', color: 'yellow', finalPosition: 1 },
        { userId: 'shanice', displayName: 'Shanice B.', color: 'blue', finalPosition: 1 },
        { userId: 'andre', displayName: 'Andre K.', color: 'green', finalPosition: 3 },
        { userId: 'dean', displayName: 'Dean', color: 'red', finalPosition: 4 },
      ],
    });
    server.playerPrefs.put('marcus', { hometown: 'montegoBay' });
    server.playerPrefs.put('shanice', { hometown: 'ochoRios' });
    server.playerPrefs.put('andre', { hometown: 'negril' });
    server.playerPrefs.put('dean', { hometown: 'kingston' });
  });

  afterAll(async () => {
    await server.stop();
  });

  it('creates a private room from an invite that Join code can enter', async () => {
    const created = await fetch(`${base}/invites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: 'Host', houseRules: HOUSE_RULES }),
    });
    expect(created.status).toBe(201);
    const body = (await created.json()) as InviteCreateResponse;
    expect(body.success).toBe(true);
    expect(body.code).toMatch(/^[A-Z0-9]{5}$/);
    expect(body.shareUrl).toContain(`/r/${body.code}`);

    const guest = createClient(port);
    await waitForConnection(guest);
    const joined = await new Promise<{ success: boolean; error?: string }>((resolve, reject) => {
      guest.emit('room:join', { roomCode: body.code!, displayName: 'Joiner' }, (response) => {
        if (!response.success) {
          reject(new Error(response.error ?? 'join failed'));
          return;
        }
        resolve(response);
      });
    });
    expect(joined.success).toBe(true);
    guest.disconnect();
  });

  it('hides the online count below 20 and reports the raw socket count', async () => {
    const res = await fetch(`${base}/presence`);
    const body = (await res.json()) as PresenceResponse;
    expect(body.success).toBe(true);
    expect(body.count).toBe(0);
    expect(visibleOnlineCount(body.count ?? 0)).toBe(null);
  });

  it('ranks the weekly board with a tie and a viewer outside the top 3', async () => {
    const res = await fetch(`${base}/leaderboard?scope=weekly`, {
      headers: { 'x-ludi-player-id': 'dean' },
    });
    const body = (await res.json()) as LeaderboardResponse;
    expect(body.success).toBe(true);
    expect(body.leaderboard?.entries.map((entry) => [entry.userId, entry.rank, entry.points])).toEqual([
      ['marcus', 1, 3],
      ['shanice', 1, 3],
      ['andre', 3, 1],
      ['dean', 4, 0],
    ]);
    expect(body.leaderboard?.you.rank).toBe(4);
  });

  it('filters the town board to the chosen hometown', async () => {
    const res = await fetch(`${base}/leaderboard?scope=town&town=kingston`, {
      headers: { 'x-ludi-player-id': 'dean' },
    });
    const body = (await res.json()) as LeaderboardResponse;
    expect(body.success).toBe(true);
    expect(body.leaderboard?.entries.map((entry) => entry.userId)).toEqual(['dean']);
    expect(body.leaderboard?.town).toBe('kingston');
  });

  it('stores a hometown pick and a tournament notify flag', async () => {
    const saved = await fetch(`${base}/prefs`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-ludi-player-id': 'pat' },
      body: JSON.stringify({ hometown: 'negril', tournamentNotify: true }),
    });
    const body = (await saved.json()) as PlayerPrefsResponse;
    expect(body.prefs).toEqual({ hometown: 'negril', tournamentNotify: true });

    const read = await fetch(`${base}/prefs`, { headers: { 'x-ludi-player-id': 'pat' } });
    const again = (await read.json()) as PlayerPrefsResponse;
    expect(again.prefs).toEqual({ hometown: 'negril', tournamentNotify: true });
  });

  it('opens a casual public room that a second player can join', async () => {
    const first = await fetch(`${base}/matchmaking/casual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: 'Seeker' }),
    });
    expect(first.status).toBe(201);
    const opened = (await first.json()) as CasualMatchResponse;
    expect(opened.code).toMatch(/^[A-Z0-9]{5}$/);

    const second = await fetch(`${base}/matchmaking/casual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: 'Second' }),
    });
    expect(second.status).toBe(200);
    const joined = (await second.json()) as CasualMatchResponse;
    expect(joined.code).toBe(opened.code);
    expect(joined.playerId).not.toBe(opened.playerId);
  });
});
