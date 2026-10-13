import {
  createTikFinityAdapter,
  createTikTokAdapter,
  DEFAULT_TIKTOK_SOURCE,
  initialStatus,
  type ConnectionStatus,
  type GiftEvent,
  type PlatformAdapter,
  type TikTokSource,
} from '@ludi/live-connector';
import { createLiveGame, type AdminAction, type GiftInbound, type LiveGame } from '@ludi/live-game';
import type { AdminError, AdminView, CommandWords, GiftEffectRow, SettingsView } from '../view/types.js';
import {
  DEFAULT_SETTINGS,
  overlayUrl,
  OVERLAY_FALLBACK_PORT,
  OVERLAY_PORT,
} from '../view/types.js';
import { classifyConnector, overlayMissingError } from './classify.js';
import { applyCosmeticGift, setGiftEffect } from './gifts.js';
import { applyConfirmedKick, gateKick } from './kick.js';
import { bindFallbackPort, bindPreferredPort, type BindResult, type ListenFn } from './ports.js';
import { projectRuntime } from './project.js';

export type RuntimeOptions = {
  live?: LiveGame;
  adapter?: PlatformAdapter;
  source?: TikTokSource;
  username?: string;
  now?: () => number;
};

export type Runtime = {
  snapshot: () => AdminView;
  ingestGift: (gift: GiftInbound) => ReturnType<typeof applyCosmeticGift>;
  setGiftEffect: (giftId: string, effect: string) => SettingsView;
  requestKick: (userId: string) => void;
  confirmKick: () => { ok: true } | { ok: false; error: string };
  cancelKick: () => void;
  handleAdmin: (action: AdminAction) => void;
  noteOverlayHit: () => void;
  setStatus: (status: ConnectionStatus) => void;
  bindPreferred: (listen: ListenFn) => Promise<BindResult>;
  useFallbackPort: (listen: ListenFn) => Promise<BindResult>;
  acceptFallback: () => void;
  setUsername: (username: string) => void;
  showOverlayError: () => void;
  live: LiveGame;
};

type Internal = {
  live: LiveGame;
  source: TikTokSource;
  username: string;
  status: ConnectionStatus;
  hadConnected: boolean;
  overlayHits: number;
  overlayPort: number;
  portError: boolean;
  settings: SettingsView;
  kickUserId: string | null;
  showOverlayError: boolean;
  viewers: number;
  gameNumber: number;
  startedAt: number;
  reconnectAttempt: number;
  now: () => number;
};

export function createRuntime(options: RuntimeOptions = {}): Runtime {
  const live = options.live ?? createLiveGame({ introMs: 0 });
  const state: Internal = {
    live,
    source: options.source ?? DEFAULT_TIKTOK_SOURCE,
    username: options.username ?? '',
    status: initialStatus(options.now?.() ?? Date.now()),
    hadConnected: false,
    overlayHits: 0,
    overlayPort: OVERLAY_PORT,
    portError: false,
    settings: structuredClone(DEFAULT_SETTINGS),
    kickUserId: null,
    showOverlayError: false,
    viewers: 0,
    gameNumber: 1,
    startedAt: options.now?.() ?? Date.now(),
    reconnectAttempt: 0,
    now: options.now ?? Date.now,
  };

  const classified = () =>
    classifyConnector({
      status: state.status,
      hadConnected: state.hadConnected,
      source: state.source,
      livePhase: state.live.snapshot().phase,
      overlayHits: state.overlayHits,
      portError: state.portError,
      username: state.username,
      gameNumber: state.gameNumber,
    });

  const errorOf = (): AdminError | null => {
    const next = classified();
    if (next.error) return next.error;
    if (state.showOverlayError) {
      return overlayMissingError(state.overlayHits, next.tikfinity === 'connected');
    }
    return null;
  };

  const api: Runtime = {
    live,
    snapshot() {
      return projectRuntime({
        live: state.live.snapshot(),
        settings: state.settings,
        username: state.username,
        overlayUrl: overlayUrl(state.overlayPort),
        overlayHits: state.overlayHits,
        classified: classified(),
        error: errorOf(),
        kickUserId: state.kickUserId,
        viewers: state.viewers,
        gameNumber: state.gameNumber,
        startedAt: state.startedAt,
        now: state.now(),
        reconnectAttempt: state.reconnectAttempt,
        overlayPort: state.overlayPort,
      });
    },
    ingestGift(gift) {
      return applyCosmeticGift(state.live, gift);
    },
    setGiftEffect(giftId, effect) {
      const next: GiftEffectRow[] = setGiftEffect(state.settings.giftEffects, giftId, effect);
      state.settings = { ...state.settings, giftEffects: next };
      return state.settings;
    },
    requestKick(userId) {
      state.kickUserId = userId;
    },
    confirmKick() {
      const gated = gateKick({ type: 'kick', userId: state.kickUserId ?? '', confirm: true });
      if (!gated.ok) return gated;
      applyConfirmedKick(state.live, gated.userId);
      state.kickUserId = null;
      return { ok: true };
    },
    cancelKick() {
      state.kickUserId = null;
    },
    handleAdmin(action) {
      if (action.type === 'kick') {
        const gated = gateKick({ type: 'kick', userId: action.userId, confirm: true });
        if (!gated.ok) return;
        applyConfirmedKick(state.live, gated.userId);
        state.kickUserId = null;
        return;
      }
      state.live.handleAdmin(action);
    },
    noteOverlayHit() {
      state.overlayHits += 1;
      state.showOverlayError = false;
    },
    setStatus(status) {
      state.status = status;
      if (status.phase === 'connected') {
        state.hadConnected = true;
        state.reconnectAttempt = 0;
        state.viewers = Math.max(state.viewers, 1);
      }
      if (status.phase === 'reconnecting') {
        state.reconnectAttempt += 1;
        if (!state.live.snapshot().paused) {
          state.live.handleAdmin({ type: 'pause' });
        }
      }
      if (status.phase === 'disconnected' && state.hadConnected && !state.live.snapshot().paused) {
        state.live.handleAdmin({ type: 'pause' });
      }
    },
    async bindPreferred(listen) {
      const result = await bindPreferredPort(listen);
      if (result.status === 'bound') {
        state.overlayPort = result.port;
        state.portError = false;
      } else {
        state.portError = true;
        state.overlayPort = OVERLAY_PORT;
      }
      return result;
    },
    async useFallbackPort(listen) {
      const result = await bindFallbackPort(listen);
      if (result.status === 'bound') {
        state.overlayPort = OVERLAY_FALLBACK_PORT;
      } else {
        state.portError = true;
      }
      return result;
    },
    acceptFallback() {
      if (state.overlayPort === OVERLAY_FALLBACK_PORT) {
        state.portError = false;
      }
    },
    setUsername(username) {
      state.username = username.replace(/^@/, '');
    },
    showOverlayError() {
      state.showOverlayError = true;
    },
  };

  return api;
}

export function createDefaultAdapter(opts: {
  source: TikTokSource;
  username: string;
}): PlatformAdapter {
  if (opts.source === 'connector') {
    return createTikTokAdapter({ uniqueId: opts.username });
  }
  return createTikFinityAdapter();
}

export function commandsFromSettings(commands: CommandWords) {
  return {
    join: commands.join.replace(/^!/, ''),
    roll: commands.roll.replace(/^!/, ''),
    move: commands.move.replace(/^!/, ''),
    stay: commands.stay.replace(/^!/, ''),
    leave: commands.leave.replace(/^!/, ''),
  };
}

export function toGiftInbound(gift: GiftEvent): GiftInbound {
  return {
    platform: gift.platform,
    userId: gift.userId,
    displayName: gift.displayName,
    giftId: gift.giftName,
    count: gift.repeatCount,
  };
}
