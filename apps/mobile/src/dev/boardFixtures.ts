import { createGame, legalMoves, type Color, type GameState, type LegalMove, type TokenPos } from '@ludi/rules';
import type { LastRoll } from '../components/game/turnCopy';
import type { Seats } from '../components/game/types';

const HOUSE_RULES = {
  maxConsecutiveSixes: 2,
  extraRollOnCapture: false,
  blockadeCanMoveTogether: false,
  exactFinishBonus: false,
  playForPlacements: false,
} as const;

export interface BoardFixture {
  state: GameState;
  legalMoves: LegalMove[];
  seats: Seats;
  lastRoll: LastRoll | null;
}

const YARD: TokenPos = { zone: 'yard' };
const track = (cell: number): TokenPos => ({ zone: 'track', cell });
const column = (step: number): TokenPos => ({ zone: 'homeColumn', step });

function place(state: GameState, positions: Record<Color, TokenPos[]>): GameState {
  return {
    ...state,
    tokens: state.tokens.map((t) => ({ ...t, pos: positions[t.color]?.[t.index] ?? t.pos })),
  };
}

/** Two players (Kingston vs Montego Bay), everything in the yards, Kingston to roll. */
export function startFixture(): BoardFixture {
  const state = createGame({ playerColors: ['red', 'yellow'], houseRules: HOUSE_RULES });
  return {
    state,
    legalMoves: [],
    seats: { red: { name: 'Dean', isYou: true }, yellow: { name: 'Marcus' } },
    lastRoll: null,
  };
}

/**
 * Four players mid-game. Kingston has rolled a 6: both yard pieces can come
 * out and the track piece on cell 2 can run to the star on cell 8. Negril
 * holds a blockade (stack of 2) on cell 31.
 */
export function midFixture(): BoardFixture {
  const base = createGame({ playerColors: ['red', 'green', 'yellow', 'blue'], houseRules: HOUSE_RULES });
  const placed = place(base, {
    red: [YARD, YARD, track(2), column(3)],
    green: [YARD, YARD, track(33), column(2)],
    yellow: [YARD, YARD, track(28), track(50)],
    blue: [YARD, track(31), track(31), track(37)],
  });
  const state: GameState = { ...placed, turn: 'red', phase: 'awaiting_move', dice: 6, consecutiveSixes: 1 };
  return {
    state,
    legalMoves: legalMoves(state),
    seats: {
      red: { name: 'Dean', isYou: true },
      green: { name: 'Shanice' },
      yellow: { name: 'Marcus' },
      blue: { name: 'Andre', muted: true },
    },
    lastRoll: { value: 6, color: 'red', passed: false },
  };
}

export function boardFixture(name: string | undefined): BoardFixture {
  return name === 'mid' ? midFixture() : startFixture();
}
