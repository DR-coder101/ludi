import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { startFakeTikfinity } from './fakeTikfinityServer.js';
import { createTikFinityAdapter } from './tikfinityAdapter.js';
import { parseLiveWatchArgs, validateLiveWatchArgs } from './cli.js';
import { STATUS_REASON, type ChatCommand, type ConnectionStatus, type GiftEvent } from './types.js';

const testdata = join(dirname(fileURLToPath(import.meta.url)), '..', 'testdata');

async function waitFor(
  statuses: ConnectionStatus[],
  match: (status: ConnectionStatus) => boolean,
  label: string,
  timeoutMs = 2000,
): Promise<ConnectionStatus> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const hit = statuses.find(match);
    if (hit) return hit;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error(`timed out waiting for ${label}: ${JSON.stringify(statuses)}`);
}

describe('TikFinity adapter', () => {
  it('maps chat and cosmetic gifts from a local WebSocket', async () => {
    const server = await startFakeTikfinity();
    const statuses: ConnectionStatus[] = [];
    const commands: ChatCommand[] = [];
    const gifts: GiftEvent[] = [];
    const adapter = createTikFinityAdapter({ url: server.url });
    adapter.onStatus((status) => statuses.push(status));
    adapter.onCommand((command) => commands.push(command));
    adapter.onGift((gift) => gifts.push(gift));
    await adapter.connect();
    await waitFor(
      statuses,
      (row) => row.reason === STATUS_REASON.TIKFINITY_NOT_LIVE,
      'TikFinity not live',
    );

    server.send(JSON.parse(readFileSync(join(testdata, 'tikfinity-chat.json'), 'utf8')));
    server.send(JSON.parse(readFileSync(join(testdata, 'tikfinity-gift.json'), 'utf8')));
    server.send({ event: 'chat', data: { comment: 'hello there', uniqueId: 'noise' } });
    server.send('not-json');
    server.send({ event: 'banana', data: { comment: '!join' } });

    const connected = await waitFor(statuses, (row) => row.phase === 'connected', 'connected');
    expect(connected.phase).toBe('connected');
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(commands.map((row) => row.text)).toEqual(['!join']);
    expect(commands[0]?.platform).toBe('tiktok');
    expect(commands[0]?.displayName).toBe('AmericanMade76');
    expect(gifts).toEqual([
      expect.objectContaining({
        platform: 'tiktok',
        giftName: 'Rose',
        repeatCount: 5,
        displayName: 'AmericanMade76',
      }),
    ]);
    expect(commands.some((row) => row.text === 'Rose')).toBe(false);
    await adapter.disconnect();
    await server.stop();
  });

  it('says TikFinity is not running when the local server is down', async () => {
    const statuses: ConnectionStatus[] = [];
    const adapter = createTikFinityAdapter({
      url: 'ws://127.0.0.1:1/',
      backoff: { initialMs: 20, maxMs: 20, jitter: 0 },
    });
    adapter.onStatus((status) => statuses.push(status));
    await adapter.connect();
    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(statuses.some((row) => row.reason === STATUS_REASON.TIKFINITY_NOT_RUNNING)).toBe(true);
    expect(statuses.some((row) => row.phase === 'reconnecting')).toBe(true);
    await adapter.disconnect();
  });

  it('reconnects after a drop using the fake clock', async () => {
    const server = await startFakeTikfinity();
    let now = 0;
    let sleeps = 0;
    const clock = {
      now: () => now,
      random: () => 0.5,
      async sleep(ms: number) {
        sleeps += 1;
        now += ms;
      },
    };
    const statuses: ConnectionStatus[] = [];
    const adapter = createTikFinityAdapter({
      url: server.url,
      clock,
      backoff: { initialMs: 25, maxMs: 25, jitter: 0 },
    });
    adapter.onStatus((status) => statuses.push(status));
    await adapter.connect();
    await waitFor(
      statuses,
      (row) => row.reason === STATUS_REASON.TIKFINITY_NOT_LIVE,
      'TikFinity not live',
    );
    server.dropClients();
    const reconnecting = await waitFor(
      statuses,
      (row) => row.phase === 'reconnecting',
      'reconnecting',
      4000,
    );
    expect(reconnecting.reason).toBe(STATUS_REASON.TIKFINITY_NOT_RUNNING);
    await waitFor(
      statuses,
      (row) => row.reason === STATUS_REASON.TIKFINITY_NOT_LIVE && row.at >= reconnecting.at,
      'reconnected',
      4000,
    );
    expect(sleeps).toBeGreaterThanOrEqual(1);
    await adapter.disconnect();
    await server.stop();
  });
});

describe('source selection', () => {
  it('selects tikfinity by default and connector when asked', () => {
    expect(parseLiveWatchArgs({}).source).toBe('tikfinity');
    expect(parseLiveWatchArgs({ source: 'connector', user: 'deanplays' }).source).toBe('connector');
    expect(validateLiveWatchArgs(parseLiveWatchArgs({ source: 'connector', user: 'deanplays' }))).toEqual({
      ok: true,
    });
    expect(parseLiveWatchArgs({ url: 'ws://127.0.0.1:21214/' }).url).toBe('ws://127.0.0.1:21214/');
    expect(parseLiveWatchArgs({ url: 'http://127.0.0.1:3100' }).url).toBeUndefined();
  });
});
