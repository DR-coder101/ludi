import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SOCKET_SERVER_URL,
  resolveSocketServerUrl,
} from './socketUrl';

describe('resolveSocketServerUrl', () => {
  it('defaults to the live Railway host when EXPO_PUBLIC_SOCKET_URL is unset', () => {
    expect(resolveSocketServerUrl(undefined)).toBe(
      'https://server-production-3749.up.railway.app',
    );
    expect(DEFAULT_SOCKET_SERVER_URL).toBe(
      'https://server-production-3749.up.railway.app',
    );
  });

  it('prefers an explicit EXPO_PUBLIC_SOCKET_URL', () => {
    expect(resolveSocketServerUrl('http://localhost:3000')).toBe(
      'http://localhost:3000',
    );
  });
});
