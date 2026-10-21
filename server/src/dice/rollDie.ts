import * as crypto from 'crypto';

/** Inclusive 1 through 6. Node's `randomInt` excludes the upper bound. */
export function rollDieFace(): number {
  return crypto.randomInt(1, 7);
}

export function rulesRngFromDie(): number {
  return (rollDieFace() - 1) / 6;
}
