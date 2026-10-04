import { describe, it, expect } from 'vitest';
import { SERVER_URL } from './serverUrl';

describe('SERVER_URL', () => {
  it('defaults to the live Railway Socket.IO host when EXPO_PUBLIC_SOCKET_URL is unset', () => {
    if (process.env.EXPO_PUBLIC_SOCKET_URL) {
      expect(SERVER_URL).toBe(process.env.EXPO_PUBLIC_SOCKET_URL);
      return;
    }
    expect(SERVER_URL).toBe('https://server-production-3749.up.railway.app');
  });
});
