import {
  STATUS_REASON,
  type ConnectionStatus,
  type TikTokSource,
} from '@ludi/live-connector';
import type { LivePhase } from '@ludi/live-game';
import type { AdminError, TikFinityStep } from '../view/types.js';
import { OVERLAY_FALLBACK_PORT, OVERLAY_PORT } from '../view/types.js';

export type ClassifyInput = {
  status: ConnectionStatus;
  hadConnected: boolean;
  source: TikTokSource;
  livePhase: LivePhase;
  overlayHits: number;
  portError: boolean;
  username: string;
  gameNumber: number;
};

export type Classified = {
  tikfinity: TikFinityStep;
  error: AdminError | null;
  reconnecting: boolean;
  disconnected: boolean;
};

function reasonOf(status: ConnectionStatus): string {
  return status.reason ?? '';
}

export function isUsernameNotFound(reason: string): boolean {
  const text = reason.toLowerCase();
  return (
    text.includes('user_not_found') ||
    text.includes('usernotfound') ||
    text.includes('username not found') ||
    text.includes('user not found') ||
    text.includes('couldn\'t find') ||
    text.includes('could not find') ||
    text.includes('does not exist') ||
    text.includes("doesn't exist") ||
    text.includes('no tiktok account')
  );
}

export function classifyConnector(input: ClassifyInput): Classified {
  if (input.portError) {
    return {
      tikfinity: 'not-running',
      error: { kind: 'port-in-use', wanted: OVERLAY_PORT, fallback: OVERLAY_FALLBACK_PORT },
      reconnecting: false,
      disconnected: false,
    };
  }

  const reason = reasonOf(input.status);

  if (isUsernameNotFound(reason)) {
    return {
      tikfinity: 'not-running',
      error: { kind: 'username-not-found', username: input.username },
      reconnecting: false,
      disconnected: false,
    };
  }

  if (input.hadConnected && reason === STATUS_REASON.TIKFINITY_NOT_RUNNING) {
    return {
      tikfinity: 'not-running',
      error: { kind: 'tikfinity-closed' },
      reconnecting: false,
      disconnected: false,
    };
  }

  const liveEnded =
    reason === STATUS_REASON.STREAM_OFFLINE || reason === STATUS_REASON.TIKFINITY_NOT_LIVE;
  if (input.hadConnected && liveEnded) {
    return {
      tikfinity: 'running-no-live',
      error: { kind: 'live-ended', username: input.username, gameNumber: input.gameNumber },
      reconnecting: false,
      disconnected: false,
    };
  }

  if (input.status.phase === 'reconnecting') {
    return {
      tikfinity: 'running-no-live',
      error: null,
      reconnecting: true,
      disconnected: false,
    };
  }

  if (input.hadConnected && input.status.phase === 'disconnected') {
    return {
      tikfinity: 'running-no-live',
      error: null,
      reconnecting: false,
      disconnected: true,
    };
  }

  if (input.status.phase === 'connected') {
    return {
      tikfinity: 'connected',
      error: null,
      reconnecting: false,
      disconnected: false,
    };
  }

  if (reason === STATUS_REASON.TIKFINITY_NOT_LIVE || input.status.phase === 'connecting') {
    return {
      tikfinity: reason === STATUS_REASON.TIKFINITY_NOT_RUNNING ? 'not-running' : 'running-no-live',
      error: null,
      reconnecting: false,
      disconnected: false,
    };
  }

  if (reason === STATUS_REASON.TIKFINITY_NOT_RUNNING) {
    return {
      tikfinity: 'not-running',
      error: null,
      reconnecting: false,
      disconnected: false,
    };
  }

  return {
    tikfinity: 'not-running',
    error: null,
    reconnecting: false,
    disconnected: false,
  };
}

export function overlayMissingError(overlayHits: number, connected: boolean): AdminError | null {
  if (connected && overlayHits === 0) {
    return { kind: 'overlay-not-loaded' };
  }
  return null;
}
