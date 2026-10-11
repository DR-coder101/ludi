import type { CommandWords, ParsedChat } from './types.js';

export const DEFAULT_COMMANDS: CommandWords = {
  join: 'join',
  roll: 'roll',
  move: 'move',
  stay: 'stay',
  leave: 'leave',
};

export function parseChat(
  text: string,
  prefix: string,
  words: CommandWords,
): ParsedChat {
  const trimmed = text.trim();
  if (!trimmed.startsWith(prefix)) {
    return { kind: 'none' };
  }
  const body = trimmed.slice(prefix.length).trim();
  const parts = body.split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { kind: 'none' };
  }
  const verb = parts[0]!.toLowerCase();
  if (verb === words.join) return { kind: 'join' };
  if (verb === words.roll) return { kind: 'roll' };
  if (verb === words.stay) return { kind: 'stay' };
  if (verb === words.leave) return { kind: 'leave' };
  if (verb === words.move) {
    const n = Number(parts[1]);
    if (n === 1 || n === 2 || n === 3 || n === 4) {
      return { kind: 'move', piece: n };
    }
    return { kind: 'none' };
  }
  return { kind: 'none' };
}
