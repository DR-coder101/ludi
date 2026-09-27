import type { Color, GameState } from '@ludi/rules';
import { places } from '../../theme/tokens';
import type { Seats } from './types';

export interface LastRoll {
  value: number;
  color: Color;
  /** The roll left no legal move, so the engine passed the turn. */
  passed: boolean;
}

export interface TurnCopy {
  kicker: string;
  title: string;
  sub: string;
  cta: 'roll' | 'pick' | null;
}

interface TurnCopyInput {
  state: Pick<GameState, 'phase' | 'turn' | 'dice' | 'tokens' | 'winner'>;
  seats: Seats;
  /** This device controls the colour whose turn it is. */
  myTurn: boolean;
  lastRoll: LastRoll | null;
}

function who(color: Color, seats: Seats): string {
  return seats[color]?.name ?? places[color].full;
}

export function turnCopy({ state, seats, myTurn, lastRoll }: TurnCopyInput): TurnCopy {
  const color = state.phase === 'finished' && state.winner ? state.winner : state.turn;
  const place = places[color].full.toUpperCase();
  const seat = seats[color];
  const kicker = seat ? `${place} · ${seat.name.toUpperCase()}` : place;
  const name = who(color, seats).toUpperCase();

  if (state.phase === 'finished') {
    return { kicker, title: `${name} WINS!`, sub: 'Game over', cta: null };
  }

  if (state.phase === 'awaiting_move' && state.dice != null) {
    const n = state.dice;
    if (!myTurn) return { kicker, title: `${name} ROLLED A ${n}`, sub: 'Waiting for a move', cta: null };
    const canBringOut = n === 6 && state.tokens.some((t) => t.color === color && t.pos.zone === 'yard');
    return {
      kicker,
      title: n === 6 ? 'YOU ROLLED A 6!' : `YOU ROLLED A ${n}`,
      sub: canBringOut ? 'Move a piece or bring one out' : 'Pick a piece to move',
      cta: 'pick',
    };
  }

  const passed =
    lastRoll?.passed && lastRoll.color !== color
      ? `${who(lastRoll.color, seats)} rolled a ${lastRoll.value}: no moves`
      : null;
  const again = lastRoll?.value === 6 && lastRoll.color === color && !lastRoll.passed;
  if (!myTurn) {
    return { kicker, title: `${name}'S TURN`, sub: passed ?? (again ? 'Rolled a 6: rolling again' : 'Waiting for the roll'), cta: null };
  }
  if (again) return { kicker, title: 'ROLL AGAIN!', sub: 'You rolled a 6: tap the dice', cta: 'roll' };
  return { kicker, title: "IT'S YOUR TURN", sub: passed ?? 'Tap the dice to roll', cta: 'roll' };
}
