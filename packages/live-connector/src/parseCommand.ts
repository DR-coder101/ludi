import {
  DEFAULT_PREFIXES,
  MOVE_PIECES,
  type CommandPrefixes,
  type MovePiece,
  type ParsedCommand,
} from './types.js';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isMovePiece(value: number): value is MovePiece {
  return (MOVE_PIECES as readonly number[]).includes(value);
}

export function normalizePrefixes(raw?: Partial<CommandPrefixes>): CommandPrefixes {
  return {
    join: (raw?.join ?? DEFAULT_PREFIXES.join).trim() || DEFAULT_PREFIXES.join,
    roll: (raw?.roll ?? DEFAULT_PREFIXES.roll).trim() || DEFAULT_PREFIXES.roll,
    move: (raw?.move ?? DEFAULT_PREFIXES.move).trim() || DEFAULT_PREFIXES.move,
  };
}

export function parseCommand(text: string, prefixes?: Partial<CommandPrefixes>): ParsedCommand {
  const configured = normalizePrefixes(prefixes);
  const normalized = text.trim().replace(/\s+/g, ' ').toLowerCase();
  if (!normalized) return { kind: 'ignore' };

  if (normalized === configured.join.toLowerCase()) return { kind: 'join' };
  if (normalized === configured.roll.toLowerCase()) return { kind: 'roll' };

  const moveMatch = normalized.match(
    new RegExp(`^${escapeRegExp(configured.move.toLowerCase())} (\\d+)$`),
  );
  if (!moveMatch) return { kind: 'ignore' };
  const piece = Number(moveMatch[1]);
  if (!isMovePiece(piece)) return { kind: 'ignore' };
  return { kind: 'move', piece };
}

export function isConfiguredCommand(text: string, prefixes?: Partial<CommandPrefixes>): boolean {
  return parseCommand(text, prefixes).kind !== 'ignore';
}
