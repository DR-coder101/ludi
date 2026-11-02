import { afterEach, describe, expect, it, vi } from 'vitest';
import { authService } from './authService';
import { historyService } from './historyService';
import { profileService } from './profileService';

vi.mock('../net/authHeaders', () => ({
  authHeaders: () => ({ 'Content-Type': 'application/json' }),
}));

const RAILWAY_URL = 'https://server-production-3749.up.railway.app';

const PROFILE = {
  id: 'u1',
  displayName: 'Guest',
  avatarUrl: null,
  isGuest: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('service HTTP base URL', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('auth, history, and profile fetch the Railway host when EXPO_PUBLIC_SOCKET_URL is unset', async () => {
    expect(process.env.EXPO_PUBLIC_SOCKET_URL).toBeUndefined();

    const fetchMock = vi.fn(async (input: RequestInfo) => {
      const url = String(input);
      if (url.includes('/auth/')) {
        return { json: async () => ({ success: true, userId: 'u1', accessToken: 't1' }) };
      }
      if (url.includes('/matches/')) {
        return { json: async () => ({ success: true, matches: [] }) };
      }
      if (url.includes('/profile/')) {
        return { json: async () => ({ success: true, profile: PROFILE }) };
      }
      throw new Error(`unexpected url ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    await authService.createGuest();
    await historyService.getUserMatches('u1');
    await profileService.getProfile('u1');

    const urls = fetchMock.mock.calls.map((call) => String(call[0]));
    expect(urls).toEqual([
      `${RAILWAY_URL}/auth/guest`,
      `${RAILWAY_URL}/matches/u1?limit=50`,
      `${RAILWAY_URL}/profile/u1`,
    ]);
  });
});
