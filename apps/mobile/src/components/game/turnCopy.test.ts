import { describe, expect, it } from 'vitest';
import { createGame, type GameState } from '@ludi/rules';
import { turnCopy } from './turnCopy';

const base = createGame({
  playerColors: ['red', 'green'],
  houseRules: {
    maxConsecutiveSixes: 2,
    extraRollOnCapture: false,
    blockadeCanMoveTogether: false,
    exactFinishBonus: false,
    playForPlacements: false,
  },
});
const seats = { red: { name: 'Dean', isYou: true }, green: { name: 'Shanice' } };

function copyFor(patch: Partial<GameState>, myTurn = true, lastRoll: Parameters<typeof turnCopy>[0]['lastRoll'] = null) {
  return turnCopy({ state: { ...base, ...patch }, seats, myTurn, lastRoll });
}

describe('turnCopy', () => {
  it('asks you to roll', () => {
    expect(copyFor({})).toEqual({
      kicker: 'KINGSTON · DEAN',
      title: "IT'S YOUR TURN",
      sub: 'Tap the dice to roll',
      cta: 'roll',
    });
  });

  it('offers bringing a piece out on a 6', () => {
    expect(copyFor({ phase: 'awaiting_move', dice: 6 })).toMatchObject({
      title: 'YOU ROLLED A 6!',
      sub: 'Move a piece or bring one out',
      cta: 'pick',
    });
  });

  it('names the other player online and offers no action', () => {
    expect(copyFor({ turn: 'green' }, false)).toMatchObject({
      kicker: 'OCHO RIOS · SHANICE',
      title: "SHANICE'S TURN",
      cta: null,
    });
  });

  it('explains an auto-passed roll', () => {
    expect(copyFor({ turn: 'green' }, true, { value: 3, color: 'red', passed: true }).sub).toBe(
      'Dean rolled a 3: no moves',
    );
  });

  it('calls out the extra roll after a 6', () => {
    expect(copyFor({}, true, { value: 6, color: 'red', passed: false }).title).toBe('ROLL AGAIN!');
  });
});
