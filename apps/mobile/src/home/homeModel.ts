import type { Leaderboard, LeaderboardScope, MatchHistory, TownId } from '@ludi/protocol';
import { TownIdSchema, visibleOnlineCount } from '@ludi/protocol';

export const TOWN_OPTIONS: { id: TownId; label: string }[] = [
  { id: 'kingston', label: 'Kingston' },
  { id: 'ochoRios', label: 'Ocho Rios' },
  { id: 'montegoBay', label: 'Montego Bay' },
  { id: 'negril', label: 'Negril' },
];

export const TOWN_LABEL: Record<TownId, string> = {
  kingston: 'Kingston',
  ochoRios: 'Ocho Rios',
  montegoBay: 'Montego Bay',
  negril: 'Negril',
};

export function emptyLeaderboard(scope: LeaderboardScope, town: TownId | null, week: string): Leaderboard {
  return {
    scope,
    week,
    town,
    entries: [],
    you: { rank: null, points: 0, entry: null },
  };
}

export function shareInviteMessage(code: string, shareUrl: string): string {
  return `Play Ludi with me. Code ${code}\n${shareUrl}`;
}

export function isJoinCode(value: string): boolean {
  return /^[A-Z0-9]{5}$/.test(value.trim().toUpperCase());
}

export function normalizeJoinCode(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
}

export function onlineLabel(count: number): string | null {
  const visible = visibleOnlineCount(count);
  if (visible == null) {
    return null;
  }
  return `${visible.toLocaleString('en-US')} Online`;
}

export function rankedChipVisible(flag: boolean): boolean {
  return flag;
}

export function leaderboardEmptyCopy(scope: LeaderboardScope, hometown: TownId | null): string {
  if (scope === 'town') {
    if (!hometown) {
      return 'Pick a home town in Settings to see this board.';
    }
    return `No finishes from ${TOWN_LABEL[hometown]} this week.`;
  }
  return 'No finishes this week yet.';
}

export function profileTitle(hometown: TownId | null, wins: number): string | null {
  if (!hometown) {
    return null;
  }
  const town = TOWN_LABEL[hometown];
  return wins >= 3 ? `${town} Master` : `${town} Player`;
}

export function profileLevel(finishedMatches: number): number {
  return 1 + Math.max(0, Math.floor(finishedMatches));
}

export function playStreakDays(matches: MatchHistory[], now: Date): number {
  const days = new Set<string>();
  for (const match of matches) {
    const ended = new Date(match.endedAt ?? match.startedAt);
    days.add(ended.toISOString().slice(0, 10));
  }
  let streak = 0;
  const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export function winCount(matches: MatchHistory[], userId: string): number {
  return matches.filter((match) => match.winnerId === userId).length;
}

export function parseHometown(value: unknown): TownId | null {
  const parsed = TownIdSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }
  const compact = (parts[0] ?? '?').replace(/[^A-Za-z0-9]/g, '');
  return compact.slice(0, 2).toUpperCase() || '?';
}
