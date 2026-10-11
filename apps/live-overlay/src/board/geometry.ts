import type { Color, TokenPos } from '@ludi/rules';
import type { TownId } from '@ludi/live-game';

export const BOARD_ART = 380;
export const BOARD_BEVEL = 4;
export const BOARD_VIEW = BOARD_ART + BOARD_BEVEL * 2;
export const ARM_B = 27;
export const ALONG = (BOARD_ART - 3 * ARM_B) / 16;
export const YARD = 8 * ALONG;

export const TRACK: readonly [number, number][] = [
  [17, 10], [16, 10], [15, 10], [14, 10], [13, 10], [12, 10], [11, 10], [10, 11],
  [10, 12], [10, 13], [10, 14], [10, 15], [10, 16], [10, 17], [10, 18], [9, 18], [8, 18],
  [8, 17], [8, 16], [8, 15], [8, 14], [8, 13], [8, 12], [8, 11], [7, 10], [6, 10],
  [5, 10], [4, 10], [3, 10], [2, 10], [1, 10], [0, 10], [0, 9], [0, 8],
  [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [6, 8], [7, 8], [8, 7], [8, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0], [9, 0], [10, 0],
  [10, 1], [10, 2], [10, 3], [10, 4], [10, 5], [10, 6], [10, 7], [11, 8], [12, 8],
  [13, 8], [14, 8], [15, 8], [16, 8], [17, 8], [18, 8], [18, 9], [18, 10],
];

export const START: Record<Color, number> = { red: 0, green: 17, yellow: 34, blue: 51 };
export const ENTRY: Record<Color, number> = { red: 66, green: 15, yellow: 32, blue: 49 };

export const HOME_COL: Record<Color, readonly [number, number][]> = {
  red: [[17, 9], [16, 9], [15, 9], [14, 9], [13, 9], [12, 9], [11, 9]],
  green: [[9, 17], [9, 16], [9, 15], [9, 14], [9, 13], [9, 12], [9, 11]],
  yellow: [[1, 9], [2, 9], [3, 9], [4, 9], [5, 9], [6, 9], [7, 9]],
  blue: [[9, 1], [9, 2], [9, 3], [9, 4], [9, 5], [9, 6], [9, 7]],
};

export const YARD_TL: Record<Color, readonly [number, number]> = {
  red: [11, 11],
  green: [0, 11],
  yellow: [0, 0],
  blue: [11, 0],
};

export const COLOR_TOWN: Record<Color, TownId> = {
  red: 'kingston',
  green: 'ochoRios',
  yellow: 'montegoBay',
  blue: 'negril',
};

export const TOWN_COLOR: Record<TownId, Color> = {
  kingston: 'red',
  ochoRios: 'green',
  montegoBay: 'yellow',
  negril: 'blue',
};

export function gpos(i: number): number {
  if (i <= 8) return i * ALONG;
  if (i <= 11) return 8 * ALONG + (i - 8) * ARM_B;
  return 8 * ALONG + 3 * ARM_B + (i - 11) * ALONG;
}

export function cellSize(i: number): number {
  return gpos(i + 1) - gpos(i);
}

export function cellCenter(row: number, col: number): { x: number; y: number } {
  return {
    x: gpos(col) + cellSize(col) / 2,
    y: gpos(row) + cellSize(row) / 2,
  };
}

export function yardSlot(color: Color, index: number): { x: number; y: number } {
  const [r0, c0] = YARD_TL[color];
  const x = gpos(c0) + (26 + index * 36) * (YARD / 160);
  const y = gpos(r0) + 131 * (YARD / 160);
  return { x, y };
}

export function posToPoint(color: Color, pos: TokenPos, tokenIndex: number): { x: number; y: number } {
  switch (pos.zone) {
    case 'yard':
      return yardSlot(color, tokenIndex);
    case 'track': {
      const cell = TRACK[pos.cell];
      if (!cell) return yardSlot(color, tokenIndex);
      return cellCenter(cell[0], cell[1]);
    }
    case 'homeColumn': {
      const cell = HOME_COL[color][pos.step - 1];
      if (!cell) return homePoint(color);
      return cellCenter(cell[0], cell[1]);
    }
    case 'home':
      return homePoint(color);
    default: {
      const _n: never = pos;
      return _n;
    }
  }
}

export function homePoint(color: Color): { x: number; y: number } {
  const last = HOME_COL[color][6];
  if (!last) return { x: BOARD_ART / 2, y: BOARD_ART / 2 };
  return cellCenter(last[0], last[1]);
}

export function toDisplay(pt: { x: number; y: number }, size: number): { x: number; y: number } {
  return {
    x: ((pt.x + BOARD_BEVEL) / BOARD_VIEW) * size,
    y: ((pt.y + BOARD_BEVEL) / BOARD_VIEW) * size,
  };
}

export function minCell(): number {
  return Math.min(ARM_B, ALONG);
}
