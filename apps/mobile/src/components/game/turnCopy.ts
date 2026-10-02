import type { Color, Die, GameState } from '@ludi/rules';
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
  dice: readonly Die[] | null;
  /** Throws this turn showing a 6; > 0 while awaiting a roll means a bonus roll. */
  consecutiveSixes: number;
  turn: Color;
  winner: Color | null;
  /** True when the player holding this device acts this turn. */
  isMine: boolean;
  name?: string;
  /** Whether any legal move brings a piece out of the yard. */
  canBringOut: boolean;
  /** Both dice playable with different values, so the player picks one. */
  canPickDie: boolean;
}

export function turnCopy(input: TurnCopyInput): TurnCopy {
  const { phase, dice, consecutiveSixes, turn, winner, isMine, name, canBringOut, canPickDie } = input;
  const place = PLACES[turn].full.toUpperCase();
  const who = name?.trim() ? name.trim().toUpperCase() : null;
  const kicker = who ? `${place} · ${who}` : place;
  const actor = who ?? place;

  if (phase === 'finished') {
    const champ = PLACES[winner ?? turn].full.toUpperCase();
    return { kicker: champ, title: `${champ} WINS!`, sub: 'Run di board!', cta: null };
  }

  if (phase === 'awaiting_roll') {
    const bonus = consecutiveSixes > 0;
    if (isMine) {
      return bonus
        ? { kicker, title: 'ROLL AGAIN!', sub: 'You threw a 6 — bonus roll', cta: 'TAP TO ROLL' }
        : { kicker, title: "IT'S YOUR TURN", sub: 'Tap the dice to roll', cta: 'TAP TO ROLL' };
    }
    return { kicker, title: `${actor}'S TURN`, sub: bonus ? 'Bonus roll coming' : 'Waiting for the roll', cta: null };
  }

  const faces = dice ?? [];
  const left = faces.filter((d) => !d.used);
  const throwText = faces.map((d) => d.value).join(' + ');
  const bang = faces.some((d) => d.value === 6) ? '!' : '';

  if (!isMine) {
    const title = left.length === 1 ? `${actor} HAS A ${left[0].value} LEFT` : `${actor} ROLLED ${throwText}${bang}`;
    return { kicker, title, sub: 'Waiting for their move', cta: null };
  }

  if (left.length === 1) {
    const n = left[0].value;
    return {
      kicker,
      title: `PLAY YOUR ${n}`,
      sub: canBringOut ? 'Bring one out or move a piece' : `One die left — move a piece ${n}`,
      cta: 'PICK A PIECE',
    };
  }

  let sub = 'Two moves — pick a piece';
  if (canBringOut) sub = 'Bring one out or move — two moves';
  else if (canPickDie) sub = 'Tap a die, then a piece';
  return { kicker, title: `YOU ROLLED ${throwText}${bang}`, sub, cta: 'PICK A PIECE' };
}
