import { describe, expect, it } from 'vitest';
import { turnCopy } from './turnCopy';

describe('turnCopy', () => {
  it('matches board-start.png for Kingston awaiting a roll', () => {
    expect(
      turnCopy({ phase: 'awaiting_roll', dice: null, turn: 'red', winner: null, isMine: true, name: 'Dean', canBringOut: false }),
    ).toEqual({ kicker: 'KINGSTON · DEAN', title: "IT'S YOUR TURN", sub: 'Tap the dice to roll', cta: 'TAP TO ROLL' });
  });

  it('matches board-midgame.png after rolling a 6 with yard pieces available', () => {
    expect(
      turnCopy({ phase: 'awaiting_move', dice: 6, turn: 'red', winner: null, isMine: true, name: 'Dean', canBringOut: true }),
    ).toEqual({ kicker: 'KINGSTON · DEAN', title: 'YOU ROLLED A 6!', sub: 'Move a piece or bring one out', cta: 'PICK A PIECE' });
  });

  it('names the place and player when another device has the turn', () => {
    const copy = turnCopy({ phase: 'awaiting_move', dice: 4, turn: 'green', winner: null, isMine: false, name: 'Shanice', canBringOut: false });
    expect(copy.kicker).toBe('OCHO RIOS · SHANICE');
    expect(copy.title).toBe('SHANICE ROLLED A 4');
    expect(copy.cta).toBeNull();
  });

  it('falls back to the place name without a player name', () => {
    const copy = turnCopy({ phase: 'awaiting_roll', dice: null, turn: 'blue', winner: null, isMine: false, canBringOut: false });
    expect(copy.kicker).toBe('NEGRIL');
    expect(copy.title).toBe("NEGRIL'S TURN");
  });

  it('announces the winner by place', () => {
    const copy = turnCopy({ phase: 'finished', dice: null, turn: 'red', winner: 'yellow', isMine: false, canBringOut: false });
    expect(copy.title).toBe('MONTEGO BAY WINS!');
  });
});
