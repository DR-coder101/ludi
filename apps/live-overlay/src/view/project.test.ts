import { describe, expect, it } from 'vitest';
import type { GameState } from '@ludi/rules';
import type { LiveEvent, LiveGameState, Seat } from '@ludi/live-game';
import { project, screenForPhase } from './project.js';

const houseRules = {
  maxConsecutiveSixes: 2 as const,
  extraRollOnCapture: false,
  blockadeCanMoveTogether: false,
  exactFinishBonus: false,
  playForPlacements: false,
};

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
    occupant: name
      ? { platform: 'dev', userId: name.toLowerCase(), displayName: name }
      : null,
  };
}

function emptyGame(turn: GameState['turn'] = 'red'): GameState {
  const colors = ['red', 'green', 'yellow', 'blue'] as const;
  return {
    config: { playerColors: [...colors], houseRules },
    tokens: colors.flatMap((color) =>
      ([0, 1, 2, 3] as const).map((index) => ({ color, index, pos: { zone: 'yard' as const } })),
    ),
    turn,
    phase: 'awaiting_roll',
    dice: null,
    extraRollEarned: false,
    consecutiveSixes: 0,
    winner: null,
    placements: [],
  };
}

function midGame(): GameState {
  const game = emptyGame('red');
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

function baseSnapshot(over: Partial<LiveGameState> = {}): LiveGameState {
  return {
    phase: 'WAITING',
    seats: [
      seat('kingston', 'red', '#E4202E', 'Dave'),
      seat('ochoRios', 'green', '#0FAE47', 'Mike'),
      seat('montegoBay', 'yellow', '#FED100', null),
      seat('negril', 'blue', '#26272B', null, '#D9DCE1'),
    ],
    queue: [],
    sitOut: [],
    paused: false,
    phaseEndsAt: null,
    turnEndsAt: null,
    winnerUserId: null,
    winnerStay: null,
    game: null,
    countdownBeat: null,
    ...over,
  };
}

describe('screenForPhase', () => {
  it('maps each live phase to one overlay screen', () => {
    expect(screenForPhase('INTRO')).toBe('intro');
    expect(screenForPhase('WAITING')).toBe('waiting');
    expect(screenForPhase('COUNTDOWN')).toBe('countdown');
    expect(screenForPhase('PLAYING')).toBe('game');
    expect(screenForPhase('WINNER')).toBe('winner');
  });
});

describe('project', () => {
  it('projects a 2/4 waiting snapshot onto seated and open towns', () => {
    const view = project(baseSnapshot(), [], { lastWinnerName: '@Dave' });
    expect(view.kind).toBe('waiting');
    if (view.kind !== 'waiting') return;
    expect(view.joined).toBe(2);
    expect(view.full).toBe(false);
    expect(view.lastWinnerName).toBe('@Dave');
    expect(view.seats[0]?.filled).toBe(true);
    expect(view.seats[0]?.handle).toBe('@Dave');
    expect(view.seats[2]?.filled).toBe(false);
    expect(view.seats[3]?.filled).toBe(false);
  });

  it('builds a Kingston turn card from the playing snapshot', () => {
    const view = project(
      baseSnapshot({
        phase: 'PLAYING',
        game: midGame(),
        turnEndsAt: 18_000,
        seats: [
          seat('kingston', 'red', '#E4202E', 'Dave'),
          seat('ochoRios', 'green', '#0FAE47', 'Mike'),
          seat('montegoBay', 'yellow', '#FED100', 'Sarah'),
          seat('negril', 'blue', '#26272B', 'John', '#D9DCE1'),
        ],
      }),
      [{ type: 'turnStarted', userId: 'dave', color: 'red', town: 'kingston', endsAt: 18_000 }],
      { now: 0, showTurnCard: true, gameNumber: 24 },
    );
    expect(view.kind).toBe('game');
    if (view.kind !== 'game') return;
    expect(view.turn.town).toBe('kingston');
    expect(view.turn.hex).toBe('#E4202E');
    expect(view.turn.handle).toBe('@Dave');
    expect(view.turn.possessive).toBe('@DAVE’S');
    expect(view.turn.timerLabel).toBe('00:18');
    expect(view.showTurnCard).toBe(true);
    expect(view.seats[0]?.outCount).toBe(2);
    expect(view.seats[3]?.outCount).toBe(3);
  });

  it('counts the winner stay ring and marks the last 5s urgent', () => {
    const seats: LiveGameState['seats'] = [
      seat('kingston', 'red', '#E4202E', 'Dave'),
      seat('ochoRios', 'green', '#0FAE47', 'Mike'),
      seat('montegoBay', 'yellow', '#FED100', 'Sarah'),
      seat('negril', 'blue', '#26272B', 'John', '#D9DCE1'),
    ];
    const game = emptyGame('red');
    game.phase = 'finished';
    game.winner = 'red';
    game.tokens.forEach((t) => {
      if (t.color === 'red') t.pos = { zone: 'home' };
    });
    const late = project(
      baseSnapshot({
        phase: 'WINNER',
        seats,
        winnerUserId: 'dave',
        phaseEndsAt: 15_000,
        game,
      }),
      [],
      { now: 11_000 },
    );
    expect(late.kind).toBe('winner');
    if (late.kind !== 'winner') return;
    expect(late.staySeconds).toBe(4);
    expect(late.stayUrgent).toBe(true);
    expect(late.winnerTown).toBe('kingston');
    expect(late.winnerHandle).toBe('@Dave');

    const early = project(
      baseSnapshot({
        phase: 'WINNER',
        seats,
        winnerUserId: 'dave',
        phaseEndsAt: 15_000,
        game,
      }),
      [],
      { now: 0 },
    );
    expect(early.kind).toBe('winner');
    if (early.kind !== 'winner') return;
    expect(early.staySeconds).toBe(15);
    expect(early.stayUrgent).toBe(false);
    expect(early.seatsOpen).toBe(3);
  });

  it('turns a joined event into a waiting toast', () => {
    const events: LiveEvent[] = [
      { type: 'joined', userId: 'dave', displayName: 'Dave', town: 'kingston' },
    ];
    const view = project(baseSnapshot(), events);
    expect(view.kind).toBe('waiting');
    if (view.kind !== 'waiting') return;
    expect(view.toast).toBe('@Dave joined Kingston!');
  });
});
