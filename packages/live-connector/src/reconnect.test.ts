import { describe, expect, it } from 'vitest';
import { nextBackoff, waitBackoff, type BackoffOptions } from './reconnect.js';

const options: BackoffOptions = { initialMs: 100, maxMs: 800, jitter: 0.2 };

describe('nextBackoff', () => {
  it('doubles the delay and applies deterministic jitter', () => {
    const clock = { random: () => 0.5 };
    expect(nextBackoff(0, clock, options)).toEqual({ attempt: 1, delayMs: 100 });
    expect(nextBackoff(1, clock, options)).toEqual({ attempt: 2, delayMs: 200 });
    expect(nextBackoff(2, clock, options)).toEqual({ attempt: 3, delayMs: 400 });
    expect(nextBackoff(3, clock, options)).toEqual({ attempt: 4, delayMs: 800 });
    expect(nextBackoff(4, clock, options)).toEqual({ attempt: 5, delayMs: 800 });
  });

  it('uses the low jitter bound when random is 0', () => {
    const clock = { random: () => 0 };
    expect(nextBackoff(0, clock, options)).toEqual({ attempt: 1, delayMs: 80 });
  });

  it('uses the high jitter bound when random is 1', () => {
    const clock = { random: () => 1 };
    expect(nextBackoff(0, clock, options)).toEqual({ attempt: 1, delayMs: 120 });
  });
});

describe('waitBackoff', () => {
  it('advances the fake clock by the delay', async () => {
    let now = 1_000;
    const clock = {
      now: () => now,
      random: () => 0.5,
      async sleep(ms: number) {
        now += ms;
      },
    };
    await waitBackoff({ attempt: 1, delayMs: 250 }, clock);
    expect(now).toBe(1_250);
  });
});
