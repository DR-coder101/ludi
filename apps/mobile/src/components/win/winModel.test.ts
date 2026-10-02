import { describe, expect, it } from 'vitest';
import type { GameState } from '@ludi/rules';
import {
  EMPTY_STATS,
  formatDuration,
  headlineSize,
  placeTitleSize,
  rankColors,
  recordCapture,
  recordRoll,
  winView,
} from './winModel';
import { MOCKUP_ROOM, WIN_NAMES, WIN_STATE, WIN_STATS } from '../../dev/winFixtures';

describe('winView', () => {
  it('maps the mockup finish onto the copy in win.png', () => {
    const view = winView({ state: WIN_STATE, names: WIN_NAMES, roomCode: MOCKUP_ROOM, stats: WIN_STATS });
    expect(view).toEqual({
      kicker: 'GAME OVER · ROOM 7X8K9',
      winner: 'red',
      place: 'KINGSTON',
      headline: 'DEAN RUN DI BOARD!',
      detail: 'All 4 pieces home in 18:42',
      stats: [
        { value: '6', label: 'CAPTURES' },
        { value: '9', label: 'SIXES' },
        { value: '18:42', label: 'TIME' },
      ],
      rows: [
        { rank: 1, color: 'red', name: 'Dean', progress: '4/4 HOME', place: 'KINGSTON', winner: true },
        { rank: 2, color: 'green', name: 'Shanice', progress: '3/4', place: 'OCHO RIOS', winner: false },
        { rank: 3, color: 'yellow', name: 'Marcus', progress: '2/4', place: 'MONTEGO BAY', winner: false },
        { rank: 4, color: 'blue', name: 'Andre', progress: '1/4', place: 'NEGRIL', winner: false },
      ],
    });
  });

  it('returns null until there is a winner', () => {
    expect(winView({ state: { ...WIN_STATE, winner: null }, names: {}, roomCode: null, stats: EMPTY_STATS })).toBeNull();
  });

  it('labels pass and play and falls back to town names', () => {
    const view = winView({ state: WIN_STATE, names: { red: '  ' }, roomCode: null, stats: EMPTY_STATS })!;
    expect(view.kicker).toBe('GAME OVER · PASS & PLAY');
    expect(view.headline).toBe('KINGSTON RUN DI BOARD!');
    expect(view.rows[1].name).toBe('Ocho Rios');
    expect(view.stats.map((s) => s.value)).toEqual(['0', '0', '0:00']);
  });

  it('upper-cases the server room code', () => {
    expect(winView({ state: WIN_STATE, names: WIN_NAMES, roomCode: 'k7q2mx', stats: WIN_STATS })!.kicker).toBe(
      'GAME OVER · ROOM K7Q2MX',
    );
  });
});

describe('rankColors', () => {
  it('lists finishers in placement order before players still on the board', () => {
    const state: GameState = { ...WIN_STATE, placements: ['red', 'blue'] };
    expect(rankColors(state)).toEqual(['red', 'blue', 'green', 'yellow']);
  });

  it('breaks ties on home column, then track, then turn order', () => {
    const state: GameState = {
      ...WIN_STATE,
      config: { ...WIN_STATE.config, playerColors: ['red', 'green', 'yellow', 'blue'] },
      tokens: WIN_STATE.tokens.map((t) =>
        t.color === 'red' ? t : { ...t, pos: t.index === 0 && t.color !== 'blue' ? { zone: 'track', cell: 3 } : { zone: 'yard' } },
      ),
    };
    expect(rankColors(state)).toEqual(['red', 'green', 'yellow', 'blue']);
    const blueAhead: GameState = {
      ...state,
      tokens: state.tokens.map((t) => (t.color === 'blue' && t.index === 0 ? { ...t, pos: { zone: 'homeColumn', step: 2 } } : t)),
    };
    expect(rankColors(blueAhead)).toEqual(['red', 'blue', 'green', 'yellow']);
  });

  it('only ranks seated colours', () => {
    const state: GameState = { ...WIN_STATE, config: { ...WIN_STATE.config, playerColors: ['red', 'yellow'] } };
    expect(rankColors(state)).toEqual(['red', 'yellow']);
  });

  it('puts the winner first even when placements is empty', () => {
    expect(rankColors({ ...WIN_STATE, placements: [] })[0]).toBe('red');
  });
});

describe('match stats', () => {
  it('counts sixes and captures per colour without mutating', () => {
    let stats = recordRoll(EMPTY_STATS, 'red', 6);
    stats = recordRoll(stats, 'red', 3);
    stats = recordRoll(stats, 'red', 6);
    stats = recordCapture(stats, 'green');
    expect(stats.sixes).toEqual({ red: 2 });
    expect(stats.captures).toEqual({ green: 1 });
    expect(EMPTY_STATS).toEqual({ captures: {}, sixes: {}, elapsedMs: 0 });
  });

  it('returns the same object for a roll that is not a six', () => {
    expect(recordRoll(EMPTY_STATS, 'red', 4)).toBe(EMPTY_STATS);
  });
});

describe('formatDuration', () => {
  it.each([
    [0, '0:00'],
    [5_400, '0:05'],
    [(18 * 60 + 42) * 1000, '18:42'],
    [(62 * 60 + 9) * 1000, '1:02:09'],
    [-1, '0:00'],
  ])('%i ms → %s', (ms, out) => {
    expect(formatDuration(ms)).toBe(out);
  });
});

describe('title sizes', () => {
  it('keeps 60pt on the 342pt poster and shrinks MONTEGO BAY on narrower phones', () => {
    expect(placeTitleSize('KINGSTON', 342)).toBe(60);
    expect(placeTitleSize('MONTEGO BAY', 342)).toBe(60);
    expect(placeTitleSize('MONTEGO BAY', 327)).toBe(58);
  });

  it('keeps the mockup headline at 26pt and shrinks long names down to 16pt', () => {
    expect(headlineSize('DEAN RUN DI BOARD!', 310)).toBe(26);
    expect(headlineSize('CHRISTOPHER-ALEXANDER RUN DI BOARD!', 310)).toBe(20);
    expect(headlineSize('X'.repeat(80), 310)).toBe(16);
  });
});
