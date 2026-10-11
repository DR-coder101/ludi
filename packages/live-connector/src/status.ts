import type { ConnectionStatus, StatusPhase } from './types.js';

export type StatusEvent =
  | { type: 'connect_requested' }
  | { type: 'connected' }
  | { type: 'offline'; reason: string }
  | { type: 'connect_failed'; reason: string }
  | { type: 'dropped'; reason: string }
  | { type: 'disconnect_requested'; reason: string }
  | { type: 'fatal'; reason: string };

export function reduceStatus(current: ConnectionStatus, event: StatusEvent, at: number): ConnectionStatus {
  const next = applyStatus(current.phase, event);
  if (next.phase === current.phase && next.reason === current.reason) {
    return current;
  }
  return { phase: next.phase, reason: next.reason, at };
}

function applyStatus(
  phase: StatusPhase,
  event: StatusEvent,
): { phase: StatusPhase; reason?: string } {
  switch (event.type) {
    case 'connect_requested':
      if (phase === 'connected' || phase === 'connecting') return { phase };
      return { phase: 'connecting' };
    case 'connected':
      return { phase: 'connected' };
    case 'offline':
      return { phase: 'error', reason: event.reason };
    case 'connect_failed':
      if (phase === 'disconnected') return { phase, reason: event.reason };
      return { phase: 'reconnecting', reason: event.reason };
    case 'dropped':
      if (phase === 'disconnected') return { phase };
      return { phase: 'reconnecting', reason: event.reason };
    case 'disconnect_requested':
      return { phase: 'disconnected', reason: event.reason };
    case 'fatal':
      return { phase: 'error', reason: event.reason };
    default: {
      const _never: never = event;
      return _never;
    }
  }
}

export function initialStatus(at: number): ConnectionStatus {
  return { phase: 'disconnected', at };
}
