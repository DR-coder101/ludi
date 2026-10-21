import type { Leaderboard, LeaderboardEntry, LeaderboardScope, MatchHistory, PlayerPrefs, TownId } from '@ludi/protocol';
import { TownIdSchema } from '@ludi/protocol';
import { isoWeekId, isoWeekRange } from './isoWeek.js';

export const PLACE_POINTS: Record<number, number> = {
  1: 3,
  2: 2,
  3: 1,
};

export const TOWN_LABEL: Record<TownId, string> = {
  kingston: 'Kingston',
  ochoRios: 'Ocho Rios',
  montegoBay: 'Montego Bay',
  negril: 'Negril',
};

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }
  const compact = (parts[0] ?? '?').replace(/[^A-Za-z0-9]/g, '');
  return compact.slice(0, 2).toUpperCase() || '?';
}

export function pointsForPlacement(position: number | null, isWinner: boolean): number {
  if (position != null && PLACE_POINTS[position] != null) {
    return PLACE_POINTS[position];
  }
  if (isWinner) {
    return PLACE_POINTS[1];
  }
  return 0;
}

export function matchEndedAt(match: MatchHistory): Date {
  return new Date(match.endedAt ?? match.startedAt);
}

export type PrefsLookup = (userId: string) => PlayerPrefs;

const EMPTY_PREFS: PlayerPrefs = { hometown: null, tournamentNotify: false };

export function rankWeekly(input: {
  matches: MatchHistory[];
  now: Date;
  viewerId: string | null;
  scope: LeaderboardScope;
  town?: TownId | null;
  prefsOf: PrefsLookup;
}): Leaderboard {
  const { matches, now, viewerId, scope, prefsOf } = input;
  const town = scope === 'town' ? (input.town ?? null) : null;
  const { week } = isoWeekRange(now);
  const weekId = isoWeekId(now);

  const totals = new Map<string, { displayName: string; points: number; hometown: TownId | null }>();

  for (const match of matches) {
    if (isoWeekId(matchEndedAt(match)) !== weekId) {
      continue;
    }
    for (const player of match.players) {
      const prefs = prefsOf(player.userId) ?? EMPTY_PREFS;
      if (scope === 'town') {
        if (!town || prefs.hometown !== town) {
          continue;
        }
      }
      const isWinner = match.winnerId === player.userId;
      const gained = pointsForPlacement(player.finalPosition, isWinner);
      const prev = totals.get(player.userId);
      if (prev) {
        prev.points += gained;
        prev.displayName = player.displayName;
        prev.hometown = prefs.hometown;
      } else {
        totals.set(player.userId, {
          displayName: player.displayName,
          points: gained,
          hometown: prefs.hometown,
        });
      }
    }
  }

  const sorted = [...totals.entries()].sort((a, b) => {
    if (b[1].points !== a[1].points) {
      return b[1].points - a[1].points;
    }
    return a[1].displayName.localeCompare(b[1].displayName);
  });

  const entries: LeaderboardEntry[] = [];
  let index = 0;
  let lastPoints = Number.POSITIVE_INFINITY;
  let lastRank = 0;
  for (const [userId, row] of sorted) {
    index += 1;
    const rank = row.points === lastPoints ? lastRank : index;
    lastPoints = row.points;
    lastRank = rank;
    entries.push({
      userId,
      displayName: row.displayName,
      initials: initialsFromName(row.displayName),
      hometown: row.hometown,
      points: row.points,
      rank,
    });
  }

  const youEntry = viewerId ? entries.find((entry) => entry.userId === viewerId) ?? null : null;

  return {
    scope,
    week,
    town,
    entries,
    you: {
      rank: youEntry?.rank ?? null,
      points: youEntry?.points ?? 0,
      entry: youEntry,
    },
  };
}

export function parseTown(value: unknown): TownId | null {
  const parsed = TownIdSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
