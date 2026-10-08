import { describe, expect, it } from 'vitest';
import type { HouseRules } from '@ludi/protocol';
import { buildFinishedMatch } from './buildFinishedMatch.js';

const HOUSE_RULES: HouseRules = {
  maxConsecutiveSixes: 2,
  extraRollOnCapture: false,
  blockadeCanMoveTogether: false,
  exactFinishBonus: false,
  playForPlacements: true,
};

const PLACEMENTS = [
  { playerId: 'p-red', color: 'red' as const, placement: 1 },
  { playerId: 'p-green', color: 'green' as const, placement: 2 },
];

describe('buildFinishedMatch startedAt', () => {
  it('saves the captured game start, not endedAt minus 10 minutes', () => {
    const endedAt = new Date('2026-10-08T12:10:00.000Z');
    const startedAt = new Date('2026-10-08T12:03:12.000Z');

    const match = buildFinishedMatch(
      'ABCDE',
      HOUSE_RULES,
      PLACEMENTS,
      endedAt,
      startedAt,
      (playerId) => playerId,
    );

    expect(match).not.toBeNull();
    expect(match!.startedAt.toISOString()).toBe('2026-10-08T12:03:12.000Z');
    expect(match!.endedAt.toISOString()).toBe('2026-10-08T12:10:00.000Z');
  });

  it('falls back to endedAt when no start was captured', () => {
    const endedAt = new Date('2026-10-08T12:10:00.000Z');

    const match = buildFinishedMatch(
      'ABCDE',
      HOUSE_RULES,
      PLACEMENTS,
      endedAt,
      undefined,
      (playerId) => playerId,
    );

    expect(match).not.toBeNull();
    expect(match!.startedAt.toISOString()).toBe('2026-10-08T12:10:00.000Z');
    expect(match!.endedAt.toISOString()).toBe('2026-10-08T12:10:00.000Z');
  });
});
