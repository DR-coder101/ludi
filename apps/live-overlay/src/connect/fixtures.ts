import type { GameState } from '@ludi/rules';
import type { LiveEvent, LiveGameState, Seat } from '@ludi/live-game';
import type { OverlayIntent } from '../view/types.js';

const houseRules = {
  maxConsecutiveSixes: 2 as const,
  extraRollOnCapture: false,
  blockadeCanMoveTogether: false,
  exactFinishBonus: false,
  playForPlacements: false,
};

function occupant(name: string) {
  return { platform: 'dev', userId: name.toLowerCase(), displayName: name };
}

function seat(
  town: Seat['town'],
  color: Seat['color'],
  hex: string,
  name: string | null,
  borderHex: string | null = null,
): Seat {
  return {
    town,
    color,
    hex,
    borderHex,
    occupant: name ? occupant(name) : null,
  };
}

const FOUR: LiveGameState['seats'] = [
  seat('kingston', 'red', '#E4202E', 'Dave'),
  seat('ochoRios', 'green', '#0FAE47', 'Mike'),
  seat('montegoBay', 'yellow', '#FED100', 'Sarah'),
  seat('negril', 'blue', '#26272B', 'John', '#D9DCE1'),
];

const TWO: LiveGameState['seats'] = [
  seat('kingston', 'red', '#E4202E', 'Dave'),
  seat('ochoRios', 'green', '#0FAE47', 'Mike'),
  seat('montegoBay', 'yellow', '#FED100', null),
  seat('negril', 'blue', '#26272B', null, '#D9DCE1'),
];

function emptyGame(turn: GameState['turn'] = 'red'): GameState {
  const colors = ['red', 'green', 'yellow', 'blue'] as const;
  return {
    config: { playerColors: [...colors], houseRules },
    tokens: colors.flatMap((color) =>
      ([0, 1, 2, 3] as const).map((index) => ({ color, index, pos: { zone: 'yard' as const } })),
    ),
    turn,
    phase: 'awaiting_roll',
    dice: [
      { value: 5, used: false },
      { value: 3, used: false },
    ],
    extraRollEarned: false,
    consecutiveSixes: 0,
    winner: null,
    placements: [],
  };
}

function midGame(turn: GameState['turn'] = 'red'): GameState {
  const game = emptyGame(turn);
  const set = (color: GameState['turn'], index: 0 | 1 | 2 | 3, pos: GameState['tokens'][number]['pos']) => {
    const token = game.tokens.find((t) => t.color === color && t.index === index);
    if (token) token.pos = pos;
  };
  set('red', 0, { zone: 'track', cell: 1 });
  set('red', 1, { zone: 'homeColumn', step: 5 });
  set('green', 0, { zone: 'track', cell: 20 });
  set('green', 1, { zone: 'track', cell: 62 });
  set('yellow', 0, { zone: 'track', cell: 37 });
  set('yellow', 1, { zone: 'track', cell: 54 });
  set('blue', 0, { zone: 'track', cell: 43 });
  set('blue', 1, { zone: 'track', cell: 43 });
  set('blue', 2, { zone: 'track', cell: 28 });
  return game;
}

function winnerGame(): GameState {
  const game = emptyGame('red');
  game.phase = 'finished';
  game.winner = 'red';
  game.tokens.forEach((t) => {
    if (t.color === 'red') t.pos = { zone: 'home' };
    if (t.color === 'green' && t.index < 3) t.pos = { zone: 'home' };
    if (t.color === 'yellow' && t.index < 2) t.pos = { zone: 'home' };
    if (t.color === 'blue' && t.index < 1) t.pos = { zone: 'home' };
  });
  return game;
}

export type DemoId = 'intro' | 'waiting' | 'game' | 'turn' | 'winner';

export type DemoFrame = {
  snapshot: LiveGameState;
  events: LiveEvent[];
  intent: OverlayIntent;
};

export function demoFrame(id: DemoId): DemoFrame {
  switch (id) {
    case 'intro':
      return {
        snapshot: {
          phase: 'INTRO',
          seats: TWO,
          queue: [],
          sitOut: [],
          paused: false,
          phaseEndsAt: 5000,
          turnEndsAt: null,
          winnerUserId: null,
          winnerStay: null,
          game: null,
          countdownBeat: null,
        },
        events: [],
        intent: { now: 0 },
      };
    case 'waiting':
      return {
        snapshot: {
          phase: 'WAITING',
          seats: TWO,
          queue: [],
          sitOut: [],
          paused: false,
          phaseEndsAt: null,
          turnEndsAt: null,
          winnerUserId: null,
          winnerStay: null,
          game: null,
          countdownBeat: null,
        },
        events: [],
        intent: { lastWinnerName: '@Dave', now: 0 },
      };
    case 'game':
      return {
        snapshot: {
          phase: 'PLAYING',
          seats: FOUR,
          queue: [occupant('Tom'), occupant('Lucy')],
          sitOut: [],
          paused: false,
          phaseEndsAt: null,
          turnEndsAt: 18_000,
          winnerUserId: null,
          winnerStay: null,
          game: midGame('red'),
          countdownBeat: null,
        },
        events: [
          { type: 'captured', userId: 'dave', text: '@Dave knocked @Sarah home' },
          { type: 'gift', userId: 'lucy', displayName: 'Lucy', giftId: 'rose', count: 6, text: '@Lucy sent Rose x6' },
        ],
        intent: { showTurnCard: false, gameNumber: 24, now: 0, captureText: '@Dave knocked @Sarah home!', giftText: '@Lucy sent Rose x6' },
      };
    case 'turn':
      return {
        snapshot: {
          phase: 'PLAYING',
          seats: FOUR,
          queue: [occupant('Tom'), occupant('Lucy')],
          sitOut: [],
          paused: false,
          phaseEndsAt: null,
          turnEndsAt: 18_000,
          winnerUserId: null,
          winnerStay: null,
          game: midGame('red'),
          countdownBeat: null,
        },
        events: [{ type: 'turnStarted', userId: 'dave', color: 'red', town: 'kingston', endsAt: 18_000 }],
        intent: {
          showTurnCard: true,
          gameNumber: 24,
          now: 0,
          captureText: '@Dave knocked @Sarah home!',
          giftText: '@Lucy sent Rose x6',
        },
      };
    case 'winner':
      return {
        snapshot: {
          phase: 'WINNER',
          seats: FOUR,
          queue: [occupant('Tom'), occupant('Lucy')],
          sitOut: [],
          paused: false,
          phaseEndsAt: 15_000,
          turnEndsAt: null,
          winnerUserId: 'dave',
          winnerStay: null,
          game: winnerGame(),
          countdownBeat: null,
        },
        events: [{ type: 'winner', userId: 'dave', town: 'kingston', displayName: 'Dave' }],
        intent: { gameNumber: 24, now: 0 },
      };
    default: {
      const _n: never = id;
      return _n;
    }
  }
}
