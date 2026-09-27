import type { Color } from '@ludi/rules';

export interface Seat {
  name: string;
  isYou?: boolean;
  muted?: boolean;
}

/** Who sits at each engine colour; missing colours are empty yards. */
export type Seats = Partial<Record<Color, Seat>>;
