import type { Color, GameState } from '@ludi/rules';
import { PLACES } from '../../theme/tokens';

export interface TurnCopy {
  kicker: string;
  title: string;
  sub: string;
  /** Pill label; null when there is nothing for this device to do. */
  cta: string | null;
}

interface TurnCopyInput {
  phase: GameState['phase'];
  dice: number | null;
  turn: Color;
  winner: Color | null;
  /** True when the player holding this device acts this turn. */
  isMine: boolean;
  name?: string;
  /** Whether any legal move brings a piece out of the yard. */
  canBringOut: boolean;
}

export function turnCopy({ phase, dice, turn, winner, isMine, name, canBringOut }: TurnCopyInput): TurnCopy {
  const place = PLACES[turn].full.toUpperCase();
  const who = name?.trim() ? name.trim().toUpperCase() : null;
  const kicker = who ? `${place} · ${who}` : place;
  const actor = who ?? place;

  if (phase === 'finished') {
    const champ = PLACES[winner ?? turn].full.toUpperCase();
    return { kicker: champ, title: `${champ} WINS!`, sub: 'Run di board!', cta: null };
  }

  if (phase === 'awaiting_roll') {
    return isMine
      ? { kicker, title: "IT'S YOUR TURN", sub: 'Tap the dice to roll', cta: 'TAP TO ROLL' }
      : { kicker, title: `${actor}'S TURN`, sub: 'Waiting for the roll', cta: null };
  }

  const n = dice ?? 0;
  const rolled = n === 6 ? 'A 6!' : `A ${n}`;
  if (!isMine) {
    return { kicker, title: `${actor} ROLLED ${rolled}`, sub: 'Waiting for their move', cta: null };
  }
  return {
    kicker,
    title: `YOU ROLLED ${rolled}`,
    sub: canBringOut ? 'Move a piece or bring one out' : 'Pick a piece to move',
    cta: 'PICK A PIECE',
  };
}
