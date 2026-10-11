import { describe, expect, it } from 'vitest';
import { createCyclingDiceRng, createFakeClock, createLiveGame } from './liveGame.js';
import type { ChatInbound } from './types.js';

describe('simulated 4-player game', () => {
  it('reaches WINNER from injected !join plus timeout ticks only', () => {
    const clock = createFakeClock(0);
    const live = createLiveGame({
      clock,
      rng: createCyclingDiceRng(),
      introMs: 0,
      countdownMs: 3000,
      turnMs: 20_000,
      winnerMs: 15_000,
    });

    for (const [id, name] of [
      ['a', 'A'],
      ['b', 'B'],
      ['c', 'C'],
      ['d', 'D'],
    ] as const) {
      const inbound: ChatInbound = {
        platform: 'dev',
        userId: id,
        displayName: name,
        text: '!join',
        receivedAt: clock.now(),
      };
      live.handleChat(inbound);
    }

    expect(live.snapshot().phase).toBe('COUNTDOWN');
    clock.advance(3000);
    live.tick();
    expect(live.snapshot().phase).toBe('PLAYING');

    for (let i = 0; i < 4000; i += 1) {
      if (live.snapshot().phase === 'WINNER') break;
      clock.advance(20_000);
      live.tick();
    }

    const snap = live.snapshot();
    expect(snap.phase).toBe('WINNER');
    expect(snap.winnerUserId).toBe('a');
    expect(snap.winnerStay).toBeNull();
    expect(snap.game?.winner).toBe('red');
    expect(snap.game?.phase).toBe('finished');
    expect(snap.seats[0]).toMatchObject({
      town: 'kingston',
      color: 'red',
      occupant: { userId: 'a', displayName: 'A' },
    });
    const home = snap.game?.tokens.filter((t) => t.color === 'red') ?? [];
    expect(home).toHaveLength(4);
    expect(home.every((t) => t.pos.zone === 'home')).toBe(true);
  });
});
