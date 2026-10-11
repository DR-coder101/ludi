import {
  applyMove,
  createGame,
  legalMoves,
  rollDice,
  type Color,
  type GameState,
  type LegalMove,
} from '@ludi/rules';
import { systemClock, systemRng } from './clock.js';
import { DEFAULT_COMMANDS, parseChat } from './commands.js';
import { stepsPath, pieceArrayIndex } from './path.js';
import {
  LIVE_HOUSE_RULES,
  emptySeats,
  seatByColor,
  seatByUser,
  seatedCount,
} from './seats.js';
import type {
  AdminAction,
  ChatInbound,
  Clock,
  CommandWords,
  GiftInbound,
  LiveConfig,
  LiveEvent,
  LiveGame,
  LiveGameState,
  Occupant,
  ParsedChat,
  Rng,
  Seat,
} from './types.js';

export { createCyclingDiceRng, createFakeClock, createSequenceRng } from './clock.js';

type PauseHold = {
  phaseLeft: number | null;
  turnLeft: number | null;
};

type Internal = {
  phase: LiveGameState['phase'];
  seats: [Seat, Seat, Seat, Seat];
  queue: Occupant[];
  sitOut: string[];
  paused: boolean;
  phaseEndsAt: number | null;
  turnEndsAt: number | null;
  winnerUserId: string | null;
  winnerStay: null | boolean;
  game: GameState | null;
  countdownBeat: 3 | 2 | 1 | null;
  pauseHold: PauseHold | null;
  vacant: Set<string>;
};

export type Runtime = {
  clock: Clock;
  rng: Rng;
  introMs: number;
  countdownMs: number;
  turnMs: number;
  winnerMs: number;
  prefix: string;
  commands: CommandWords;
};

function cloneState(s: Internal): LiveGameState {
  return {
    phase: s.phase,
    seats: structuredClone(s.seats),
    queue: structuredClone(s.queue),
    sitOut: [...s.sitOut],
    paused: s.paused,
    phaseEndsAt: s.phaseEndsAt,
    turnEndsAt: s.turnEndsAt,
    winnerUserId: s.winnerUserId,
    winnerStay: s.winnerStay,
    game: s.game ? structuredClone(s.game) : null,
    countdownBeat: s.countdownBeat,
  };
}

function occupantOf(inbound: ChatInbound): Occupant {
  return {
    platform: inbound.platform,
    userId: inbound.userId,
    displayName: inbound.displayName,
  };
}

function displayOf(seats: readonly Seat[], color: Color): string {
  return seatByColor(seats, color).occupant?.displayName ?? color;
}

function setPhase(s: Internal, events: LiveEvent[], phase: Internal['phase']): void {
  if (s.phase === phase) return;
  s.phase = phase;
  events.push({ type: 'phase', phase });
}

function armTurn(s: Internal, rt: Runtime, events: LiveEvent[], now: number): void {
  if (!s.game) return;
  const color = s.game.turn;
  const seat = seatByColor(s.seats, color);
  s.turnEndsAt = now + rt.turnMs;
  events.push({
    type: 'turnStarted',
    userId: seat.occupant?.userId ?? null,
    color,
    town: seat.town,
    endsAt: s.turnEndsAt,
  });
}

function emitMove(
  s: Internal,
  events: LiveEvent[],
  move: LegalMove,
  from: GameState['tokens'][number]['pos'],
  userId: string | null,
): void {
  if (!s.game) return;
  const token = s.game.tokens[move.tokenIndex];
  if (!token) return;
  events.push({
    type: 'moved',
    userId,
    tokenIndex: token.index,
    path: stepsPath(from, move.steps, token.color),
  });
}

function currentPhase(s: Internal): GameState['phase'] | null {
  return s.game?.phase ?? null;
}

function emitCapture(
  s: Internal,
  events: LiveEvent[],
  capturedColor: Color,
  attackerColor: Color,
  userId: string | null,
): void {
  const a = displayOf(s.seats, attackerColor);
  const b = displayOf(s.seats, capturedColor);
  events.push({
    type: 'captured',
    userId,
    text: `@${a} knocked @${b} home`,
  });
}

function applyEngineMove(
  s: Internal,
  rt: Runtime,
  events: LiveEvent[],
  now: number,
  move: LegalMove,
  userId: string | null,
): void {
  if (!s.game) return;
  const from = s.game.tokens[move.tokenIndex]!.pos;
  const result = applyMove(s.game, move.tokenIndex, move.dieIndex);
  s.game = result.state;
  emitMove(s, events, move, from, userId);
  for (const ev of result.events) {
    if (ev.type === 'captured' && ev.capturedColor) {
      emitCapture(s, events, ev.capturedColor, ev.color, userId);
    }
  }
  if (s.game.phase === 'finished' && s.game.winner) {
    enterWinner(s, rt, events, now);
  }
}

function maybeAutoMove(s: Internal, rt: Runtime, events: LiveEvent[], now: number, userId: string | null): void {
  if (!s.game || s.phase !== 'PLAYING') return;
  const moves = legalMoves(s.game);
  if (moves.length !== 1) return;
  applyEngineMove(s, rt, events, now, moves[0]!, userId);
  maybeAutoMove(s, rt, events, now, userId);
}

function doRoll(s: Internal, rt: Runtime, events: LiveEvent[], now: number, userId: string | null): void {
  if (!s.game || s.game.phase !== 'awaiting_roll') return;
  const result = rollDice(s.game, rt.rng);
  s.game = result.state;
  events.push({ type: 'rolled', userId, values: result.values });
  if (s.game.phase === 'finished' && s.game.winner) {
    enterWinner(s, rt, events, now);
    return;
  }
  maybeAutoMove(s, rt, events, now, userId);
  if (s.phase === 'PLAYING' && s.game.phase === 'awaiting_roll') {
    armTurn(s, rt, events, now);
  }
}

function pickTimeoutMove(s: Internal, rt: Runtime): LegalMove | null {
  if (!s.game) return null;
  const moves = legalMoves(s.game);
  if (moves.length === 0) return null;
  const idx = Math.min(moves.length - 1, Math.floor(rt.rng() * moves.length));
  return moves[idx] ?? null;
}

function autoplayTurn(s: Internal, rt: Runtime, events: LiveEvent[], now: number): void {
  if (!s.game || s.phase !== 'PLAYING') return;
  const color = s.game.turn;
  const userId = seatByColor(s.seats, color).occupant?.userId ?? null;
  events.push({ type: 'timeout', userId });
  if (s.game.phase === 'awaiting_roll') {
    doRoll(s, rt, events, now, userId);
  }
  let played = 0;
  while (
    played < 4 &&
    s.phase === 'PLAYING' &&
    s.game &&
    s.game.phase === 'awaiting_move' &&
    s.game.turn === color
  ) {
    const move = pickTimeoutMove(s, rt);
    if (!move) break;
    played += 1;
    applyEngineMove(s, rt, events, now, move, userId);
  }
  if (
    s.phase === 'PLAYING' &&
    s.game &&
    events[events.length - 1]?.type !== 'turnStarted'
  ) {
    armTurn(s, rt, events, now);
  }
}

function enterWinner(s: Internal, rt: Runtime, events: LiveEvent[], now: number): void {
  if (!s.game?.winner) return;
  const seat = seatByColor(s.seats, s.game.winner);
  s.winnerUserId = seat.occupant?.userId ?? null;
  s.winnerStay = null;
  s.turnEndsAt = null;
  s.phaseEndsAt = now + rt.winnerMs;
  s.countdownBeat = null;
  setPhase(s, events, 'WINNER');
  events.push({
    type: 'winner',
    userId: s.winnerUserId,
    town: seat.town,
    displayName: seat.occupant?.displayName ?? null,
  });
}

function fillSeats(s: Internal, events: LiveEvent[]): void {
  for (const seat of s.seats) {
    if (seat.occupant) continue;
    const idx = s.queue.findIndex((o) => !s.sitOut.includes(o.userId));
    if (idx === -1) return;
    const [next] = s.queue.splice(idx, 1);
    if (!next) return;
    seat.occupant = next;
    events.push({
      type: 'joined',
      userId: next.userId,
      displayName: next.displayName,
      town: seat.town,
    });
  }
}

function startCountdown(s: Internal, rt: Runtime, events: LiveEvent[], now: number): void {
  if (seatedCount(s.seats) < 4) return;
  s.countdownBeat = 3;
  s.phaseEndsAt = now + rt.countdownMs;
  s.game = null;
  setPhase(s, events, 'COUNTDOWN');
  events.push({ type: 'countdown', beat: 3 });
}

function startPlaying(s: Internal, rt: Runtime, events: LiveEvent[], now: number): void {
  s.game = createGame({
    playerColors: ['red', 'green', 'yellow', 'blue'],
    houseRules: LIVE_HOUSE_RULES,
  });
  s.countdownBeat = null;
  s.phaseEndsAt = null;
  s.winnerUserId = null;
  s.winnerStay = null;
  setPhase(s, events, 'PLAYING');
  armTurn(s, rt, events, now);
}

function resolveWinnerWindow(s: Internal, rt: Runtime, events: LiveEvent[], now: number, stay: boolean): void {
  const winnerId = s.winnerUserId;
  const losers = s.seats
    .map((seat) => seat.occupant?.userId)
    .filter((id): id is string => !!id && id !== winnerId);

  s.sitOut = losers;
  for (const seat of s.seats) {
    if (seat.occupant && losers.includes(seat.occupant.userId)) {
      seat.occupant = null;
    }
  }

  if (!stay && winnerId) {
    const seat = seatByUser(s.seats, winnerId);
    if (seat) seat.occupant = null;
    events.push({ type: 'leave', userId: winnerId });
  } else if (stay && winnerId) {
    events.push({ type: 'stay', userId: winnerId });
  }

  s.winnerUserId = stay ? winnerId : null;
  s.winnerStay = stay;
  s.game = null;
  s.phaseEndsAt = null;
  s.turnEndsAt = null;
  s.countdownBeat = null;
  setPhase(s, events, 'WAITING');
  fillSeats(s, events);
  if (seatedCount(s.seats) === 4) {
    startCountdown(s, rt, events, now);
  }
}

function join(s: Internal, rt: Runtime, events: LiveEvent[], inbound: ChatInbound, now: number): void {
  const alreadySeated = !!seatByUser(s.seats, inbound.userId);
  if (alreadySeated) return;
  if (s.queue.some((q) => q.userId === inbound.userId)) return;

  const occ = occupantOf(inbound);
  const sittingOut = s.sitOut.includes(inbound.userId);
  const open = s.seats.find((seat) => seat.occupant === null);

  if (
    !sittingOut &&
    open &&
    (s.phase === 'INTRO' || s.phase === 'WAITING' || s.phase === 'COUNTDOWN' || s.phase === 'WINNER')
  ) {
    open.occupant = occ;
    events.push({
      type: 'joined',
      userId: occ.userId,
      displayName: occ.displayName,
      town: open.town,
    });
    if (s.phase === 'WAITING' && seatedCount(s.seats) === 4) {
      startCountdown(s, rt, events, now);
    }
    return;
  }

  s.queue.push(occ);
}

function playRoll(s: Internal, rt: Runtime, events: LiveEvent[], inbound: ChatInbound, now: number): void {
  if (s.paused || s.phase !== 'PLAYING' || !s.game) return;
  const seat = seatByUser(s.seats, inbound.userId);
  if (!seat || seat.color !== s.game.turn) return;
  if (s.game.phase !== 'awaiting_roll') return;
  doRoll(s, rt, events, now, inbound.userId);
}

function playMove(
  s: Internal,
  rt: Runtime,
  events: LiveEvent[],
  inbound: ChatInbound,
  piece: 1 | 2 | 3 | 4,
  now: number,
): void {
  if (s.paused || s.phase !== 'PLAYING' || !s.game) return;
  const seat = seatByUser(s.seats, inbound.userId);
  if (!seat || seat.color !== s.game.turn) return;
  if (s.game.phase !== 'awaiting_move') return;
  const tokenIndex = pieceArrayIndex(s.game.tokens, seat.color, piece);
  if (tokenIndex < 0) return;
  const moves = legalMoves(s.game).filter((m) => m.tokenIndex === tokenIndex);
  const move = moves.find((m) => m.dieIndex === 0) ?? moves[0];
  if (!move) return;
  applyEngineMove(s, rt, events, now, move, inbound.userId);
  maybeAutoMove(s, rt, events, now, inbound.userId);
  if (s.phase === 'PLAYING' && currentPhase(s) === 'awaiting_roll') {
    armTurn(s, rt, events, now);
  }
}

function handleParsed(
  s: Internal,
  rt: Runtime,
  events: LiveEvent[],
  inbound: ChatInbound,
  parsed: ParsedChat,
  now: number,
): void {
  switch (parsed.kind) {
    case 'none':
      return;
    case 'join':
      join(s, rt, events, inbound, now);
      return;
    case 'roll':
      playRoll(s, rt, events, inbound, now);
      return;
    case 'move':
      playMove(s, rt, events, inbound, parsed.piece, now);
      return;
    case 'stay':
      if (s.phase !== 'WINNER' || s.paused || inbound.userId !== s.winnerUserId || s.winnerStay !== null) {
        return;
      }
      resolveWinnerWindow(s, rt, events, now, true);
      return;
    case 'leave':
      if (s.phase !== 'WINNER' || s.paused || inbound.userId !== s.winnerUserId || s.winnerStay !== null) {
        return;
      }
      resolveWinnerWindow(s, rt, events, now, false);
      return;
    default: {
      const _x: never = parsed;
      return _x;
    }
  }
}

function countdownBeatFor(s: Internal, rt: Runtime, now: number): 3 | 2 | 1 {
  if (s.phaseEndsAt === null) return 3;
  const start = s.phaseEndsAt - rt.countdownMs;
  const elapsed = now - start;
  const third = rt.countdownMs / 3;
  if (elapsed < third) return 3;
  if (elapsed < third * 2) return 2;
  return 1;
}

function tickInternal(s: Internal, rt: Runtime, events: LiveEvent[], now: number): void {
  if (s.paused) return;
  switch (s.phase) {
    case 'INTRO':
      if (s.phaseEndsAt !== null && now >= s.phaseEndsAt) {
        s.phaseEndsAt = null;
        setPhase(s, events, 'WAITING');
        fillSeats(s, events);
        if (seatedCount(s.seats) === 4) {
          startCountdown(s, rt, events, now);
        }
      }
      return;
    case 'WAITING':
      return;
    case 'COUNTDOWN': {
      if (seatedCount(s.seats) < 4) {
        s.countdownBeat = null;
        s.phaseEndsAt = null;
        setPhase(s, events, 'WAITING');
        return;
      }
      const beat = countdownBeatFor(s, rt, now);
      if (beat !== s.countdownBeat) {
        s.countdownBeat = beat;
        events.push({ type: 'countdown', beat });
      }
      if (s.phaseEndsAt !== null && now >= s.phaseEndsAt) {
        startPlaying(s, rt, events, now);
      }
      return;
    }
    case 'PLAYING': {
      const color = s.game?.turn;
      const vacant = color ? !seatByColor(s.seats, color).occupant || s.vacant.has(color) : false;
      if (vacant && s.game) {
        autoplayTurn(s, rt, events, now);
        return;
      }
      if (s.turnEndsAt !== null && now >= s.turnEndsAt) {
        autoplayTurn(s, rt, events, now);
      }
      return;
    }
    case 'WINNER':
      if (s.winnerStay === null && s.phaseEndsAt !== null && now >= s.phaseEndsAt) {
        resolveWinnerWindow(s, rt, events, now, false);
      }
      return;
    default: {
      const _x: never = s.phase;
      return _x;
    }
  }
}

function pause(s: Internal, events: LiveEvent[], now: number): void {
  if (s.paused) return;
  s.paused = true;
  s.pauseHold = {
    phaseLeft: s.phaseEndsAt === null ? null : s.phaseEndsAt - now,
    turnLeft: s.turnEndsAt === null ? null : s.turnEndsAt - now,
  };
  events.push({ type: 'paused' });
}

function resume(s: Internal, events: LiveEvent[], now: number): void {
  if (!s.paused) return;
  s.paused = false;
  if (s.pauseHold) {
    s.phaseEndsAt = s.pauseHold.phaseLeft === null ? null : now + s.pauseHold.phaseLeft;
    s.turnEndsAt = s.pauseHold.turnLeft === null ? null : now + s.pauseHold.turnLeft;
  }
  s.pauseHold = null;
  events.push({ type: 'resumed' });
}

function kick(s: Internal, rt: Runtime, events: LiveEvent[], userId: string, now: number): void {
  s.queue = s.queue.filter((q) => q.userId !== userId);
  const seat = seatByUser(s.seats, userId);
  if (seat) {
    if (s.phase === 'PLAYING' && s.game && seat.color === s.game.turn) {
      seat.occupant = null;
      s.vacant.add(seat.color);
      events.push({ type: 'kicked', userId });
      autoplayTurn(s, rt, events, now);
      return;
    }
    if (s.phase === 'PLAYING') {
      s.vacant.add(seat.color);
    }
    seat.occupant = null;
  }
  events.push({ type: 'kicked', userId });
  if (s.phase !== 'PLAYING') fillSeats(s, events);
  if (s.phase === 'COUNTDOWN' && seatedCount(s.seats) < 4) {
    s.countdownBeat = null;
    s.phaseEndsAt = null;
    setPhase(s, events, 'WAITING');
  } else if (s.phase === 'WAITING' && seatedCount(s.seats) === 4) {
    startCountdown(s, rt, events, now);
  }
}

function newGame(s: Internal, rt: Runtime, events: LiveEvent[], now: number): void {
  if (s.phase === 'WINNER' && s.winnerStay === null) {
    resolveWinnerWindow(s, rt, events, now, false);
    return;
  }
  s.game = null;
  s.winnerUserId = null;
  s.winnerStay = null;
  s.turnEndsAt = null;
  s.countdownBeat = null;
  s.vacant.clear();
  s.paused = false;
  s.pauseHold = null;
  s.phaseEndsAt = null;
  setPhase(s, events, 'WAITING');
  fillSeats(s, events);
  if (seatedCount(s.seats) === 4) {
    startCountdown(s, rt, events, now);
  }
}

type LiveCommand =
  | { type: 'chat'; inbound: ChatInbound }
  | { type: 'admin'; action: AdminAction }
  | { type: 'gift'; gift: GiftInbound }
  | { type: 'tick'; now: number }
  | { type: 'loadGame'; game: GameState };

function giftEvent(gift: GiftInbound): LiveEvent {
  return {
    type: 'gift',
    userId: gift.userId,
    displayName: gift.displayName,
    giftId: gift.giftId,
    count: gift.count,
    text: `@${gift.displayName} sent ${gift.giftId} x${gift.count}`,
  };
}

function reduce(s: Internal, rt: Runtime, command: LiveCommand): LiveEvent[] {
  const events: LiveEvent[] = [];
  const now = command.type === 'tick' ? command.now : rt.clock.now();
  switch (command.type) {
    case 'chat': {
      if (s.paused) return events;
      const parsed = parseChat(command.inbound.text, rt.prefix, rt.commands);
      handleParsed(s, rt, events, command.inbound, parsed, now);
      return events;
    }
    case 'admin': {
      switch (command.action.type) {
        case 'pause':
          pause(s, events, now);
          return events;
        case 'resume':
          resume(s, events, now);
          return events;
        case 'skipTurn':
          if (s.phase === 'PLAYING') autoplayTurn(s, rt, events, now);
          return events;
        case 'newGame':
          newGame(s, rt, events, now);
          return events;
        case 'kick':
          kick(s, rt, events, command.action.userId, now);
          return events;
        default: {
          const _action: never = command.action;
          return _action;
        }
      }
    }
    case 'gift':
      events.push(giftEvent(command.gift));
      return events;
    case 'tick':
      tickInternal(s, rt, events, now);
      return events;
    case 'loadGame':
      s.game = command.game;
      s.phase = 'PLAYING';
      s.countdownBeat = null;
      s.phaseEndsAt = null;
      return events;
    default: {
      const _command: never = command;
      return _command;
    }
  }
}

const sessions = new WeakMap<LiveGame, { state: Internal; rt: Runtime }>();

export function createLiveGame(options: LiveConfig = {}): LiveGame {
  const rt: Runtime = {
    clock: options.clock ?? systemClock(),
    rng: options.rng ?? systemRng(),
    introMs: options.introMs ?? 5000,
    countdownMs: options.countdownMs ?? 3000,
    turnMs: options.turnMs ?? 20_000,
    winnerMs: options.winnerMs ?? 15_000,
    prefix: options.commandPrefix ?? '!',
    commands: { ...DEFAULT_COMMANDS, ...options.commands },
  };

  const state: Internal = {
    phase: rt.introMs === 0 ? 'WAITING' : 'INTRO',
    seats: emptySeats(),
    queue: [],
    sitOut: [],
    paused: false,
    phaseEndsAt: rt.introMs === 0 ? null : rt.clock.now() + rt.introMs,
    turnEndsAt: null,
    winnerUserId: null,
    winnerStay: null,
    game: null,
    countdownBeat: null,
    pauseHold: null,
    vacant: new Set(),
  };

  const api: LiveGame = {
    handleChat(inbound) {
      return reduce(state, rt, { type: 'chat', inbound });
    },
    handleAdmin(action) {
      return reduce(state, rt, { type: 'admin', action });
    },
    handleGift(gift) {
      return reduce(state, rt, { type: 'gift', gift });
    },
    tick(nowMs) {
      return reduce(state, rt, { type: 'tick', now: nowMs ?? rt.clock.now() });
    },
    snapshot() {
      return cloneState(state);
    },
  };

  sessions.set(api, { state, rt });
  return api;
}

export function __unsafeSetGame(live: LiveGame, game: GameState): void {
  const session = sessions.get(live);
  if (!session) {
    throw new Error('LiveGame has no internal state');
  }
  reduce(session.state, session.rt, { type: 'loadGame', game });
}
