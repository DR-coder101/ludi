import type { MatchHistory, TownId } from '@ludi/protocol';
import { TOWN_LABEL } from './leaderboard.js';
import { matchEndedAt } from './leaderboard.js';

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
    const ended = matchEndedAt(match);
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
