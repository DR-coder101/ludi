import type { Color, GameState, TokenPos, TokenState } from '@ludi/rules';
import type { MatchStats } from '../components/win/winModel';

const HOME: TokenPos = { zone: 'home' };

function seat(color: Color, positions: TokenPos[]): TokenState[] {
  return positions.map((pos, i) => ({ color, index: i as TokenState['index'], pos }));
}

/** win.png's finish: Kingston all home, Ocho Rios 3, Montego Bay 2, Negril 1. */
export const WIN_STATE: GameState = {
  config: {
    playerColors: ['red', 'green', 'yellow', 'blue'],
    houseRules: {
      maxConsecutiveSixes: 2,
      extraRollOnCapture: false,
      blockadeCanMoveTogether: false,
      exactFinishBonus: false,
      playForPlacements: false,
    },
  },
  tokens: [
    ...seat('red', [HOME, HOME, HOME, HOME]),
    ...seat('green', [HOME, HOME, HOME, { zone: 'homeColumn', step: 4 }]),
    ...seat('yellow', [HOME, HOME, { zone: 'track', cell: 30 }, { zone: 'yard' }]),
    ...seat('blue', [HOME, { zone: 'track', cell: 60 }, { zone: 'yard' }, { zone: 'yard' }]),
  ],
  turn: 'red',
  phase: 'finished',
  dice: null,
  consecutiveSixes: 0,
  winner: 'red',
  placements: ['red'],
};

export const WIN_NAMES: Partial<Record<Color, string>> = {
  red: 'Dean',
  green: 'Shanice',
  yellow: 'Marcus',
  blue: 'Andre',
};

export const WIN_STATS: MatchStats = {
  captures: { red: 6, green: 2, yellow: 3, blue: 1 },
  sixes: { red: 9, green: 7, yellow: 5, blue: 4 },
  elapsedMs: (18 * 60 + 42) * 1000,
};

/** The mockup prints the pack's 5-character sample code. */
export const MOCKUP_ROOM = '7X8K9';

const swap = (c: Color, a: Color, b: Color): Color => (c === a ? b : c === b ? a : c);

function swapRecord<T>(rec: Partial<Record<Color, T>>, a: Color, b: Color): Partial<Record<Color, T>> {
  const out: Partial<Record<Color, T>> = {};
  for (const [c, v] of Object.entries(rec) as [Color, T][]) out[swap(c, a, b)] = v;
  return out;
}

/** The mockup finish with `winner` in Kingston's seat (and Kingston in theirs), for the other posters. */
export function winFixture(winner: Color, players = 4) {
  const seated = WIN_STATE.config.playerColors.slice(0, players);
  const state: GameState = {
    ...WIN_STATE,
    config: { ...WIN_STATE.config, playerColors: seated.map((c) => swap(c, 'red', winner)) },
    tokens: WIN_STATE.tokens.map((t) => ({ ...t, color: swap(t.color, 'red', winner) })),
    winner,
    placements: [winner],
  };
  return {
    state,
    names: swapRecord(WIN_NAMES, 'red', winner),
    stats: { ...WIN_STATS, captures: swapRecord(WIN_STATS.captures, 'red', winner), sixes: swapRecord(WIN_STATS.sixes, 'red', winner) },
  };
}
