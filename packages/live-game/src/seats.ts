import { COLOR_BY_TOWN } from '@ludi/board-geometry';
import type { Color, GameConfig } from '@ludi/rules';
import type { Seat, TownId } from './types.js';

export const LIVE_HOUSE_RULES: GameConfig['houseRules'] = {
  maxConsecutiveSixes: 2,
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
  { town: 'kingston', color: COLOR_BY_TOWN.kingston, hex: '#E4202E', borderHex: null },
  { town: 'ochoRios', color: COLOR_BY_TOWN.ochoRios, hex: '#0FAE47', borderHex: null },
  { town: 'montegoBay', color: COLOR_BY_TOWN.montegoBay, hex: '#FED100', borderHex: null },
  { town: 'negril', color: COLOR_BY_TOWN.negril, hex: '#26272B', borderHex: '#D9DCE1' },
];

function makeSeat(def: (typeof SEAT_DEFS)[number]): Seat {
  return {
    town: def.town,
    color: def.color,
    hex: def.hex,
    borderHex: def.borderHex,
    occupant: null,
  };
}

export function emptySeats(): [Seat, Seat, Seat, Seat] {
  const a = SEAT_DEFS[0];
  const b = SEAT_DEFS[1];
  const c = SEAT_DEFS[2];
  const d = SEAT_DEFS[3];
  if (!a || !b || !c || !d) {
    throw new Error('Live seats must be the four towns');
  }
  return [makeSeat(a), makeSeat(b), makeSeat(c), makeSeat(d)];
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
