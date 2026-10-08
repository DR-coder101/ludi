import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Color } from '@ludi/protocol';
import type { Database } from './db/types.js';
import { createMockStorage, createMockSupabaseClient } from './db/mock.js';
import { createAuthService } from './services/auth.js';
import { createMatchHistoryService } from './services/matchHistory.js';

const createClientMock = vi.hoisted(() => ({
  client: null as SupabaseClient<Database> | null,
}));

vi.mock('@supabase/supabase-js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@supabase/supabase-js')>();
  return {
    ...actual,
    createClient: (...args: Parameters<typeof actual.createClient>) => {
      if (createClientMock.client) {
        return createClientMock.client;
      }
      return actual.createClient(...args);
    },
  };
});

const houseRules = {
  maxConsecutiveSixes: 2 as const,
  extraRollOnCapture: false,
  blockadeCanMoveTogether: false,
  exactFinishBonus: false,
  playForPlacements: true,
};

describe('guest sign-in does not capture the shared supabase client', () => {
  const originalUrl = process.env.SUPABASE_URL;
  const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  beforeEach(() => {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    createClientMock.client = null;
  });

  afterEach(() => {
    if (originalUrl === undefined) {
      delete process.env.SUPABASE_URL;
    } else {
      process.env.SUPABASE_URL = originalUrl;
    }
    if (originalKey === undefined) {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    } else {
      process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
    }
    createClientMock.client = null;
  });

  it('keeps the shared client session empty and still saves match history', async () => {
    const storage = createMockStorage();
    const shared = createMockSupabaseClient(storage);
    const throwaway = createMockSupabaseClient(storage);
    createClientMock.client = throwaway;

    const auth = createAuthService(shared);
    const history = createMatchHistoryService(shared);
    const guest = await auth.createGuest('IsolatedGuest');

    expect(throwaway).not.toBe(shared);

    const sharedSession = await shared.auth.getSession();
    expect(sharedSession.data.session).toBeNull();

    const throwawaySession = await throwaway.auth.getSession();
    expect(throwawaySession.data.session?.user.id).toBe(guest.userId);
    expect(guest.accessToken).toBe(throwawaySession.data.session?.access_token);

    const matchId = await history.saveMatch({
      roomCode: 'ISO01',
      startedAt: new Date('2024-01-01T10:00:00Z'),
      endedAt: new Date('2024-01-01T10:30:00Z'),
      winnerId: guest.userId,
      houseRules,
      players: [
        { userId: guest.userId, color: 'red' as Color, finalPosition: 1 },
        { userId: 'a'.repeat(32), color: 'green' as Color, finalPosition: 2 },
      ],
    });

    const matches = await history.getUserMatches(guest.userId);
    expect(matches).toHaveLength(1);
    expect(matches[0].id).toBe(matchId);
    expect(matches[0].players.some((player) => player.userId === guest.userId)).toBe(true);
  });
});
