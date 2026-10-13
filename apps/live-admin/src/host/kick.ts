import type { LiveGame } from '@ludi/live-game';

export type KickRequest = {
  type: 'kick';
  userId: string;
  confirm?: unknown;
};

export type KickGate =
  | { ok: true; userId: string }
  | { ok: false; error: 'confirm required' | 'missing user' };

export function gateKick(action: KickRequest): KickGate {
  if (typeof action.userId !== 'string' || action.userId.length === 0) {
    return { ok: false, error: 'missing user' };
  }
  if (action.confirm !== true) {
    return { ok: false, error: 'confirm required' };
  }
  return { ok: true, userId: action.userId };
}

export function applyConfirmedKick(live: LiveGame, userId: string) {
  return live.handleAdmin({ type: 'kick', userId });
}
