import { describe, expect, it } from 'vitest';
import { createMockStorage, createMockSupabaseClient } from '../db/mock.js';
import { createAuthService } from '../services/auth.js';
import { verifyHandshakeUser } from './verifyHandshakeUser.js';

describe('verifyHandshakeUser', () => {
  it('returns null for a forged userId with no access token', async () => {
    const storage = createMockStorage();
    const supabase = createMockSupabaseClient(storage);
    const auth = createAuthService(supabase);
    const guest = await auth.createGuest('Forged');

    const userId = await verifyHandshakeUser(supabase, { userId: guest.userId });

    expect(userId).toBeNull();
  });

  it('returns the guest id from a valid access token and ignores handshake userId', async () => {
    const storage = createMockStorage();
    const supabase = createMockSupabaseClient(storage);
    const auth = createAuthService(supabase);
    const guest = await auth.createGuest('Token');
    const forgedUserId = crypto.randomUUID();

    const userId = await verifyHandshakeUser(supabase, {
      userId: forgedUserId,
      accessToken: guest.accessToken,
    });

    expect(userId).toBe(guest.userId);
    expect(userId).not.toBe(forgedUserId);
  });

  it('returns null for an invalid access token', async () => {
    const storage = createMockStorage();
    const supabase = createMockSupabaseClient(storage);

    const userId = await verifyHandshakeUser(supabase, {
      userId: crypto.randomUUID(),
      accessToken: 'not-a-real-token',
    });

    expect(userId).toBeNull();
  });

  it('returns null when Supabase is not configured', async () => {
    const userId = await verifyHandshakeUser(null, {
      accessToken: 'mock-token',
    });

    expect(userId).toBeNull();
  });
});
