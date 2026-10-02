import type { Die } from '@ludi/rules';
import type { MoveLike } from '../board/boardModel';

export type DieIndex = 0 | 1;

/** Faces before anyone has thrown: the start mockup's 5, plus a 2. */
const IDLE_FACES: Die[] = [
  { value: 5, used: false },
  { value: 2, used: false },
];

/**
 * The two dice the turn card draws: the live throw while it is being played,
 * else the last throw seen (kept after the engine clears `dice`), else idle faces.
 */
export function diceFaces(dice: readonly Die[] | null, lastRoll: readonly [number, number] | null): Die[] {
  if (dice) return dice.map((d) => ({ ...d }));
  if (lastRoll) return lastRoll.map((value) => ({ value, used: false }));
  return IDLE_FACES;
}

/**
 * Die a token tap plays: the player's pick while it still has a move, else the
 * first die that does. Null when no die can be played.
 */
export function activeDie(moves: readonly MoveLike[], picked: DieIndex | null): DieIndex | null {
  if (picked !== null && moves.some((m) => m.dieIndex === picked)) return picked;
  return moves[0]?.dieIndex ?? null;
}

/** Choosing a die only matters when both are playable and show different values. */
export function canPickDie(moves: readonly MoveLike[]): boolean {
  return new Set(moves.map((m) => m.steps)).size > 1;
}

/** Move for a tapped token: with the active die when it can, else with the other die. */
export function moveForToken(
  moves: readonly MoveLike[],
  tokenIndex: number,
  active: DieIndex | null,
): MoveLike | undefined {
  return (
    moves.find((m) => m.tokenIndex === tokenIndex && m.dieIndex === active) ??
    moves.find((m) => m.tokenIndex === tokenIndex)
  );
}
