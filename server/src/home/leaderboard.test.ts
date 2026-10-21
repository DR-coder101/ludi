import { describe, expect, it } from 'vitest';
import type { HouseRules, MatchHistory, PlayerPrefs, TownId } from '@ludi/protocol';
import { initialsFromName, pointsForPlacement, rankWeekly } from './leaderboard.js';

const HOUSE: HouseRules = {
  maxConsecutiveSixes: 2,
  extraRollOnCapture: false,
  blockadeCanMoveTogether: false,
  exactFinishBonus: false,
  playForPlacements: false,
};

const NOW = new Date('2026-10-21T12:00:00Z');

function prefs(hometown: TownId | null): PlayerPrefs {
  return { hometown, tournamentNotify: false };
}

function match(
  id: string,
  endedAt: string,
  players: Array<{ userId: string; displayName: string; position: number | null; winner?: boolean }>,
): MatchHistory {
  const winner = players.find((player) => player.winner || player.position === 1);
  return {
    id,
    startedAt: endedAt,
    endedAt,
    winnerId: winner?.userId ?? null,
    winnerIsBot: false,
    houseRules: HOUSE,
    players: players.map((player) => ({
      userId: player.userId,
      displayName: player.displayName,
      color: 'red',
      finalPosition: player.position,
    })),
  };
}

const PREFS: Record<string, PlayerPrefs> = {
  marcus: prefs('montegoBay'),
  shanice: prefs('ochoRios'),
  andre: prefs('negril'),
  dean: prefs('kingston'),
  pat: prefs('kingston'),
};

function prefsOf(userId: string): PlayerPrefs {
  return PREFS[userId] ?? prefs(null);
}

describe('rankWeekly', () => {
  it('ranks this ISO week by placement points and keeps a viewer outside the top 3', () => {
    const matches = [
      match('m1', '2026-10-20T18:00:00Z', [
        { userId: 'marcus', displayName: 'Marcus T.', position: 1 },
        { userId: 'shanice', displayName: 'Shanice B.', position: 2 },
        { userId: 'andre', displayName: 'Andre K.', position: 3 },
        { userId: 'dean', displayName: 'Dean', position: 4 },
      ]),
      match('m2', '2026-10-21T09:00:00Z', [
        { userId: 'marcus', displayName: 'Marcus T.', position: 1 },
        { userId: 'shanice', displayName: 'Shanice B.', position: 2 },
        { userId: 'andre', displayName: 'Andre K.', position: 3 },
      ]),
    ];

    const board = rankWeekly({
      matches,
      now: NOW,
      viewerId: 'dean',
      scope: 'weekly',
      prefsOf,
    });

    expect(board.week).toBe('2026-W43');
    expect(board.entries.map((entry) => [entry.displayName, entry.rank, entry.points])).toEqual([
      ['Marcus T.', 1, 6],
      ['Shanice B.', 2, 4],
      ['Andre K.', 3, 2],
      ['Dean', 4, 0],
    ]);
    expect(board.you).toEqual({
      rank: 4,
      points: 0,
      entry: {
        userId: 'dean',
        displayName: 'Dean',
        initials: 'DE',
        hometown: 'kingston',
        points: 0,
        rank: 4,
      },
    });
  });

  it('gives tied players the same rank and skips the next place', () => {
    const matches = [
      match('tie', '2026-10-21T10:00:00Z', [
        { userId: 'marcus', displayName: 'Marcus T.', position: 1 },
        { userId: 'shanice', displayName: 'Shanice B.', position: 1, winner: true },
        { userId: 'andre', displayName: 'Andre K.', position: 3 },
        { userId: 'dean', displayName: 'Dean', position: 4 },
      ]),
    ];

    const board = rankWeekly({
      matches,
      now: NOW,
      viewerId: 'dean',
      scope: 'weekly',
      prefsOf,
    });

    expect(board.entries.map((entry) => [entry.userId, entry.rank, entry.points])).toEqual([
      ['marcus', 1, 3],
      ['shanice', 1, 3],
      ['andre', 3, 1],
      ['dean', 4, 0],
    ]);
    expect(board.you.rank).toBe(4);
    expect(board.you.entry?.displayName).toBe('Dean');
  });

  it('filters the town board to the chosen hometown and leaves other towns out', () => {
    const matches = [
      match('town', '2026-10-21T11:00:00Z', [
        { userId: 'marcus', displayName: 'Marcus T.', position: 1 },
        { userId: 'dean', displayName: 'Dean', position: 2 },
        { userId: 'pat', displayName: 'Pat Q.', position: 3 },
        { userId: 'shanice', displayName: 'Shanice B.', position: 4 },
      ]),
    ];

    const board = rankWeekly({
      matches,
      now: NOW,
      viewerId: 'dean',
      scope: 'town',
      town: 'kingston',
      prefsOf,
    });

    expect(board.town).toBe('kingston');
    expect(board.entries.map((entry) => entry.userId)).toEqual(['dean', 'pat']);
    expect(board.entries[0]).toMatchObject({ userId: 'dean', points: 2, rank: 1, hometown: 'kingston' });
    expect(board.entries[1]).toMatchObject({ userId: 'pat', points: 1, rank: 2, hometown: 'kingston' });
    expect(board.you.rank).toBe(1);
  });

  it('returns an empty board when this week has no finished matches', () => {
    const matches = [
      match('old', '2026-10-12T12:00:00Z', [
        { userId: 'marcus', displayName: 'Marcus T.', position: 1 },
        { userId: 'dean', displayName: 'Dean', position: 2 },
      ]),
    ];

    const board = rankWeekly({
      matches,
      now: NOW,
      viewerId: 'dean',
      scope: 'weekly',
      prefsOf,
    });

    expect(board.entries).toEqual([]);
    expect(board.you).toEqual({ rank: null, points: 0, entry: null });
  });

  it('ignores players with no hometown on the town tab', () => {
    const matches = [
      match('open', '2026-10-21T08:00:00Z', [
        { userId: 'wanderer', displayName: 'Wanderer', position: 1 },
        { userId: 'dean', displayName: 'Dean', position: 2 },
      ]),
    ];

    const board = rankWeekly({
      matches,
      now: NOW,
      viewerId: 'wanderer',
      scope: 'town',
      town: 'kingston',
      prefsOf,
    });

    expect(board.entries.map((entry) => entry.userId)).toEqual(['dean']);
    expect(board.you.rank).toBe(null);
  });
});

describe('points and initials', () => {
  it('scores first through third and treats a winner without a place as first', () => {
    expect(pointsForPlacement(1, false)).toBe(3);
    expect(pointsForPlacement(2, false)).toBe(2);
    expect(pointsForPlacement(3, false)).toBe(1);
    expect(pointsForPlacement(4, false)).toBe(0);
    expect(pointsForPlacement(null, true)).toBe(3);
    expect(pointsForPlacement(null, false)).toBe(0);
  });

  it('builds initials from a given name plus last initial', () => {
    expect(initialsFromName('Shanice B.')).toBe('SB');
    expect(initialsFromName('Dean')).toBe('DE');
    expect(initialsFromName('')).toBe('?');
  });
});
