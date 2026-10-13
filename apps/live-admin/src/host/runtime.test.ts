import { createServer } from 'node:net';
import { describe, expect, it } from 'vitest';
import { STATUS_REASON, type ConnectionStatus } from '@ludi/live-connector';
import { createLiveGame, type GiftInbound } from '@ludi/live-game';
import { OVERLAY_FALLBACK_PORT, OVERLAY_PORT, overlayUrl } from '../view/types.js';
import { classifyConnector, isUsernameNotFound } from './classify.js';
import { applyCosmeticGift, setGiftEffect } from './gifts.js';
import { gateKick } from './kick.js';
import { bindFallbackPort, bindPreferredPort } from './ports.js';
import { createRuntime } from './runtime.js';
import { DEFAULT_GIFT_EFFECTS } from '../view/types.js';

function status(phase: ConnectionStatus['phase'], reason?: string): ConnectionStatus {
  return { phase, reason, at: 1 };
}

function gift(over: Partial<GiftInbound> = {}): GiftInbound {
  return {
    platform: 'tiktok',
    userId: 'lucy',
    displayName: 'Lucy',
    giftId: 'Rose',
    count: 6,
    ...over,
  };
}

describe('connector classification', () => {
  it('maps TikFinity closed after a live session', () => {
    const next = classifyConnector({
      status: status('error', STATUS_REASON.TIKFINITY_NOT_RUNNING),
      hadConnected: true,
      source: 'tikfinity',
      livePhase: 'PLAYING',
      overlayHits: 1,
      portError: false,
      username: 'deanplays',
      gameNumber: 24,
    });
    expect(next.error).toEqual({ kind: 'tikfinity-closed' });
  });

  it('maps username not found from connector wording', () => {
    expect(isUsernameNotFound('UserNotFoundError: user not found')).toBe(true);
    const next = classifyConnector({
      status: status('error', 'User not found: deanplayz'),
      hadConnected: false,
      source: 'connector',
      livePhase: 'WAITING',
      overlayHits: 0,
      portError: false,
      username: 'deanplayz',
      gameNumber: 1,
    });
    expect(next.error).toEqual({ kind: 'username-not-found', username: 'deanplayz' });
  });

  it('maps LIVE ended after a connected session', () => {
    const next = classifyConnector({
      status: status('error', STATUS_REASON.STREAM_OFFLINE),
      hadConnected: true,
      source: 'connector',
      livePhase: 'PLAYING',
      overlayHits: 1,
      portError: false,
      username: 'deanplays',
      gameNumber: 24,
    });
    expect(next.error).toEqual({
      kind: 'live-ended',
      username: 'deanplays',
      gameNumber: 24,
    });
  });

  it('keeps TikFinity-not-running on setup before the first connect', () => {
    const next = classifyConnector({
      status: status('error', STATUS_REASON.TIKFINITY_NOT_RUNNING),
      hadConnected: false,
      source: 'tikfinity',
      livePhase: 'WAITING',
      overlayHits: 0,
      portError: false,
      username: 'deanplays',
      gameNumber: 1,
    });
    expect(next.error).toBeNull();
    expect(next.tikfinity).toBe('not-running');
  });
});

describe('overlay and ports', () => {
  it('surfaces overlay-not-loaded after connect when the overlay never loaded', () => {
    const rt = createRuntime({ username: 'deanplays' });
    rt.setStatus(status('connected'));
    rt.showOverlayError();
    expect(rt.snapshot().error).toEqual({ kind: 'overlay-not-loaded' });
    rt.noteOverlayHit();
    expect(rt.snapshot().error).toBeNull();
  });

  it('reports port in use on 4747 and falls back to 4748', async () => {
    const used = new Set<number>();
    const listen = async (port: number) => {
      if (port === OVERLAY_PORT && !used.has(port)) {
        used.add(port);
        throw Object.assign(new Error('listen EADDRINUSE'), { code: 'EADDRINUSE' });
      }
      used.add(port);
    };
    const rt = createRuntime();
    const blocked = await rt.bindPreferred(listen);
    expect(blocked).toEqual({
      status: 'port-in-use',
      wanted: OVERLAY_PORT,
      fallback: OVERLAY_FALLBACK_PORT,
    });
    expect(rt.snapshot().error).toEqual({
      kind: 'port-in-use',
      wanted: OVERLAY_PORT,
      fallback: OVERLAY_FALLBACK_PORT,
    });
    const fallback = await rt.useFallbackPort(listen);
    expect(fallback).toEqual({ status: 'bound', port: OVERLAY_FALLBACK_PORT, fellBack: true });
    expect(rt.snapshot().setup.overlayUrl).toBe(overlayUrl(OVERLAY_FALLBACK_PORT));
    expect(rt.snapshot().error).toEqual({
      kind: 'port-in-use',
      wanted: OVERLAY_PORT,
      fallback: OVERLAY_FALLBACK_PORT,
    });
    rt.acceptFallback();
    expect(rt.snapshot().error).toBeNull();
    expect(rt.snapshot().setup.overlayUrl).toBe(overlayUrl(OVERLAY_FALLBACK_PORT));
  });

  it('bindPreferredPort and bindFallbackPort use the real EADDRINUSE code', async () => {
    const blocker = createServer();
    await new Promise<void>((resolve, reject) => {
      blocker.once('error', reject);
      blocker.listen(0, '127.0.0.1', () => resolve());
    });
    const addr = blocker.address();
    if (!addr || typeof addr === 'string') throw new Error('expected tcp address');
    const occupied = addr.port;
    const listen = (port: number) =>
      new Promise<void>((resolve, reject) => {
        const s = createServer();
        s.once('error', reject);
        s.listen(port, '127.0.0.1', () => {
          s.close(() => resolve());
        });
      });
    const primary = await bindPreferredPort(async (port) => {
      if (port === OVERLAY_PORT) {
        await listen(occupied);
        throw Object.assign(new Error('listen EADDRINUSE'), { code: 'EADDRINUSE' });
      }
    });
    expect(primary.status).toBe('port-in-use');
    const fallback = await bindFallbackPort(async (port) => {
      expect(port).toBe(OVERLAY_FALLBACK_PORT);
    });
    expect(fallback).toEqual({ status: 'bound', port: OVERLAY_FALLBACK_PORT, fellBack: true });
    await new Promise<void>((resolve) => blocker.close(() => resolve()));
  });
});

describe('kick confirm', () => {
  it('refuses kick without confirm and only removes the seat after confirm', () => {
    const live = createLiveGame({ introMs: 0 });
    live.handleChat({
      platform: 'dev',
      userId: 'sarah',
      displayName: 'Sarah',
      text: '!join',
      receivedAt: 0,
    });
    expect(live.snapshot().seats[0]?.occupant?.userId).toBe('sarah');
    expect(gateKick({ type: 'kick', userId: 'sarah' })).toEqual({
      ok: false,
      error: 'confirm required',
    });
    expect(live.snapshot().seats[0]?.occupant?.userId).toBe('sarah');
    const rt = createRuntime({ live });
    rt.requestKick('sarah');
    expect(live.snapshot().seats[0]?.occupant?.userId).toBe('sarah');
    expect(rt.snapshot().kick?.userId).toBe('sarah');
    expect(rt.confirmKick()).toEqual({ ok: true });
    expect(live.snapshot().seats[0]?.occupant).toBeNull();
    expect(rt.snapshot().kick).toBeNull();
  });
});

describe('gifts stay cosmetic', () => {
  it('never changes live game state when a gift lands', () => {
    const live = createLiveGame({ introMs: 0 });
    live.handleChat({
      platform: 'dev',
      userId: 'a',
      displayName: 'A',
      text: '!join',
      receivedAt: 0,
    });
    const rt = createRuntime({ live });
    const result = rt.ingestGift(gift());
    expect(result.after).toEqual(result.before);
    expect(result.events).toEqual([
      {
        type: 'gift',
        userId: 'lucy',
        displayName: 'Lucy',
        giftId: 'Rose',
        count: 6,
        text: '@Lucy sent Rose x6',
      },
    ]);
  });

  it('changing a gift effect does not touch dice, seats, or phase', () => {
    const live = createLiveGame({ introMs: 0 });
    live.handleChat({
      platform: 'dev',
      userId: 'a',
      displayName: 'A',
      text: '!join',
      receivedAt: 0,
    });
    const rt = createRuntime({ live });
    const before = live.snapshot();
    const settings = rt.setGiftEffect('rose', 'Sparkle on their name');
    expect(live.snapshot()).toEqual(before);
    expect(settings.giftEffects[0]?.effect).toBe('Sparkle on their name');
  });

  it('applyCosmeticGift leaves snapshot equal to the pre-gift clone', () => {
    const live = createLiveGame({ introMs: 0 });
    const { before, after, events } = applyCosmeticGift(live, gift({ giftId: 'Perfume', count: 1 }));
    expect(after).toEqual(before);
    expect(events[0]).toMatchObject({ type: 'gift', giftId: 'Perfume', count: 1 });
  });

  it('setGiftEffect only rewrites the named row', () => {
    const next = setGiftEffect(DEFAULT_GIFT_EFFECTS, 'doughnut', 'Fireworks');
    expect(next.find((r) => r.giftId === 'doughnut')?.effect).toBe('Fireworks');
    expect(next.find((r) => r.giftId === 'rose')?.effect).toBe('Confetti burst');
  });
});
