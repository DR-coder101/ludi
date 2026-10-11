import { isConfiguredCommand } from './parseCommand.js';
import {
  STATUS_REASON,
  createEmitter,
  systemClock,
  type ChatCommand,
  type Clock,
  type CommandPrefixes,
  type ConnectionStatus,
  type GiftEvent,
  type PlatformAdapter,
  type PlatformId,
} from './types.js';
import { initialStatus, reduceStatus } from './status.js';

export type FakeAdapter = PlatformAdapter & {
  emitChat(input: Omit<ChatCommand, 'platform' | 'receivedAt'> & { receivedAt?: number }): void;
  emitGift(input: Omit<GiftEvent, 'platform' | 'receivedAt'> & { receivedAt?: number }): void;
  drop(reason?: string): void;
  goOffline(): void;
};

export function createFakeAdapter(options?: {
  platform?: PlatformId;
  prefixes?: Partial<CommandPrefixes>;
  clock?: Clock;
}): FakeAdapter {
  const platform = options?.platform ?? 'fake';
  const clock = options?.clock ?? systemClock;
  const commands = createEmitter<ChatCommand>();
  const gifts = createEmitter<GiftEvent>();
  const statuses = createEmitter<ConnectionStatus>();
  let status = initialStatus(clock.now());

  const setStatus = (event: Parameters<typeof reduceStatus>[1]) => {
    const next = reduceStatus(status, event, clock.now());
    if (next === status) return;
    status = next;
    statuses.emit(next);
  };

  return {
    async connect() {
      setStatus({ type: 'connect_requested' });
      setStatus({ type: 'connected' });
    },
    async disconnect() {
      setStatus({ type: 'disconnect_requested', reason: STATUS_REASON.DISCONNECT });
    },
    onCommand: commands.on,
    onStatus: statuses.on,
    onGift: gifts.on,
    emitChat(input) {
      if (!isConfiguredCommand(input.text, options?.prefixes)) return;
      commands.emit({
        platform,
        userId: input.userId,
        displayName: input.displayName,
        text: input.text.trim().replace(/\s+/g, ' '),
        receivedAt: input.receivedAt ?? clock.now(),
        platformTimestamp: input.platformTimestamp,
      });
    },
    emitGift(input) {
      gifts.emit({
        platform,
        userId: input.userId,
        displayName: input.displayName,
        giftName: input.giftName,
        repeatCount: input.repeatCount,
        receivedAt: input.receivedAt ?? clock.now(),
      });
    },
    drop(reason = STATUS_REASON.DROPPED) {
      setStatus({ type: 'dropped', reason });
    },
    goOffline() {
      setStatus({ type: 'offline', reason: STATUS_REASON.STREAM_OFFLINE });
    },
  };
}
