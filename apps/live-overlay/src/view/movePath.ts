import type { TokenPos } from '@ludi/rules';
import type { LiveEvent } from '@ludi/live-game';
import { posKey } from './project.js';
import type { PieceView } from './types.js';

export function framesForMovedPath(path: readonly TokenPos[]): TokenPos[] {
  return path.map((pos) => ({ ...pos }));
}

export function stepAt(path: readonly TokenPos[], index: number): TokenPos | null {
  if (path.length === 0) return null;
  if (index < 0) return path[0] ?? null;
  if (index >= path.length) return path[path.length - 1] ?? null;
  return path[index] ?? null;
}

export function lastMoved(events: readonly LiveEvent[]): Extract<LiveEvent, { type: 'moved' }> | undefined {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const ev = events[i];
    if (ev?.type === 'moved') return ev;
  }
  return undefined;
}

export function applyMovedToPieces(
  pieces: readonly PieceView[],
  moved: Extract<LiveEvent, { type: 'moved' }> | undefined,
  frame: number,
): PieceView[] {
  if (!moved || moved.path.length === 0) return [...pieces];
  const dest = moved.path[moved.path.length - 1];
  if (!dest) return [...pieces];
  const destKey = posKey(dest);
  const pos = stepAt(moved.path, frame) ?? dest;
  return pieces.map((piece) => {
    if (piece.tokenIndex !== moved.tokenIndex) return piece;
    if (posKey(piece.pos) !== destKey) return piece;
    return { ...piece, pos };
  });
}
