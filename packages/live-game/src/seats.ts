import type { Color } from '@ludi/rules';
import type { Seat, TownId } from './types.js';

export const LIVE_HOUSE_RULES = {
  maxConsecutiveSixes: 2 as const,
  extraRollOnCapture: false,
  blockadeCanMoveTogether: false,
  exactFinishBonus: false,
  playForPlacements: false,
};

export const SEAT_DEFS: readonly {
  town: TownId;
  color: Color;
  hex: string;
  borderHex: string | null;
}[] = [
  { town: 'kingston', color: 'red', hex: '#E4202E', borderHex: null },
  { town: 'ochoRios', color: 'green', hex: '#0FAE47', borderHex: null },
  { town: 'montegoBay', color: 'yellow', hex: '#FED100', borderHex: null },
  { town: 'negril', color: 'blue', hex: '#26272B', borderHex: '#D9DCE1' },
];

export function emptySeats(): [Seat, Seat, Seat, Seat] {
  const seats = SEAT_DEFS.map((def) => ({
    town: def.town,
    color: def.color,
    hex: def.hex,
    borderHex: def.borderHex,
    occupant: null,
  }));
  return seats as [Seat, Seat, Seat, Seat];
}

export function seatByColor(seats: readonly Seat[], color: Color): Seat {
  const seat = seats.find((s) => s.color === color);
  if (!seat) {
    throw new Error(`No seat for color ${color}`);
  }
  return seat;
}

export function seatByUser(seats: readonly Seat[], userId: string): Seat | undefined {
  return seats.find((s) => s.occupant?.userId === userId);
}

export function seatedCount(seats: readonly Seat[]): number {
  return seats.filter((s) => s.occupant !== null).length;
}
