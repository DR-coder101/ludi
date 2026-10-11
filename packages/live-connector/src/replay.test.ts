import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createFakeAdapter } from './fakeAdapter.js';
import { runWatch } from './harness.js';

const testdata = join(dirname(fileURLToPath(import.meta.url)), '..', 'testdata');

describe('replay mode', () => {
  it('prints PASS for the under-2s fixture and ignores non-commands', async () => {
    const result = await runWatch({
      replay: join(testdata, 'pass.jsonl'),
      servePage: false,
    });
    expect(result.commands.map((row) => row.text)).toEqual(['!join', '!roll', '!move 2', '!move 1']);
    expect(result.verdict.pass).toBe(true);
    expect(result.verdict.line).toBe('PASS p95=100ms threshold=2000ms samples=4');
  });

  it('prints FAIL for the over-2s fixture', async () => {
    const result = await runWatch({
      replay: join(testdata, 'fail.jsonl'),
      servePage: false,
    });
    expect(result.verdict.pass).toBe(false);
    expect(result.verdict.line).toBe('FAIL p95=3760ms threshold=2000ms samples=3');
  });
});

describe('fake adapter', () => {
  it('filters non-commands and records gifts', async () => {
    const fake = createFakeAdapter();
    const seen: string[] = [];
    const gifts: string[] = [];
    fake.onCommand((command) => seen.push(command.text));
    fake.onGift((gift) => gifts.push(`${gift.displayName}:${gift.giftName}`));
    await fake.connect();
    fake.emitChat({ userId: '1', displayName: 'Asha', text: '!join' });
    fake.emitChat({ userId: '1', displayName: 'Asha', text: 'hello' });
    fake.emitGift({ userId: '1', displayName: 'Asha', giftName: 'Rose', repeatCount: 6 });
    expect(seen).toEqual(['!join']);
    expect(gifts).toEqual(['Asha:Rose']);
    await fake.disconnect();
  });
});
