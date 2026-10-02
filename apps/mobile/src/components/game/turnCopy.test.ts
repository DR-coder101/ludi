import { describe, expect, it } from 'vitest';
import type { Die } from '@ludi/rules';
import { turnCopy } from './turnCopy';

const fresh = (a: number, b: number): Die[] => [
  { value: a, used: false },
  { value: b, used: false },
];
const base = {
  consecutiveSixes: 0,
  winner: null,
  canBringOut: false,
  canPickDie: false,
} as const;

describe('turnCopy', () => {
  it('matches board-start.png for Kingston awaiting a roll', () => {
    expect(
      turnCopy({ ...base, phase: 'awaiting_roll', dice: null, turn: 'red', isMine: true, name: 'Dean' }),
    ).toEqual({ kicker: 'KINGSTON · DEAN', title: "IT'S YOUR TURN", sub: 'Tap the dice to roll', cta: 'TAP TO ROLL' });
  });

  it('board-midgame.png with two dice: a throw showing a 6 with yard pieces available', () => {
    expect(
      turnCopy({ ...base, phase: 'awaiting_move', dice: fresh(6, 3), turn: 'red', isMine: true, name: 'Dean', canBringOut: true }),
    ).toEqual({
      kicker: 'KINGSTON · DEAN',
      title: 'YOU ROLLED 6 + 3!',
      sub: 'Bring one out or move — two moves',
      cta: 'PICK A PIECE',
    });
  });

  it('asks for a die first when both dice are playable and differ', () => {
    const copy = turnCopy({ ...base, phase: 'awaiting_move', dice: fresh(2, 5), turn: 'red', isMine: true, canPickDie: true });
    expect(copy.title).toBe('YOU ROLLED 2 + 5');
    expect(copy.sub).toBe('Tap a die, then a piece');
  });

  it('switches to the remaining die after the first is played', () => {
    const dice: Die[] = [
      { value: 6, used: true },
      { value: 3, used: false },
    ];
    const copy = turnCopy({ ...base, phase: 'awaiting_move', dice, turn: 'red', isMine: true });
    expect(copy).toMatchObject({ title: 'PLAY YOUR 3', sub: 'One die left — move a piece 3', cta: 'PICK A PIECE' });
  });

  it('calls out the bonus roll after a throw with a 6', () => {
    const mine = turnCopy({ ...base, phase: 'awaiting_roll', dice: null, consecutiveSixes: 1, turn: 'red', isMine: true });
    expect(mine).toMatchObject({ title: 'ROLL AGAIN!', cta: 'TAP TO ROLL' });

    const theirs = turnCopy({ ...base, phase: 'awaiting_roll', dice: null, consecutiveSixes: 1, turn: 'green', isMine: false });
    expect(theirs.sub).toBe('Bonus roll coming');
  });

  it('names the place and player when another device has the turn', () => {
    const copy = turnCopy({ ...base, phase: 'awaiting_move', dice: fresh(4, 1), turn: 'green', isMine: false, name: 'Shanice' });
    expect(copy.kicker).toBe('OCHO RIOS · SHANICE');
    expect(copy.title).toBe('SHANICE ROLLED 4 + 1');
    expect(copy.cta).toBeNull();
  });

  it('falls back to the place name without a player name', () => {
    const copy = turnCopy({ ...base, phase: 'awaiting_roll', dice: null, turn: 'blue', isMine: false });
    expect(copy.kicker).toBe('NEGRIL');
    expect(copy.title).toBe("NEGRIL'S TURN");
  });

  it('announces the winner by place', () => {
    const copy = turnCopy({ ...base, phase: 'finished', dice: null, turn: 'red', winner: 'yellow', isMine: false });
    expect(copy.title).toBe('MONTEGO BAY WINS!');
  });
});
