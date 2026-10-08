import { describe, expect, it } from 'vitest';
import { isTestRuntime, shouldRegisterLiveKitGlobals } from './liveKitRuntime';

describe('shouldRegisterLiveKitGlobals', () => {
  it('registers on a native dev client', () => {
    expect(
      shouldRegisterLiveKitGlobals({
        os: 'android',
        appOwnership: 'guest',
        executionEnvironment: 'bare',
        isTest: false,
      }),
    ).toBe(true);
    expect(
      shouldRegisterLiveKitGlobals({
        os: 'ios',
        appOwnership: null,
        executionEnvironment: null,
        isTest: false,
      }),
    ).toBe(true);
  });

  it('skips web, Expo Go, and tests', () => {
    expect(
      shouldRegisterLiveKitGlobals({
        os: 'web',
        appOwnership: null,
        executionEnvironment: null,
        isTest: false,
      }),
    ).toBe(false);
    expect(
      shouldRegisterLiveKitGlobals({
        os: 'android',
        appOwnership: 'expo',
        executionEnvironment: 'bare',
        isTest: false,
      }),
    ).toBe(false);
    expect(
      shouldRegisterLiveKitGlobals({
        os: 'android',
        appOwnership: null,
        executionEnvironment: 'storeClient',
        isTest: false,
      }),
    ).toBe(false);
    expect(
      shouldRegisterLiveKitGlobals({
        os: 'android',
        appOwnership: 'guest',
        executionEnvironment: 'bare',
        isTest: true,
      }),
    ).toBe(false);
  });
});

describe('isTestRuntime', () => {
  it('detects jest and vitest worker env vars', () => {
    expect(isTestRuntime({ JEST_WORKER_ID: '1' })).toBe(true);
    expect(isTestRuntime({ VITEST: 'true' })).toBe(true);
    expect(isTestRuntime({ VITEST_WORKER_ID: '1' })).toBe(true);
    expect(isTestRuntime({})).toBe(false);
  });
});
