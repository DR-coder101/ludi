export const PLATFORMS = ['tiktok', 'twitch', 'youtube', 'fake', 'replay'] as const;
export type PlatformId = (typeof PLATFORMS)[number];

export type ChatCommand = {
  platform: PlatformId;
  userId: string;
  displayName: string;
  text: string;
  receivedAt: number;
  platformTimestamp?: number;
};

export type GiftEvent = {
  platform: PlatformId;
  userId: string;
  displayName: string;
  giftName: string;
  repeatCount: number;
  receivedAt: number;
};

export const STATUS_PHASES = [
  'connecting',
  'connected',
  'disconnected',
  'reconnecting',
  'error',
] as const;
export type StatusPhase = (typeof STATUS_PHASES)[number];

export type ConnectionStatus = {
  phase: StatusPhase;
  reason?: string;
  at: number;
};

export type PlatformAdapter = {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  onCommand(cb: (command: ChatCommand) => void): () => void;
  onStatus(cb: (status: ConnectionStatus) => void): () => void;
  onGift(cb: (gift: GiftEvent) => void): () => void;
};

export const MOVE_PIECES = [1, 2, 3, 4] as const;
export type MovePiece = (typeof MOVE_PIECES)[number];

export type ParsedCommand =
  | { kind: 'join' }
  | { kind: 'roll' }
  | { kind: 'move'; piece: MovePiece }
  | { kind: 'stay' }
  | { kind: 'leave' }
  | { kind: 'ignore' };

export type CommandPrefixes = {
  join: string;
  roll: string;
  move: string;
  stay: string;
  leave: string;
};

export const DEFAULT_PREFIXES: CommandPrefixes = {
  join: '!join',
  roll: '!roll',
  move: '!move',
  stay: '!stay',
  leave: '!leave',
};

export const P95_PASS_MS = 2000;

export const STATUS_REASON = {
  STREAM_OFFLINE: 'user is not live: start a TikTok LIVE then rerun',
  SIGN_REQUIRED:
    'TikTok chat signing needs TIKTOK_SIGN_API_KEY from Euler Stream. Set it in the environment, then rerun',
  WORKER_CRASH: 'tiktok worker exited; reconnecting with backoff',
  DISCONNECT: 'disconnect requested',
  CONNECT_FAILED: 'connect failed; reconnecting with backoff',
  DROPPED: 'live socket dropped; reconnecting with backoff',
} as const;

export type Clock = {
  now(): number;
  sleep(ms: number, signal?: AbortSignal): Promise<void>;
  random(): number;
};

export const systemClock: Clock = {
  now: () => Date.now(),
  sleep(ms, signal) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, ms);
      if (!signal) return;
      const onAbort = () => {
        clearTimeout(timer);
        reject(signal.reason ?? new Error('aborted'));
      };
      if (signal.aborted) {
        onAbort();
        return;
      }
      signal.addEventListener('abort', onAbort, { once: true });
    });
  },
  random: () => Math.random(),
};

export function createEmitter<T>(): {
  on(cb: (value: T) => void): () => void;
  emit(value: T): void;
} {
  const subs = new Set<(value: T) => void>();
  return {
    on(cb) {
      subs.add(cb);
      return () => {
        subs.delete(cb);
      };
    },
    emit(value) {
      for (const cb of subs) cb(value);
    },
  };
}
