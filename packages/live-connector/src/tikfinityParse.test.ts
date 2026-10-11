import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseTikFinityMessage } from './tikfinityParse.js';

const testdata = join(dirname(fileURLToPath(import.meta.url)), '..', 'testdata');

describe('parseTikFinityMessage', () => {
  it('maps the recorded chat envelope to a tiktok command payload', () => {
    const raw = readFileSync(join(testdata, 'tikfinity-chat.json'), 'utf8');
    expect(parseTikFinityMessage(raw)).toEqual([
      {
        kind: 'chat',
        userId: '6941810482429199365',
        displayName: 'AmericanMade76',
        text: '!join',
        platformTimestamp: 1736464721384,
      },
    ]);
  });

  it('maps a gift envelope to a cosmetic gift and never to chat', () => {
    const raw = readFileSync(join(testdata, 'tikfinity-gift.json'), 'utf8');
    const parsed = parseTikFinityMessage(raw);
    expect(parsed).toEqual([
      {
        kind: 'gift',
        userId: '6941810482429199365',
        displayName: 'AmericanMade76',
        giftName: 'Rose',
        repeatCount: 5,
      },
    ]);
    expect(parsed.some((row) => row.kind === 'chat')).toBe(false);
  });

  it('ignores an in-progress gift streak', () => {
    expect(
      parseTikFinityMessage(
        JSON.stringify({ event: 'gift', data: { giftName: 'Rose', repeatCount: 2, repeatEnd: false } }),
      ),
    ).toEqual([{ kind: 'ignore' }]);
  });

  it('ignores malformed JSON and unknown events', () => {
    expect(parseTikFinityMessage('not-json')).toEqual([{ kind: 'ignore' }]);
    expect(parseTikFinityMessage(JSON.stringify({ event: 'banana', data: {} }))).toEqual([
      { kind: 'ignore' },
    ]);
    expect(parseTikFinityMessage('null')).toEqual([{ kind: 'ignore' }]);
  });

  it('accepts an array of envelopes', () => {
    const parsed = parseTikFinityMessage(
      JSON.stringify([
        { event: 'like', data: {} },
        { type: 'comment', data: { comment: '!roll', uniqueId: 'ben' } },
      ]),
    );
    expect(parsed).toEqual([
      { kind: 'live' },
      {
        kind: 'chat',
        userId: 'ben',
        displayName: 'ben',
        text: '!roll',
        platformTimestamp: undefined,
      },
    ]);
  });

  it('treats streamEnd as the live ending', () => {
    expect(parseTikFinityMessage(JSON.stringify({ event: 'streamEnd' }))).toEqual([
      { kind: 'ended' },
    ]);
  });
});
