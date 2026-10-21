import * as crypto from 'crypto';

/** Inclusive 1 through 6. Node's `randomInt` excludes the upper bound. */
export function rollDieFace(): number {
  return crypto.randomInt(1, 7);
}

/**
 * Adapter for @ludi/rules `rollDice`, which calls rng() once per die and maps
 * [0, 1) through faceFrom. (face - 1) / 6 lands on the matching face.
 */
export function rulesRngFromDie(): number {
  return (rollDieFace() - 1) / 6;
}
