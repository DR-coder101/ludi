import { describe, expect, it } from 'vitest';
import { readVideoToken } from './videoToken';

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
