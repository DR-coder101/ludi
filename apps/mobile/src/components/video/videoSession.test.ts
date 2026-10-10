import { describe, expect, it } from 'vitest';
import {
  resolveVideoSession,
  shouldFetchVideoToken,
  shouldMountLiveKit,
  type VideoConnectFacts,
} from './videoSession';

const ready: VideoConnectFacts = {
  matchStarted: true,
  token: 'lk-jwt',
  url: 'wss://livekit.example',
  liveKitAvailable: true,
  declined: false,
  fetchError: null,
};

describe('resolveVideoSession', () => {
  it('connects only when the match has a token, a URL, and LiveKit', () => {
    expect(resolveVideoSession(ready)).toEqual({
      status: 'live',
      token: 'lk-jwt',
      url: 'wss://livekit.example',
    });
  });

  it('falls back without a token so the game stays playable', () => {
    const facts = { ...ready, token: null, fetchError: 'LiveKit configuration missing' };
    expect(resolveVideoSession(facts)).toEqual({
      status: 'unavailable',
      notice: 'LiveKit configuration missing',
    });
    expect(shouldFetchVideoToken(facts)).toBe(false);
    expect(shouldMountLiveKit(resolveVideoSession(facts))).toBe(false);
  });

  it('falls back when LiveKit is missing (web, Expo Go, tests)', () => {
    const facts = { ...ready, liveKitAvailable: false };
    expect(resolveVideoSession(facts)).toEqual({
      status: 'unavailable',
      notice: 'Video is unavailable on this device.',
    });
    expect(shouldFetchVideoToken(facts)).toBe(false);
    expect(shouldMountLiveKit(resolveVideoSession(facts))).toBe(false);
  });

  it('does not fetch before the match starts or after the player leaves video', () => {
    expect(shouldFetchVideoToken({ ...ready, matchStarted: false, token: null })).toBe(false);
    expect(shouldFetchVideoToken({ ...ready, declined: true, token: null })).toBe(false);
    expect(resolveVideoSession({ ...ready, declined: true })).toEqual({ status: 'declined' });
  });

  it('fetches after the match starts when LiveKit is available and there is no token yet', () => {
    const facts = { ...ready, token: null, url: null };
    expect(shouldFetchVideoToken(facts)).toBe(true);
    expect(resolveVideoSession(facts)).toEqual({ status: 'idle' });
  });
});
