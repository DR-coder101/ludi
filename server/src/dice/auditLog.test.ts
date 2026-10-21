import { describe, expect, it } from 'vitest';
import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { createDiceAuditLog } from './auditLog.js';

describe('dice audit log', () => {
  it('appends records and lists them by match', () => {
    const log = createDiceAuditLog({ now: () => Date.parse('2026-10-21T00:00:00.000Z') });
    log.append({
      matchId: 'm1',
      turn: 1,
      playerId: 'p1',
      value: 6,
      timestamp: '2026-10-21T00:00:00.000Z',
    });
    log.append({
      matchId: 'm1',
      turn: 1,
      playerId: 'p1',
      value: 3,
      timestamp: '2026-10-21T00:00:00.000Z',
    });
    log.append({
      matchId: 'm2',
      turn: 1,
      playerId: 'p2',
      value: 1,
      timestamp: '2026-10-21T00:00:00.000Z',
    });
    expect(log.list('m1')).toEqual([
      { matchId: 'm1', turn: 1, playerId: 'p1', value: 6, timestamp: '2026-10-21T00:00:00.000Z' },
      { matchId: 'm1', turn: 1, playerId: 'p1', value: 3, timestamp: '2026-10-21T00:00:00.000Z' },
    ]);
    log.close();
  });

  it('purges records older than 90 days and keeps newer ones', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ludi-dice-'));
    const filePath = join(dir, 'audit.jsonl');
    const now = Date.parse('2026-10-21T00:00:00.000Z');
    const log = createDiceAuditLog({ filePath, now: () => now });
    log.append({
      matchId: 'old',
      turn: 1,
      playerId: 'p1',
      value: 2,
      timestamp: '2026-07-22T00:00:00.000Z',
    });
    log.append({
      matchId: 'fresh',
      turn: 1,
      playerId: 'p1',
      value: 5,
      timestamp: '2026-07-24T00:00:00.000Z',
    });
    expect(log.purge(now)).toBe(1);
    expect(log.list().map((row) => row.matchId)).toEqual(['fresh']);
    const reloaded = createDiceAuditLog({ filePath, now: () => now });
    expect(reloaded.list().map((row) => row.matchId)).toEqual(['fresh']);
    log.close();
    reloaded.close();
  });
});
