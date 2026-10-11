import { createGame, type GameState, type TokenPos } from '@ludi/rules';
import { describe, expect, it } from 'vitest';
import { LIVE_HOUSE_RULES } from './seats.js';
import {
  __unsafeSetGame,
  createCyclingDiceRng,
  createFakeClock,
  createLiveGame,
  createSequenceRng,
} from './liveGame.js';
import type { ChatInbound, LiveEvent, LiveGame } from './types.js';

function inbound(
  userId: string,
  text: string,
  displayName = userId.toUpperCase(),
  receivedAt = 0,
): ChatInbound {
  return { platform: 'dev', userId, displayName, text, receivedAt };
}

function join(live: LiveGame, userId: string, name?: string): LiveEvent[] {
  return live.handleChat(inbound(userId, '!join', name ?? userId.toUpperCase()));
}

function seatedIds(live: LiveGame): (string | null)[] {
  return live.snapshot().seats.map((s) => s.occupant?.userId ?? null);
}

function eventsOf(events: LiveEvent[], type: LiveEvent['type']): LiveEvent[] {
  return events.filter((e) => e.type === type);
}

function alwaysSixRng(): () => number {
  return createSequenceRng([0.99]);
}

function seatFour(live: LiveGame): void {
  join(live, 'a', 'A');
  join(live, 'b', 'B');
  join(live, 'c', 'C');
  join(live, 'd', 'D');
}

function startPlaying(clock: ReturnType<typeof createFakeClock>, live: LiveGame): void {
  seatFour(live);
  expect(live.snapshot().phase).toBe('COUNTDOWN');
  clock.advance(3000);
  live.tick();
  expect(live.snapshot().phase).toBe('PLAYING');
}

function playToWinner(clock: ReturnType<typeof createFakeClock>, live: LiveGame): void {
  if (live.snapshot().phase === 'COUNTDOWN') {
    clock.advance(3000);
    live.tick();
  }
  if (live.snapshot().phase !== 'PLAYING' && live.snapshot().phase !== 'WINNER') {
    startPlaying(clock, live);
  }
  for (let i = 0; i < 4000; i += 1) {
    if (live.snapshot().phase === 'WINNER') return;
    clock.advance(20_000);
    live.tick();
  }
  throw new Error(`did not reach WINNER (phase=${live.snapshot().phase})`);
}

describe('live join and queue', () => {
  it('seats !join during INTRO and keeps the phase on INTRO', () => {
    const clock = createFakeClock(0);
    const live = createLiveGame({ clock, rng: alwaysSixRng(), introMs: 5000 });
    const ev = join(live, 'a', 'A');
    expect(eventsOf(ev, 'joined')).toEqual([
      { type: 'joined', userId: 'a', displayName: 'A', town: 'kingston' },
    ]);
    expect(live.snapshot().phase).toBe('INTRO');
    expect(seatedIds(live)).toEqual(['a', null, null, null]);
    expect(live.snapshot().queue).toEqual([]);
    clock.advance(4999);
    live.tick();
    expect(live.snapshot().phase).toBe('INTRO');
    clock.advance(1);
    const tickEv = live.tick();
    expect(live.snapshot().phase).toBe('WAITING');
    expect(eventsOf(tickEv, 'phase')).toEqual([{ type: 'phase', phase: 'WAITING' }]);
    expect(seatedIds(live)).toEqual(['a', null, null, null]);
  });

  it('does not start countdown during INTRO even at 4/4', () => {
    const clock = createFakeClock(0);
    const live = createLiveGame({ clock, rng: alwaysSixRng(), introMs: 5000 });
    seatFour(live);
    expect(live.snapshot().phase).toBe('INTRO');
    expect(live.snapshot().game).toBeNull();
    expect(seatedIds(live)).toEqual(['a', 'b', 'c', 'd']);
    clock.advance(5000);
    live.tick();
    expect(live.snapshot().phase).toBe('COUNTDOWN');
  });

  it('seats first come first served in Kingston, Ocho Rios, Montego Bay, Negril order', () => {
    const live = createLiveGame({ introMs: 0, rng: alwaysSixRng() });
    join(live, 'a', 'A');
    join(live, 'b', 'B');
    join(live, 'c', 'C');
    const snap = live.snapshot();
    expect(snap.phase).toBe('WAITING');
    expect(snap.seats.map((s) => s.town)).toEqual([
      'kingston',
      'ochoRios',
      'montegoBay',
      'negril',
    ]);
    expect(snap.seats.map((s) => s.hex)).toEqual(['#E4202E', '#0FAE47', '#FED100', '#26272B']);
    expect(snap.seats[3]?.borderHex).toBe('#D9DCE1');
    expect(seatedIds(live)).toEqual(['a', 'b', 'c', null]);
    expect(snap.seats.map((s) => s.occupant?.displayName ?? null)).toEqual(['A', 'B', 'C', null]);
  });

  it('waits at 3/4 and does not start a game', () => {
    const live = createLiveGame({ introMs: 0, rng: alwaysSixRng() });
    join(live, 'a');
    join(live, 'b');
    join(live, 'c');
    expect(live.snapshot().phase).toBe('WAITING');
    expect(live.snapshot().game).toBeNull();
    expect(seatedIds(live).filter(Boolean)).toHaveLength(3);
  });

  it('queues the fifth joiner and fills seats in queue order after a kick', () => {
    const live = createLiveGame({ introMs: 0, rng: alwaysSixRng() });
    join(live, 'a');
    join(live, 'b');
    join(live, 'c');
    join(live, 'd');
    join(live, 'e', 'E');
    join(live, 'f', 'F');
    expect(live.snapshot().queue.map((q) => q.userId)).toEqual(['e', 'f']);
    live.handleAdmin({ type: 'kick', userId: 'b' });
    expect(seatedIds(live)).toEqual(['a', 'e', 'c', 'd']);
    expect(live.snapshot().queue.map((q) => q.userId)).toEqual(['f']);
  });
});

describe('countdown to playing', () => {
  it('starts countdown at 4/4 and enters PLAYING after 3000ms', () => {
    const clock = createFakeClock(0);
    const live = createLiveGame({
      clock,
      rng: alwaysSixRng(),
      introMs: 0,
      countdownMs: 3000,
    });
    const fourth = join(live, 'a');
    join(live, 'b');
    join(live, 'c');
    const started = join(live, 'd');
    expect(eventsOf(fourth, 'countdown')).toEqual([]);
    expect(eventsOf(started, 'countdown')).toEqual([{ type: 'countdown', beat: 3 }]);
    expect(live.snapshot().phase).toBe('COUNTDOWN');
    clock.advance(1000);
    expect(eventsOf(live.tick(), 'countdown')).toEqual([{ type: 'countdown', beat: 2 }]);
    clock.advance(1000);
    expect(eventsOf(live.tick(), 'countdown')).toEqual([{ type: 'countdown', beat: 1 }]);
    clock.advance(1000);
    const go = live.tick();
    expect(live.snapshot().phase).toBe('PLAYING');
    expect(live.snapshot().game?.turn).toBe('red');
    expect(eventsOf(go, 'phase')).toEqual([{ type: 'phase', phase: 'PLAYING' }]);
    expect(eventsOf(go, 'turnStarted')[0]).toMatchObject({
      type: 'turnStarted',
      userId: 'a',
      color: 'red',
      town: 'kingston',
    });
  });
});

describe('roll, move, auto-move', () => {
  it('rolls and moves piece 1, then auto-moves the remaining die', () => {
    const clock = createFakeClock(0);
    const rng = createSequenceRng([0.99, 0.5]);
    const live = createLiveGame({ clock, rng, introMs: 0, countdownMs: 3000 });
    startPlaying(clock, live);
    const rolled = live.handleChat(inbound('a', '!roll', 'A'));
    expect(eventsOf(rolled, 'rolled')).toEqual([{ type: 'rolled', userId: 'a', values: [6, 4] }]);
    expect(live.snapshot().game?.phase).toBe('awaiting_move');
    const moved = live.handleChat(inbound('a', '!move 1', 'A'));
    expect(eventsOf(moved, 'moved').length).toBeGreaterThanOrEqual(2);
    const token0 = live.snapshot().game?.tokens.find((t) => t.color === 'red' && t.index === 0);
    expect(token0?.pos).toEqual({ zone: 'track', cell: 4 });
  });

  it('auto-moves when only one legal move exists', () => {
    const clock = createFakeClock(0);
    const live = createLiveGame({ clock, rng: alwaysSixRng(), introMs: 0, countdownMs: 3000 });
    startPlaying(clock, live);
    const home: TokenPos = { zone: 'home' };
    const game = createGame({
      playerColors: ['red', 'green', 'yellow', 'blue'],
      houseRules: LIVE_HOUSE_RULES,
    });
    const next: GameState = {
      ...game,
      phase: 'awaiting_move',
      turn: 'red',
      dice: [
        { value: 1, used: false },
        { value: 2, used: false },
      ],
      tokens: game.tokens.map((t) => {
        if (t.color === 'red' && t.index === 0) return { ...t, pos: { zone: 'homeColumn', step: 7 } };
        if (t.color === 'red') return { ...t, pos: home };
        return t;
      }),
    };
    __unsafeSetGame(live, next);
    const before = live.snapshot().game!.tokens[0]!.pos;
    expect(before).toEqual({ zone: 'homeColumn', step: 7 });
    const ev = live.handleChat(inbound('a', '!roll', 'A'));
    expect(ev).toEqual([]);
    const auto = live.handleChat(inbound('a', '!move 1', 'A'));
    expect(eventsOf(auto, 'moved')).toHaveLength(1);
    expect(live.snapshot().game?.tokens.find((t) => t.color === 'red' && t.index === 0)?.pos).toEqual({
      zone: 'home',
    });
  });
});

describe('timeout autoplay', () => {
  it('rolls and plays a legal move when the 20s timer fires', () => {
    const clock = createFakeClock(0);
    const live = createLiveGame({
      clock,
      rng: alwaysSixRng(),
      introMs: 0,
      countdownMs: 3000,
      turnMs: 20_000,
    });
    startPlaying(clock, live);
    clock.advance(19_999);
    expect(eventsOf(live.tick(), 'timeout')).toEqual([]);
    expect(live.snapshot().game?.phase).toBe('awaiting_roll');
    clock.advance(1);
    const ev = live.tick();
    expect(eventsOf(ev, 'timeout')).toEqual([{ type: 'timeout', userId: 'a' }]);
    expect(eventsOf(ev, 'rolled')).toHaveLength(1);
    expect(live.snapshot().game?.tokens.some((t) => t.color === 'red' && t.pos.zone !== 'yard')).toBe(
      true,
    );
  });
});

describe('capture', () => {
  it('emits @A knocked @B home and does not reimplement capture', () => {
    const clock = createFakeClock(0);
    const live = createLiveGame({ clock, rng: alwaysSixRng(), introMs: 0, countdownMs: 3000 });
    startPlaying(clock, live);
    const game = createGame({
      playerColors: ['red', 'green', 'yellow', 'blue'],
      houseRules: LIVE_HOUSE_RULES,
    });
    const next: GameState = {
      ...game,
      phase: 'awaiting_move',
      turn: 'red',
      dice: [
        { value: 1, used: false },
        { value: 2, used: true },
      ],
      tokens: game.tokens.map((t) => {
        if (t.color === 'red' && t.index === 0) return { ...t, pos: { zone: 'track', cell: 8 } };
        if (t.color === 'green' && t.index === 0) return { ...t, pos: { zone: 'track', cell: 9 } };
        return t;
      }),
    };
    __unsafeSetGame(live, next);
    const ev = live.handleChat(inbound('a', '!move 1', 'A'));
    expect(eventsOf(ev, 'captured')).toEqual([
      { type: 'captured', userId: 'a', text: '@A knocked @B home' },
    ]);
    expect(
      live.snapshot().game?.tokens.find((t) => t.color === 'green' && t.index === 0)?.pos,
    ).toEqual({ zone: 'yard' });
  });
});

describe('winner stay, leave, and no reply', () => {
  it('keeps the winner seated on !stay and sits losers out', () => {
    const clock = createFakeClock(0);
    const live = createLiveGame({
      clock,
      rng: createCyclingDiceRng(),
      introMs: 0,
      countdownMs: 3000,
      winnerMs: 15_000,
    });
    playToWinner(clock, live);
    expect(live.snapshot().winnerUserId).toBe('a');
    expect(live.snapshot().winnerStay).toBeNull();
    const ev = live.handleChat(inbound('a', '!stay', 'A'));
    expect(eventsOf(ev, 'stay')).toEqual([{ type: 'stay', userId: 'a' }]);
    expect(eventsOf(ev, 'phase')).toEqual([{ type: 'phase', phase: 'WAITING' }]);
    expect(live.snapshot().phase).toBe('WAITING');
    expect(live.snapshot().winnerStay).toBe(true);
    expect(seatedIds(live)).toEqual(['a', null, null, null]);
    expect(live.snapshot().sitOut).toEqual(['b', 'c', 'd']);
  });

  it('opens the winner seat on !leave', () => {
    const clock = createFakeClock(0);
    const live = createLiveGame({
      clock,
      rng: createCyclingDiceRng(),
      introMs: 0,
      countdownMs: 3000,
      winnerMs: 15_000,
    });
    playToWinner(clock, live);
    const ev = live.handleChat(inbound('a', '!leave', 'A'));
    expect(eventsOf(ev, 'leave')).toEqual([{ type: 'leave', userId: 'a' }]);
    expect(live.snapshot().phase).toBe('WAITING');
    expect(live.snapshot().winnerStay).toBe(false);
    expect(seatedIds(live)).toEqual([null, null, null, null]);
    expect(live.snapshot().sitOut).toEqual(['b', 'c', 'd']);
  });

  it('opens the winner seat after exactly 15000ms with no reply', () => {
    const clock = createFakeClock(0);
    const live = createLiveGame({
      clock,
      rng: createCyclingDiceRng(),
      introMs: 0,
      countdownMs: 3000,
      winnerMs: 15_000,
    });
    playToWinner(clock, live);
    expect(live.snapshot().phase).toBe('WINNER');
    clock.advance(14_999);
    live.tick();
    expect(live.snapshot().phase).toBe('WINNER');
    expect(live.snapshot().winnerStay).toBeNull();
    clock.advance(1);
    const ev = live.tick();
    expect(live.snapshot().phase).toBe('WAITING');
    expect(eventsOf(ev, 'leave')).toEqual([{ type: 'leave', userId: 'a' }]);
    expect(seatedIds(live)).toEqual([null, null, null, null]);
    expect(live.snapshot().sitOut).toEqual(['b', 'c', 'd']);
  });
});

describe('sit-out and queue after a win', () => {
  it('sits losers out of exactly one game, then seats the queue in order', () => {
    const clock = createFakeClock(0);
    const live = createLiveGame({
      clock,
      rng: createCyclingDiceRng(),
      introMs: 0,
      countdownMs: 3000,
      winnerMs: 15_000,
    });
    playToWinner(clock, live);
    live.handleChat(inbound('a', '!stay', 'A'));
    expect(live.snapshot().sitOut).toEqual(['b', 'c', 'd']);
    join(live, 'e', 'E');
    join(live, 'f', 'F');
    join(live, 'g', 'G');
    expect(seatedIds(live)).toEqual(['a', 'e', 'f', 'g']);
    join(live, 'b', 'B');
    join(live, 'c', 'C');
    join(live, 'd', 'D');
    expect(live.snapshot().queue.map((q) => q.userId)).toEqual(['b', 'c', 'd']);
    clock.advance(3000);
    live.tick();
    expect(live.snapshot().phase).toBe('PLAYING');
    playToWinner(clock, live);
    expect(live.snapshot().winnerUserId).toBe('g');
    const ev = live.handleChat(inbound('g', '!leave', 'G'));
    expect(eventsOf(ev, 'leave')).toEqual([{ type: 'leave', userId: 'g' }]);
    expect(live.snapshot().phase).toBe('WAITING');
    expect(live.snapshot().winnerStay).toBe(false);
    expect(live.snapshot().sitOut).toEqual(['a', 'e', 'f']);
    expect(seatedIds(live)).toEqual(['b', 'c', 'd', null]);
    expect(live.snapshot().queue).toEqual([]);
  });
});

describe('gifts', () => {
  it('never changes live state', () => {
    const live = createLiveGame({ introMs: 0, rng: alwaysSixRng() });
    join(live, 'a');
    join(live, 'b');
    const before = live.snapshot();
    const ev = live.handleGift({
      platform: 'dev',
      userId: 'z',
      displayName: 'Zed',
      giftId: 'Rose',
      count: 6,
    });
    expect(ev).toEqual([
      {
        type: 'gift',
        userId: 'z',
        displayName: 'Zed',
        giftId: 'Rose',
        count: 6,
        text: '@Zed sent Rose x6',
      },
    ]);
    expect(live.snapshot()).toEqual(before);
  });
});

describe('admin and ignored commands', () => {
  it('pauses chat, skipTurn autoplays, kick removes a seat, newGame returns to WAITING', () => {
    const clock = createFakeClock(0);
    const live = createLiveGame({
      clock,
      rng: alwaysSixRng(),
      introMs: 0,
      countdownMs: 3000,
    });
    startPlaying(clock, live);
    expect(eventsOf(live.handleAdmin({ type: 'pause' }), 'paused')).toEqual([{ type: 'paused' }]);
    const ignored = live.handleChat(inbound('a', '!roll', 'A'));
    expect(ignored).toEqual([]);
    expect(live.snapshot().game?.phase).toBe('awaiting_roll');
    live.handleAdmin({ type: 'resume' });
    const skipped = live.handleAdmin({ type: 'skipTurn' });
    expect(eventsOf(skipped, 'timeout')).toHaveLength(1);
    live.handleAdmin({ type: 'kick', userId: 'c' });
    expect(seatedIds(live)[2]).toBeNull();
    live.handleAdmin({ type: 'newGame' });
    expect(live.snapshot().phase).toBe('WAITING');
    expect(live.snapshot().game).toBeNull();
  });

  it('ignores out-of-turn and non-seated commands', () => {
    const clock = createFakeClock(0);
    const live = createLiveGame({ clock, rng: alwaysSixRng(), introMs: 0, countdownMs: 3000 });
    startPlaying(clock, live);
    expect(live.handleChat(inbound('b', '!roll', 'B'))).toEqual([]);
    expect(live.handleChat(inbound('z', '!roll', 'Z'))).toEqual([]);
    expect(live.handleChat(inbound('z', '!move 1', 'Z'))).toEqual([]);
    expect(live.snapshot().game?.phase).toBe('awaiting_roll');
    expect(live.snapshot().game?.turn).toBe('red');
  });
});
