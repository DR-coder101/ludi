import { describe, expect, it } from 'vitest';
import { visibleOnlineCount } from '@ludi/protocol';
import {
  initialsFromName,
  isJoinCode,
  leaderboardEmptyCopy,
  normalizeJoinCode,
  onlineLabel,
  playStreakDays,
  profileLevel,
  profileTitle,
  rankedChipVisible,
  shareInviteMessage,
  winCount,
} from './homeModel';

describe('home lobby helpers', () => {
  it('builds a share message with the invite URL and room code', () => {
    expect(shareInviteMessage('54Q69', 'https://ludi.test/r/54Q69')).toBe(
      'Play Ludi with me. Code 54Q69\nhttps://ludi.test/r/54Q69',
    );
  });

  it('accepts a five-character join code and rejects shorter input', () => {
    expect(isJoinCode('54q69')).toBe(true);
    expect(normalizeJoinCode('54q-69')).toBe('54Q69');
    expect(isJoinCode('AB')).toBe(false);
  });

  it('hides the online label below 20 and formats a real count at the threshold', () => {
    expect(visibleOnlineCount(19)).toBe(null);
    expect(onlineLabel(19)).toBe(null);
    expect(onlineLabel(20)).toBe('20 Online');
    expect(onlineLabel(1420)).toBe('1,420 Online');
  });

  it('keeps the Ranked chip off unless the flag is on', () => {
    expect(rankedChipVisible(false)).toBe(false);
    expect(rankedChipVisible(true)).toBe(true);
  });

  it('uses empty copy when a board has no rows', () => {
    expect(leaderboardEmptyCopy('weekly', null)).toBe('No finishes this week yet.');
    expect(leaderboardEmptyCopy('town', null)).toBe('Pick a home town in Settings to see this board.');
    expect(leaderboardEmptyCopy('town', 'kingston')).toBe('No finishes from Kingston this week.');
  });

  it('derives title, level, and streak from saved matches', () => {
    expect(profileTitle(null, 4)).toBe(null);
    expect(profileTitle('kingston', 2)).toBe('Kingston Player');
    expect(profileTitle('kingston', 3)).toBe('Kingston Master');
    expect(profileLevel(0)).toBe(1);
    expect(profileLevel(4)).toBe(5);
    expect(initialsFromName('Dean Reid')).toBe('DR');

    const matches = [
      {
        id: 'a',
        startedAt: '2026-10-21T10:00:00Z',
        endedAt: '2026-10-21T10:00:00Z',
        winnerId: 'dean',
        winnerIsBot: false,
        houseRules: {
          maxConsecutiveSixes: 2 as const,
          extraRollOnCapture: false,
          blockadeCanMoveTogether: false as const,
          exactFinishBonus: false,
          playForPlacements: false,
        },
        players: [{ userId: 'dean', displayName: 'Dean', color: 'red' as const, finalPosition: 1 }],
      },
    ];
    expect(playStreakDays(matches, new Date('2026-10-21T12:00:00Z'))).toBe(1);
    expect(playStreakDays(matches, new Date('2026-10-22T12:00:00Z'))).toBe(0);
    expect(winCount(matches, 'dean')).toBe(1);
  });
});
