import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createMatchHistoryService } from './services/matchHistory.js';
import { createMockStorage, createMockSupabaseClient } from './db/mock.js';
import { createLudiServer } from './server.js';
import type { Color } from '@ludi/protocol';

const HOUSE_RULES = {
  maxConsecutiveSixes: 2 as const,
  extraRollOnCapture: false,
  blockadeCanMoveTogether: false,
  exactFinishBonus: false,
  playForPlacements: true,
};

async function jsonRequest(
  baseUrl: string,
  method: string,
  path: string,
  opts: { token?: string; body?: unknown } = {},
): Promise<{ status: number; body: Record<string, unknown> }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.token) {
    headers.Authorization = `Bearer ${opts.token}`;
  }
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

async function createGuest(
  baseUrl: string,
  displayName: string,
): Promise<{ userId: string; accessToken: string }> {
  const { status, body } = await jsonRequest(baseUrl, 'POST', '/auth/guest', {
    body: { displayName },
  });
  expect(status).toBe(200);
  expect(body.success).toBe(true);
  expect(body.userId).toEqual(expect.any(String));
  expect(body.accessToken).toEqual(expect.any(String));
  return { userId: body.userId as string, accessToken: body.accessToken as string };
}

describe('profile and matches HTTP auth', () => {
  const storage = createMockStorage();
  const supabase = createMockSupabaseClient(storage);
  let server: ReturnType<typeof createLudiServer>;
  let baseUrl: string;
  let guest: { userId: string; accessToken: string };
  let other: { userId: string; accessToken: string };
  let emailUser: { userId: string; accessToken: string };

  beforeAll(async () => {
    server = createLudiServer({ port: 0, supabase });
    await server.start();
    const address = server.httpServer.address();
    if (typeof address !== 'object' || address === null) {
      throw new Error('Failed to get server address');
    }
    baseUrl = `http://127.0.0.1:${address.port}`;

    guest = await createGuest(baseUrl, 'AuthGuest');
    other = await createGuest(baseUrl, 'OtherGuest');

    const upgraded = await createGuest(baseUrl, 'SoonEmail');
    const upgrade = await jsonRequest(baseUrl, 'POST', '/auth/upgrade', {
      token: upgraded.userId,
      body: { email: 'player@example.com', password: 'secret1' },
    });
    expect(upgrade.status).toBe(200);
    expect(upgrade.body.success).toBe(true);
    emailUser = { userId: upgraded.userId, accessToken: upgraded.accessToken };

    const history = createMatchHistoryService(supabase);
    await history.saveMatch({
      roomCode: 'AUTH1',
      startedAt: new Date('2024-01-01T10:00:00Z'),
      endedAt: new Date('2024-01-01T10:30:00Z'),
      winnerId: guest.userId,
      houseRules: HOUSE_RULES,
      players: [
        { userId: guest.userId, color: 'red' as Color, finalPosition: 1 },
        { userId: other.userId, color: 'green' as Color, finalPosition: 2 },
      ],
    });
    await history.saveMatch({
      roomCode: 'AUTH2',
      startedAt: new Date('2024-01-02T10:00:00Z'),
      endedAt: new Date('2024-01-02T10:30:00Z'),
      winnerId: emailUser.userId,
      houseRules: HOUSE_RULES,
      players: [
        { userId: emailUser.userId, color: 'yellow' as Color, finalPosition: 1 },
        { userId: other.userId, color: 'blue' as Color, finalPosition: 2 },
      ],
    });
  });

  afterAll(async () => {
    await server.stop();
  });

  it('rejects unauthenticated profile and matches reads with 401', async () => {
    const profile = await jsonRequest(baseUrl, 'GET', `/profile/${guest.userId}`);
    expect(profile.status).toBe(401);
    expect(profile.body).toEqual({ success: false, error: 'Missing or invalid authorization' });

    const matches = await jsonRequest(baseUrl, 'GET', `/matches/${guest.userId}`);
    expect(matches.status).toBe(401);
    expect(matches.body).toEqual({ success: false, error: 'Missing or invalid authorization' });
  });

  it('rejects unauthenticated profile updates with 401', async () => {
    const updated = await jsonRequest(baseUrl, 'PUT', `/profile/${guest.userId}`, {
      body: { displayName: 'Hacked' },
    });
    expect(updated.status).toBe(401);
    expect(updated.body).toEqual({ success: false, error: 'Missing or invalid authorization' });
  });

  it('rejects a forged bearer token with 401', async () => {
    const profile = await jsonRequest(baseUrl, 'GET', `/profile/${guest.userId}`, {
      token: 'not-a-real-token',
    });
    expect(profile.status).toBe(401);
    expect(profile.body).toEqual({ success: false, error: 'Missing or invalid authorization' });
  });

  it('rejects another user profile and matches with 403', async () => {
    const profile = await jsonRequest(baseUrl, 'GET', `/profile/${other.userId}`, {
      token: guest.accessToken,
    });
    expect(profile.status).toBe(403);
    expect(profile.body).toEqual({ success: false, error: 'Forbidden' });

    const updated = await jsonRequest(baseUrl, 'PUT', `/profile/${other.userId}`, {
      token: guest.accessToken,
      body: { displayName: 'Hacked' },
    });
    expect(updated.status).toBe(403);
    expect(updated.body).toEqual({ success: false, error: 'Forbidden' });

    const matches = await jsonRequest(baseUrl, 'GET', `/matches/${other.userId}`, {
      token: guest.accessToken,
    });
    expect(matches.status).toBe(403);
    expect(matches.body).toEqual({ success: false, error: 'Forbidden' });
  });

  it('returns the guest caller own profile and lets them update it', async () => {
    const profile = await jsonRequest(baseUrl, 'GET', `/profile/${guest.userId}`, {
      token: guest.accessToken,
    });
    expect(profile.status).toBe(200);
    expect(profile.body.success).toBe(true);
    expect(profile.body.profile).toEqual(
      expect.objectContaining({
        id: guest.userId,
        displayName: 'AuthGuest',
        isGuest: true,
      }),
    );

    const updated = await jsonRequest(baseUrl, 'PUT', `/profile/${guest.userId}`, {
      token: guest.accessToken,
      body: { displayName: 'AuthGuestRenamed' },
    });
    expect(updated.status).toBe(200);
    expect(updated.body.success).toBe(true);
    expect(updated.body.profile).toEqual(
      expect.objectContaining({
        id: guest.userId,
        displayName: 'AuthGuestRenamed',
        isGuest: true,
      }),
    );
  });

  it('returns only the guest caller own matches', async () => {
    const matches = await jsonRequest(baseUrl, 'GET', `/matches/${guest.userId}`, {
      token: guest.accessToken,
    });
    expect(matches.status).toBe(200);
    expect(matches.body.success).toBe(true);
    const rows = matches.body.matches as Array<{ players: Array<{ userId: string }> }>;
    expect(rows).toHaveLength(1);
    expect(rows[0].players.some((player) => player.userId === guest.userId)).toBe(true);
    expect(rows[0].players.some((player) => player.userId === emailUser.userId)).toBe(false);
  });

  it('returns the upgraded email user own profile and matches', async () => {
    const profile = await jsonRequest(baseUrl, 'GET', `/profile/${emailUser.userId}`, {
      token: emailUser.accessToken,
    });
    expect(profile.status).toBe(200);
    expect(profile.body.success).toBe(true);
    expect(profile.body.profile).toEqual(
      expect.objectContaining({
        id: emailUser.userId,
        isGuest: false,
      }),
    );

    const matches = await jsonRequest(baseUrl, 'GET', `/matches/${emailUser.userId}`, {
      token: emailUser.accessToken,
    });
    expect(matches.status).toBe(200);
    expect(matches.body.success).toBe(true);
    const rows = matches.body.matches as Array<{ players: Array<{ userId: string }> }>;
    expect(rows).toHaveLength(1);
    expect(rows[0].players.some((player) => player.userId === emailUser.userId)).toBe(true);
  });
});
