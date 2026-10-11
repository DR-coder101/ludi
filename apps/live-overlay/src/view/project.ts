import type { Color, GameState, TokenPos, TokenState } from '@ludi/rules';
import type { LiveEvent, LiveGameState, LivePhase, Occupant, TownId } from '@ludi/live-game';
import { TOWN } from '../theme.js';
import type { OverlayIntent, OverlayView, PieceView, ResultRow, SeatView, TurnView } from './types.js';

const TOWN_BY_COLOR: Record<Color, TownId> = {
  red: 'kingston',
  green: 'ochoRios',
  yellow: 'montegoBay',
  blue: 'negril',
};

const RESULT_RANK: readonly ResultRow['rank'][] = ['2nd', '3rd', '4th'];

export function screenForPhase(phase: LivePhase): OverlayView['kind'] {
  switch (phase) {
    case 'INTRO':
      return 'intro';
    case 'WAITING':
      return 'waiting';
    case 'COUNTDOWN':
      return 'countdown';
    case 'PLAYING':
      return 'game';
    case 'WINNER':
      return 'winner';
    default: {
      const _n: never = phase;
      return _n;
    }
  }
}

export function handleOf(name: string | null | undefined): string {
  if (!name) return '@?';
  return name.startsWith('@') ? name : `@${name}`;
}

export function possessiveHandle(name: string): string {
  const bare = handleOf(name).replace(/^@/, '').toUpperCase();
  return `@${bare}’S`;
}

function tokensOf(game: GameState | null): TokenState[] {
  return game?.tokens ?? [];
}

function outCount(tokens: readonly TokenState[], color: Color): number {
  return tokens.filter((t) => t.color === color && t.pos.zone !== 'yard').length;
}

function homeCount(tokens: readonly TokenState[], color: Color): number {
  return tokens.filter((t) => t.color === color && t.pos.zone === 'home').length;
}

function seatsOf(snapshot: LiveGameState): SeatView[] {
  const tokens = tokensOf(snapshot.game);
  return snapshot.seats.map((seat) => ({
    town: seat.town,
    color: seat.color,
    hex: seat.hex,
    borderHex: seat.borderHex,
    occupant: seat.occupant,
    filled: seat.occupant !== null,
    handle: seat.occupant ? handleOf(seat.occupant.displayName) : null,
    outCount: outCount(tokens, seat.color),
    homeCount: homeCount(tokens, seat.color),
  }));
}

function piecesOf(snapshot: LiveGameState): PieceView[] {
  return tokensOf(snapshot.game).map((token) => ({
    key: `${token.color}-${token.index}`,
    color: token.color,
    town: TOWN_BY_COLOR[token.color],
    tokenIndex: token.index,
    pos: token.pos,
  }));
}

function formatTimer(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function turnOf(snapshot: LiveGameState, now: number, turnMs = 20_000): TurnView | null {
  if (!snapshot.game) return null;
  const color = snapshot.game.turn;
  const seat = snapshot.seats.find((s) => s.color === color);
  if (!seat) return null;
  const remainingMs = snapshot.turnEndsAt === null ? turnMs : Math.max(0, snapshot.turnEndsAt - now);
  const handle = handleOf(seat.occupant?.displayName ?? TOWN[seat.town].title);
  return {
    town: seat.town,
    color,
    hex: seat.hex,
    handle,
    possessive: possessiveHandle(handle),
    endsAt: snapshot.turnEndsAt,
    remainingMs,
    timerLabel: formatTimer(remainingMs),
    fillRatio: Math.min(1, remainingMs / turnMs),
  };
}

function lastEvent<T extends LiveEvent['type']>(
  events: readonly LiveEvent[],
  type: T,
): Extract<LiveEvent, { type: T }> | undefined {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const ev = events[i];
    if (ev && ev.type === type) return ev as Extract<LiveEvent, { type: T }>;
  }
  return undefined;
}

function toastFrom(events: readonly LiveEvent[], intent: OverlayIntent): string | null {
  if (intent.toast !== undefined) return intent.toast;
  const joined = lastEvent(events, 'joined');
  if (!joined) return null;
  return `${handleOf(joined.displayName)} joined ${TOWN[joined.town].title}!`;
}

function captureFrom(events: readonly LiveEvent[], intent: OverlayIntent): string | null {
  if (intent.captureText !== undefined) return intent.captureText;
  const ev = lastEvent(events, 'captured');
  if (!ev) return null;
  return ev.text.endsWith('!') ? ev.text : `${ev.text}!`;
}

function giftFrom(events: readonly LiveEvent[], intent: OverlayIntent): string | null {
  if (intent.giftText !== undefined) return intent.giftText;
  const ev = lastEvent(events, 'gift');
  return ev?.text ?? null;
}

function nextUpLabel(queue: readonly Occupant[]): string | null {
  if (queue.length === 0) return null;
  const first = queue[0];
  if (!first) return null;
  if (queue.length === 1) return `NEXT: ${handleOf(first.displayName)} · !join`;
  return `NEXT: ${handleOf(first.displayName)} +${queue.length - 1} · !join`;
}

function nextUpNames(queue: readonly Occupant[]): string | null {
  if (queue.length === 0) return null;
  return `Next up: ${queue.map((o) => handleOf(o.displayName)).join(', ')}`;
}

function winnerResults(snapshot: LiveGameState): ResultRow[] {
  const winnerId = snapshot.winnerUserId;
  const tokens = tokensOf(snapshot.game);
  const losers = snapshot.seats
    .filter((s) => s.occupant?.userId !== winnerId)
    .map((s, i) => {
      const rank = RESULT_RANK[i] ?? '4th';
      return {
        rank,
        town: s.town,
        handle: handleOf(s.occupant?.displayName ?? TOWN[s.town].title),
        title: TOWN[s.town].title,
        homeCount: homeCount(tokens, s.color),
      };
    });
  return losers;
}

export function project(
  snapshot: LiveGameState,
  events: readonly LiveEvent[] = [],
  intent: OverlayIntent = {},
): OverlayView {
  const now = intent.now ?? Date.now();
  const kind = screenForPhase(snapshot.phase);
  const seats = seatsOf(snapshot);
  const joined = seats.filter((s) => s.filled).length;

  switch (kind) {
    case 'intro':
      return { kind: 'intro' };
    case 'waiting':
      return {
        kind: 'waiting',
        seats,
        joined,
        lastWinnerName: intent.lastWinnerName ?? null,
        toast: toastFrom(events, intent),
        full: joined === 4,
      };
    case 'countdown':
      return {
        kind: 'countdown',
        beat: snapshot.countdownBeat ?? 3,
        seats,
        joined,
      };
    case 'game': {
      const turn = turnOf(snapshot, now);
      if (!turn) {
        return {
          kind: 'waiting',
          seats,
          joined,
          lastWinnerName: intent.lastWinnerName ?? null,
          toast: null,
          full: joined === 4,
        };
      }
      const dice = snapshot.game?.dice;
      return {
        kind: 'game',
        seats,
        pieces: piecesOf(snapshot),
        turn,
        showTurnCard: intent.showTurnCard ?? lastEvent(events, 'turnStarted') !== undefined,
        captureText: captureFrom(events, intent),
        giftText: giftFrom(events, intent),
        nextUp: nextUpLabel(snapshot.queue),
        dice: dice ? [dice[0].value, dice[1].value] : null,
        gameNumber: intent.gameNumber ?? 1,
      };
    }
    case 'winner': {
      const winnerSeat =
        snapshot.seats.find((s) => s.occupant?.userId === snapshot.winnerUserId) ??
        snapshot.seats.find((s) => snapshot.game?.winner && s.color === snapshot.game.winner);
      const town = winnerSeat?.town ?? 'kingston';
      const remaining = snapshot.phaseEndsAt === null ? 15_000 : Math.max(0, snapshot.phaseEndsAt - now);
      const staySeconds = Math.max(0, Math.ceil(remaining / 1000));
      return {
        kind: 'winner',
        winnerTown: town,
        winnerHandle: handleOf(winnerSeat?.occupant?.displayName ?? 'winner'),
        winnerHex: winnerSeat?.hex ?? TOWN.kingston.hex,
        staySeconds,
        stayUrgent: staySeconds <= 5,
        seatsOpen: snapshot.winnerStay === true ? 3 : 4,
        results: winnerResults(snapshot),
        nextUp: nextUpNames(snapshot.queue),
        gameNumber: intent.gameNumber ?? 1,
      };
    }
    default: {
      const _n: never = kind;
      return _n;
    }
  }
}

export function townForColor(color: Color): TownId {
  return TOWN_BY_COLOR[color];
}

export function posKey(pos: TokenPos): string {
  switch (pos.zone) {
    case 'yard':
      return 'yard';
    case 'track':
      return `track:${pos.cell}`;
    case 'homeColumn':
      return `home:${pos.step}`;
    case 'home':
      return 'home';
    default: {
      const _n: never = pos;
      return _n;
    }
  }
}
