import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { createFakeAdapter, type FakeAdapter } from './fakeAdapter.js';
import type { ChatCommand, Clock, CommandPrefixes, GiftEvent, PlatformAdapter } from './types.js';

export type ReplayRow =
  | (Partial<ChatCommand> & { kind?: 'command' | 'chat'; text: string })
  | (Partial<GiftEvent> & { kind: 'gift'; giftName: string });

export async function readReplayFile(path: string): Promise<ReplayRow[]> {
  const rows: ReplayRow[] = [];
  const rl = createInterface({
    input: createReadStream(path, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parsed = JSON.parse(trimmed) as ReplayRow;
    rows.push(parsed);
  }
  return rows;
}

export function createReplayAdapter(options: {
  rows: ReplayRow[];
  prefixes?: Partial<CommandPrefixes>;
  clock?: Clock;
}): PlatformAdapter & { play(): void } {
  const fake: FakeAdapter = createFakeAdapter({
    platform: 'replay',
    prefixes: options.prefixes,
    clock: options.clock,
  });

  const play = () => {
    for (const row of options.rows) {
      if (row.kind === 'gift') {
        fake.emitGift({
          userId: row.userId ?? 'replay',
          displayName: row.displayName ?? row.userId ?? 'replay',
          giftName: row.giftName,
          repeatCount: row.repeatCount ?? 1,
          receivedAt: row.receivedAt,
        });
        continue;
      }
      fake.emitChat({
        userId: row.userId ?? 'replay',
        displayName: row.displayName ?? row.userId ?? 'replay',
        text: row.text,
        receivedAt: row.receivedAt,
        platformTimestamp: 'platformTimestamp' in row ? row.platformTimestamp : undefined,
      });
    }
  };

  return {
    async connect() {
      await fake.connect();
      play();
    },
    disconnect: () => fake.disconnect(),
    onCommand: fake.onCommand,
    onStatus: fake.onStatus,
    onGift: fake.onGift,
    play,
  };
}
