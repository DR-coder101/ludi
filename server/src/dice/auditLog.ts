import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import type { DiceAuditRecord } from '@ludi/protocol';

export const DICE_AUDIT_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

export type DiceAuditLog = {
  append(record: DiceAuditRecord): void;
  list(matchId?: string): DiceAuditRecord[];
  purge(nowMs?: number): number;
  close(): void;
};

export type DiceAuditLogOptions = {
  filePath?: string;
  now?: () => number;
  retentionMs?: number;
  cleanupIntervalMs?: number;
};

function parseLine(line: string): DiceAuditRecord | null {
  const trimmed = line.trim();
  if (trimmed.length === 0) {
    return null;
  }
  try {
    const raw = JSON.parse(trimmed) as Partial<DiceAuditRecord>;
    if (
      typeof raw.matchId !== 'string' ||
      typeof raw.turn !== 'number' ||
      typeof raw.playerId !== 'string' ||
      typeof raw.value !== 'number' ||
      typeof raw.timestamp !== 'string'
    ) {
      return null;
    }
    return {
      matchId: raw.matchId,
      turn: raw.turn,
      playerId: raw.playerId,
      value: raw.value,
      timestamp: raw.timestamp,
    };
  } catch {
    return null;
  }
}

function loadFile(filePath: string): DiceAuditRecord[] {
  if (!existsSync(filePath)) {
    return [];
  }
  return readFileSync(filePath, 'utf8')
    .split('\n')
    .map(parseLine)
    .filter((row): row is DiceAuditRecord => row !== null);
}

export function createDiceAuditLog(options: DiceAuditLogOptions = {}): DiceAuditLog {
  const now = options.now ?? Date.now;
  const retentionMs = options.retentionMs ?? DICE_AUDIT_RETENTION_MS;
  const filePath = options.filePath;
  const records: DiceAuditRecord[] = filePath ? loadFile(filePath) : [];

  if (filePath) {
    mkdirSync(dirname(filePath), { recursive: true });
  }

  function persistAll(): void {
    if (!filePath) {
      return;
    }
    const body = records.map((row) => JSON.stringify(row)).join('\n');
    writeFileSync(filePath, body === '' ? '' : `${body}\n`, 'utf8');
  }

  function append(record: DiceAuditRecord): void {
    records.push(record);
    if (!filePath) {
      return;
    }
    appendFileSync(filePath, `${JSON.stringify(record)}\n`, 'utf8');
  }

  function list(matchId?: string): DiceAuditRecord[] {
    if (matchId === undefined) {
      return records.slice();
    }
    return records.filter((row) => row.matchId === matchId);
  }

  function purge(nowMs: number = now()): number {
    const cutoff = nowMs - retentionMs;
    const kept = records.filter((row) => {
      const ts = Date.parse(row.timestamp);
      return Number.isFinite(ts) && ts >= cutoff;
    });
    const removed = records.length - kept.length;
    if (removed === 0) {
      return 0;
    }
    records.length = 0;
    records.push(...kept);
    persistAll();
    return removed;
  }

  const cleanupIntervalMs = options.cleanupIntervalMs;
  const timer =
    cleanupIntervalMs !== undefined && cleanupIntervalMs > 0
      ? setInterval(() => {
          purge();
        }, cleanupIntervalMs)
      : null;
  if (timer) {
    timer.unref();
  }

  return {
    append,
    list,
    purge,
    close() {
      if (timer) {
        clearInterval(timer);
      }
    },
  };
}
