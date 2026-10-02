import { createGame, type Color, type GameState, type TokenPos } from '@ludi/rules';

export type FixtureName = 'start' | 'mid';

/** Players from the approved mockups, by engine colour. */
export const MOCKUP_NAMES: Record<Color, string> = {
  red: 'Dean',
  green: 'Shanice',
  yellow: 'Marcus',
  blue: 'Andre',
};

const yard: TokenPos = { zone: 'yard' };
const track = (cell: number): TokenPos => ({ zone: 'track', cell });
const column = (step: number): TokenPos => ({ zone: 'homeColumn', step });

/**
 * Engine positions behind board-midgame.png (grid cells from lib.js `pieces`):
 * red (16,10)=track 1, (13,9)=home step 5; green (8,14)=20, (15,8)=62;
 * gold (4,8)=37, (10,4)=54; black ×2 on (8,5)=43, (3,10)=28.
 */
const MID_POSITIONS: Record<Color, TokenPos[]> = {
  red: [track(1), column(5), yard, yard],
  green: [track(20), track(62), yard, yard],
  yellow: [track(37), track(54), yard, yard],
  blue: [track(43), track(43), track(28), yard],
};

export function boardFixture(name: FixtureName): GameState {
  const base = createGame({
    playerColors: ['red', 'green', 'yellow', 'blue'],
    houseRules: {
      maxConsecutiveSixes: 2,
      extraRollOnCapture: false,
      blockadeCanMoveTogether: false,
      exactFinishBonus: false,
      playForPlacements: false,
    },
  });
  if (name === 'start') return base;
  return {
    ...base,
    tokens: base.tokens.map((t) => ({ ...t, pos: MID_POSITIONS[t.color][t.index] })),
    phase: 'awaiting_move',
    dice: 6,
    consecutiveSixes: 1,
  };
}
