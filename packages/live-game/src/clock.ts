import type { Clock, Rng } from './types.js';

export function createFakeClock(startMs = 0): Clock & { advance: (ms: number) => void } {
  let now = startMs;
  return {
    now: () => now,
    advance: (ms: number) => {
      now += ms;
    },
  };
}

export function createSequenceRng(values: number[]): Rng {
  let i = 0;
  return () => {
    if (values.length === 0) return 0;
    const value = values[i % values.length] ?? 0;
    i += 1;
    return value;
  };
}

/** Faces 1 through 6, repeating. Values sit inside each die bucket so float rounding cannot collapse a face. */
export function createCyclingDiceRng(): Rng {
  return createSequenceRng([0, 0.2, 0.4, 0.5, 0.7, 0.9]);
}

export function systemClock(): Clock {
  return { now: () => Date.now() };
}

export function systemRng(): Rng {
  return () => {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return (buf[0] ?? 0) / 0x1_0000_0000;
  };
}
