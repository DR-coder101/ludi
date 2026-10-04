import { afterEach, describe, expect, it, vi } from 'vitest';
import { runInBackground } from './runInBackground.js';

function nextImmediate(): Promise<void> {
  return new Promise((resolve) => {
    setImmediate(resolve);
  });
}

describe('runInBackground', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns before work starts and logs a rejection without unhandledRejection', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const rejections: unknown[] = [];
    const onRejection = (reason: unknown) => {
      rejections.push(reason);
    };
    process.on('unhandledRejection', onRejection);

    try {
      let started = false;
      const err = new Error('supabase down');
      const returned = runInBackground('match-history:ROOM1', async () => {
        started = true;
        throw err;
      });

      expect(returned).toBeUndefined();
      expect(started).toBe(false);

      await nextImmediate();

      expect(started).toBe(true);
      expect(errorSpy.mock.calls).toEqual([['[match-history:ROOM1]', err]]);
      expect(rejections).toEqual([]);
    } finally {
      process.off('unhandledRejection', onRejection);
    }
  });

  it('logs and swallows a synchronous throw the same way', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const rejections: unknown[] = [];
    const onRejection = (reason: unknown) => {
      rejections.push(reason);
    };
    process.on('unhandledRejection', onRejection);

    try {
      let started = false;
      const err = new Error('sync fail');
      const returned = runInBackground('match-history:ROOM2', () => {
        started = true;
        throw err;
      });

      expect(returned).toBeUndefined();
      expect(started).toBe(false);

      await nextImmediate();

      expect(started).toBe(true);
      expect(errorSpy.mock.calls).toEqual([['[match-history:ROOM2]', err]]);
      expect(rejections).toEqual([]);
    } finally {
      process.off('unhandledRejection', onRejection);
    }
  });
});
