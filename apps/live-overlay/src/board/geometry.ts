import {
  COLOR_BY_TOWN,
  HOME_COLUMNS,
  TOWN_BY_COLOR,
  TRACK_CELLS,
  YARDS,
  type Color,
  type TownId,
} from '@ludi/board-geometry';
import type { TokenPos } from '@ludi/rules';

export const BOARD_ART = 380;
export const BOARD_BEVEL = 4;
export const BOARD_VIEW = BOARD_ART + BOARD_BEVEL * 2;
export const ARM_B = 27;
export const ALONG = (BOARD_ART - 3 * ARM_B) / 16;
export const YARD = 8 * ALONG;

export const TRACK: readonly [number, number][] = TRACK_CELLS.map((c) => [c.row, c.col]);

export const START: Record<Color, number> = { red: 0, green: 17, yellow: 34, blue: 51 };
export const ENTRY: Record<Color, number> = { red: 66, green: 15, yellow: 32, blue: 49 };

export const HOME_COL: Record<Color, readonly [number, number][]> = {
  red: HOME_COLUMNS.red.cells.map((c) => [c.row, c.col]),
  green: HOME_COLUMNS.green.cells.map((c) => [c.row, c.col]),
  yellow: HOME_COLUMNS.yellow.cells.map((c) => [c.row, c.col]),
  blue: HOME_COLUMNS.blue.cells.map((c) => [c.row, c.col]),
};

export const YARD_TL: Record<Color, readonly [number, number]> = {
  red: [YARDS.red.topLeft.row, YARDS.red.topLeft.col],
  green: [YARDS.green.topLeft.row, YARDS.green.topLeft.col],
  yellow: [YARDS.yellow.topLeft.row, YARDS.yellow.topLeft.col],
  blue: [YARDS.blue.topLeft.row, YARDS.blue.topLeft.col],
};

export const COLOR_TOWN: Record<Color, TownId> = TOWN_BY_COLOR;
export const TOWN_COLOR: Record<TownId, Color> = COLOR_BY_TOWN;

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
