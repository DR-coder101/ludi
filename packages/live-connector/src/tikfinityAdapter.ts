import WebSocket from 'ws';
import { nextBackoff, type BackoffOptions, DEFAULT_BACKOFF } from './reconnect.js';
import { initialStatus, reduceStatus } from './status.js';
import { parseTikFinityMessage } from './tikfinityParse.js';
import {
  DEFAULT_TIKFINITY_URL,
  STATUS_REASON,
  createEmitter,
  systemClock,
  type ChatCommand,
  type Clock,
  type CommandPrefixes,
  type ConnectionStatus,
  type GiftEvent,
  type PlatformAdapter,
} from './types.js';
import { isConfiguredCommand } from './parseCommand.js';

export type TikFinityAdapterOptions = {
  url?: string;
  prefixes?: Partial<CommandPrefixes>;
  clock?: Clock;
  backoff?: BackoffOptions;
  openSocket?: (url: string) => WebSocket;
};

function classifySocketError(err: unknown): string {
  const text = err instanceof Error ? `${err.name} ${err.message}` : String(err);
  if (/econnrefused|enotfound|econnreset|etimedout|1006|not running/i.test(text)) {
    return STATUS_REASON.TIKFINITY_NOT_RUNNING;
  }
  return STATUS_REASON.TIKFINITY_NOT_RUNNING;
}

export function createTikFinityAdapter(options: TikFinityAdapterOptions = {}): PlatformAdapter {
  const clock = options.clock ?? systemClock;
  const backoff = options.backoff ?? DEFAULT_BACKOFF;
  const url = options.url ?? DEFAULT_TIKFINITY_URL;
  const openSocket = options.openSocket ?? ((target: string) => new WebSocket(target));
  const commands = createEmitter<ChatCommand>();
  const gifts = createEmitter<GiftEvent>();
  const statuses = createEmitter<ConnectionStatus>();

  let status = initialStatus(clock.now());
  let socket: WebSocket | undefined;
  let attempt = 0;
  let loop: Promise<void> | undefined;
  let stop: AbortController | undefined;
  let wantConnected = false;

  const setStatus = (event: Parameters<typeof reduceStatus>[1]) => {
    const next = reduceStatus(status, event, clock.now());
    if (next === status) return;
    status = next;
    statuses.emit(next);
  };

  const handlePayload = (raw: string) => {
    for (const parsed of parseTikFinityMessage(raw)) {
      switch (parsed.kind) {
        case 'chat':
          setStatus({ type: 'connected' });
          attempt = 0;
          if (!isConfiguredCommand(parsed.text, options.prefixes)) continue;
          commands.emit({
            platform: 'tiktok',
            userId: parsed.userId,
            displayName: parsed.displayName,
            text: parsed.text,
            receivedAt: clock.now(),
            platformTimestamp: parsed.platformTimestamp,
          });
          continue;
        case 'gift':
          setStatus({ type: 'connected' });
          attempt = 0;
          gifts.emit({
            platform: 'tiktok',
            userId: parsed.userId,
            displayName: parsed.displayName,
            giftName: parsed.giftName,
            repeatCount: parsed.repeatCount,
            receivedAt: clock.now(),
          });
          continue;
        case 'live':
          setStatus({ type: 'connected' });
          attempt = 0;
          continue;
        case 'ended':
          setStatus({ type: 'awaiting_live', reason: STATUS_REASON.TIKFINITY_NOT_LIVE });
          continue;
        case 'ignore':
          continue;
        default: {
          const _never: never = parsed;
          return _never;
        }
      }
    }
  };

  const closeSocket = () => {
    const current = socket;
    socket = undefined;
    if (!current) return;
    current.removeAllListeners();
    if (current.readyState === WebSocket.OPEN || current.readyState === WebSocket.CONNECTING) {
      current.close();
    }
  };

  const runLoop = async (signal: AbortSignal) => {
    while (wantConnected && !signal.aborted) {
      if (status.phase === 'reconnecting') {
        const wait = nextBackoff(attempt, clock, backoff);
        attempt = wait.attempt;
        try {
          await clock.sleep(wait.delayMs, signal);
        } catch {
          return;
        }
      }
      if (!wantConnected || signal.aborted) return;
      setStatus({ type: 'connect_requested' });
      try {
        const next = openSocket(url);
        socket = next;
        await new Promise<void>((resolve, reject) => {
          const onAbort = () => {
            cleanup();
            resolve();
          };
          const cleanup = () => {
            next.removeListener('open', onOpen);
            next.removeListener('message', onMessage);
            next.removeListener('close', onClose);
            next.removeListener('error', onError);
            signal.removeEventListener('abort', onAbort);
          };
          const onOpen = () => {
            attempt = 0;
            setStatus({ type: 'awaiting_live', reason: STATUS_REASON.TIKFINITY_NOT_LIVE });
          };
          const onMessage = (data: WebSocket.RawData) => {
            handlePayload(typeof data === 'string' ? data : data.toString('utf8'));
          };
          const onClose = () => {
            cleanup();
            if (!wantConnected) {
              resolve();
              return;
            }
            if (status.phase === 'error') {
              resolve();
              return;
            }
            setStatus({ type: 'dropped', reason: STATUS_REASON.TIKFINITY_NOT_RUNNING });
            resolve();
          };
          const onError = (err: Error) => {
            setStatus({ type: 'connect_failed', reason: classifySocketError(err) });
          };
          next.once('open', onOpen);
          next.on('message', onMessage);
          next.once('close', onClose);
          next.once('error', onError);
          signal.addEventListener('abort', onAbort, { once: true });
        });
      } catch (err) {
        setStatus({ type: 'connect_failed', reason: classifySocketError(err) });
      }
      closeSocket();
    }
  };

  return {
    async connect() {
      if (wantConnected) return;
      wantConnected = true;
      attempt = 0;
      stop = new AbortController();
      loop = runLoop(stop.signal);
      await Promise.resolve();
    },
    async disconnect() {
      wantConnected = false;
      stop?.abort();
      closeSocket();
      setStatus({ type: 'disconnect_requested', reason: STATUS_REASON.DISCONNECT });
      await loop?.catch(() => undefined);
      loop = undefined;
    },
    onCommand: commands.on,
    onStatus: statuses.on,
    onGift: gifts.on,
  };
}
