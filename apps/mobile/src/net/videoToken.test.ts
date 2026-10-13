import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchVideoToken, readVideoToken } from './videoToken';

describe('readVideoToken', () => {
  it('reads the token and optional LiveKit URL', () => {
    expect(readVideoToken({ success: true, token: 'jwt', url: 'wss://lk' })).toEqual({
      token: 'jwt',
      url: 'wss://lk',
    });
    expect(readVideoToken({ success: true, token: 'jwt' })).toEqual({
      token: 'jwt',
      url: null,
    });
  });

  it('returns the server error when the token is missing', () => {
    expect(readVideoToken({ success: false, error: 'LiveKit configuration missing' })).toEqual({
      error: 'LiveKit configuration missing',
    });
  });
});

describe('fetchVideoToken', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('warns on a failed fetch without logging the session token', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline');
      }),
    );

    await expect(fetchVideoToken('ABCD', 'player-1', 'session-secret')).resolves.toEqual({
      error: 'offline',
    });
    expect(warn).toHaveBeenCalledWith('[Video] token fetch failed', 'offline');
    expect(warn.mock.calls.flat().join(' ')).not.toContain('session-secret');
  });

  it('warns on a server error without logging the token', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        json: async () => ({ success: false, error: 'LiveKit configuration missing' }),
      })),
    );

    await expect(fetchVideoToken('ABCD', 'player-1', 'session-secret')).resolves.toEqual({
      error: 'LiveKit configuration missing',
    });
    expect(warn).toHaveBeenCalledWith('[Video] token fetch failed', 'LiveKit configuration missing');
    expect(warn.mock.calls.flat().join(' ')).not.toContain('session-secret');
  });
});
