import { describe, expect, it } from 'vitest';
import type { MoveLike } from '../board/boardModel';
import { activeDie, canPickDie, diceFaces, moveForToken } from './diceModel';

const move = (tokenIndex: number, dieIndex: 0 | 1, steps: number): MoveLike => ({
  tokenIndex,
  dieIndex,
  steps,
  resulting: { zone: 'track', cell: steps },
});

describe('diceFaces', () => {
  it('prefers the live throw, then the last throw, then idle faces', () => {
    const live = [
      { value: 6, used: true },
      { value: 3, used: false },
    ];
    expect(diceFaces(live, [1, 1])).toEqual(live);
    expect(diceFaces(null, [4, 2])).toEqual([
      { value: 4, used: false },
      { value: 2, used: false },
    ]);
    expect(diceFaces(null, null).map((d) => d.value)).toEqual([5, 2]);
  });
});

describe('activeDie', () => {
  const moves = [move(0, 0, 2), move(0, 1, 5), move(1, 1, 5)];

  it('keeps the pick while it still has a move', () => {
    expect(activeDie(moves, 1)).toBe(1);
  });

  it('falls back to the first playable die', () => {
    expect(activeDie(moves, null)).toBe(0);
    expect(activeDie([move(0, 1, 3)], 0)).toBe(1);
    expect(activeDie([], 0)).toBeNull();
  });
});

describe('canPickDie', () => {
  it('only when both dice are playable with different values', () => {
    expect(canPickDie([move(0, 0, 2), move(0, 1, 5)])).toBe(true);
    expect(canPickDie([move(0, 0, 4), move(0, 1, 4)])).toBe(false);
    expect(canPickDie([move(0, 1, 5), move(1, 1, 5)])).toBe(false);
  });
});

describe('moveForToken', () => {
  it('uses the active die, else the die that can move that token', () => {
    const moves = [move(0, 0, 2), move(0, 1, 5), move(1, 1, 5)];
    expect(moveForToken(moves, 0, 1)).toEqual(move(0, 1, 5));
    expect(moveForToken(moves, 1, 0)).toEqual(move(1, 1, 5));
    expect(moveForToken(moves, 2, 0)).toBeUndefined();
  });
});
