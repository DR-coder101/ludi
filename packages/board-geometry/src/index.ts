/**
 * On-screen 19×19 Ludi geometry. Engine indices are unchanged; this table
 * is the only source of clockwise pixel placement for mobile and overlay.
 *
 * Towns stay in corners. Engine green sits at Negril, engine blue at Ocho Rios,
 * so Red → Green → Yellow → Blue walks Kingston → Negril → Montego Bay → Ocho Rios.
 */
import {
  HOME_ENTRY_DISTANCE,
  START_CELLS,
  TOTAL_JOURNEY_STEPS,
  normalizeTrackCell,
  type Color,
  type TokenPos,
} from '@ludi/rules';

export type { Color };

export const BOARD_SIZE = 19;

export interface CellPosition {
  row: number;
  col: number;
}

export interface YardPosition {
  topLeft: CellPosition;
  tokenPositions: CellPosition[];
}

export interface HomeColumnPosition {
  cells: CellPosition[];
}

export type TownId = 'kingston' | 'ochoRios' | 'montegoBay' | 'negril';

export const TOWN_BY_COLOR: Record<Color, TownId> = {
  red: 'kingston',
  green: 'negril',
  yellow: 'montegoBay',
  blue: 'ochoRios',
};

export const COLOR_BY_TOWN: Record<TownId, Color> = {
  kingston: 'red',
  negril: 'green',
  montegoBay: 'yellow',
  ochoRios: 'blue',
};

/**
 * Engine track 0–67. Index 0 is Kingston OUT at (10,17). Increasing index
 * walks clockwise. Inner-corner steps 6→7, 23→24, 40→41, 57→58 are diagonal.
 */
export const TRACK_CELLS: CellPosition[] = [
  { row: 10, col: 17 }, // 0 Kingston START
  { row: 10, col: 16 }, // 1
  { row: 10, col: 15 }, // 2
  { row: 10, col: 14 }, // 3
  { row: 10, col: 13 }, // 4
  { row: 10, col: 12 }, // 5
  { row: 10, col: 11 }, // 6
  { row: 11, col: 10 }, // 7
  { row: 12, col: 10 }, // 8
  { row: 13, col: 10 }, // 9
  { row: 14, col: 10 }, // 10
  { row: 15, col: 10 }, // 11
  { row: 16, col: 10 }, // 12
  { row: 17, col: 10 }, // 13
  { row: 18, col: 10 }, // 14
  { row: 18, col: 9 }, // 15 Negril home entry
  { row: 18, col: 8 }, // 16
  { row: 17, col: 8 }, // 17 Negril START
  { row: 16, col: 8 }, // 18
  { row: 15, col: 8 }, // 19
  { row: 14, col: 8 }, // 20
  { row: 13, col: 8 }, // 21
  { row: 12, col: 8 }, // 22
  { row: 11, col: 8 }, // 23
  { row: 10, col: 7 }, // 24
  { row: 10, col: 6 }, // 25
  { row: 10, col: 5 }, // 26
  { row: 10, col: 4 }, // 27
  { row: 10, col: 3 }, // 28
  { row: 10, col: 2 }, // 29
  { row: 10, col: 1 }, // 30
  { row: 10, col: 0 }, // 31
  { row: 9, col: 0 }, // 32 Montego Bay home entry
  { row: 8, col: 0 }, // 33
  { row: 8, col: 1 }, // 34 Montego Bay START
  { row: 8, col: 2 }, // 35
  { row: 8, col: 3 }, // 36
  { row: 8, col: 4 }, // 37
  { row: 8, col: 5 }, // 38
  { row: 8, col: 6 }, // 39
  { row: 8, col: 7 }, // 40
  { row: 7, col: 8 }, // 41
  { row: 6, col: 8 }, // 42
  { row: 5, col: 8 }, // 43
  { row: 4, col: 8 }, // 44
  { row: 3, col: 8 }, // 45
  { row: 2, col: 8 }, // 46
  { row: 1, col: 8 }, // 47
  { row: 0, col: 8 }, // 48
  { row: 0, col: 9 }, // 49 Ocho Rios home entry
  { row: 0, col: 10 }, // 50
  { row: 1, col: 10 }, // 51 Ocho Rios START
  { row: 2, col: 10 }, // 52
  { row: 3, col: 10 }, // 53
  { row: 4, col: 10 }, // 54
  { row: 5, col: 10 }, // 55
  { row: 6, col: 10 }, // 56
  { row: 7, col: 10 }, // 57
  { row: 8, col: 11 }, // 58
  { row: 8, col: 12 }, // 59
  { row: 8, col: 13 }, // 60
  { row: 8, col: 14 }, // 61
  { row: 8, col: 15 }, // 62
  { row: 8, col: 16 }, // 63
  { row: 8, col: 17 }, // 64
  { row: 8, col: 18 }, // 65
  { row: 9, col: 18 }, // 66 Kingston home entry
  { row: 10, col: 18 }, // 67
];

export const YARDS: Record<Color, YardPosition> = {
  red: {
    topLeft: { row: 11, col: 11 },
    tokenPositions: [
      { row: 13.5, col: 13.5 },
      { row: 13.5, col: 15.5 },
      { row: 15.5, col: 13.5 },
      { row: 15.5, col: 15.5 },
    ],
  },
  green: {
    topLeft: { row: 11, col: 0 },
    tokenPositions: [
      { row: 13.5, col: 2.5 },
      { row: 13.5, col: 4.5 },
      { row: 15.5, col: 2.5 },
      { row: 15.5, col: 4.5 },
    ],
  },
  yellow: {
    topLeft: { row: 0, col: 0 },
    tokenPositions: [
      { row: 2.5, col: 2.5 },
      { row: 2.5, col: 4.5 },
      { row: 4.5, col: 2.5 },
      { row: 4.5, col: 4.5 },
    ],
  },
  blue: {
    topLeft: { row: 0, col: 11 },
    tokenPositions: [
      { row: 2.5, col: 13.5 },
      { row: 2.5, col: 15.5 },
      { row: 4.5, col: 13.5 },
      { row: 4.5, col: 15.5 },
    ],
  },
};

export const HOME_COLUMNS: Record<Color, HomeColumnPosition> = {
  red: {
    cells: [
      { row: 9, col: 17 },
      { row: 9, col: 16 },
      { row: 9, col: 15 },
      { row: 9, col: 14 },
      { row: 9, col: 13 },
      { row: 9, col: 12 },
      { row: 9, col: 11 },
    ],
  },
  green: {
    cells: [
      { row: 17, col: 9 },
      { row: 16, col: 9 },
      { row: 15, col: 9 },
      { row: 14, col: 9 },
      { row: 13, col: 9 },
      { row: 12, col: 9 },
      { row: 11, col: 9 },
    ],
  },
  yellow: {
    cells: [
      { row: 9, col: 1 },
      { row: 9, col: 2 },
      { row: 9, col: 3 },
      { row: 9, col: 4 },
      { row: 9, col: 5 },
      { row: 9, col: 6 },
      { row: 9, col: 7 },
    ],
  },
  blue: {
    cells: [
      { row: 1, col: 9 },
      { row: 2, col: 9 },
      { row: 3, col: 9 },
      { row: 4, col: 9 },
      { row: 5, col: 9 },
      { row: 6, col: 9 },
      { row: 7, col: 9 },
    ],
  },
};

export const CENTER_TRIANGLES: Record<Color, CellPosition[]> = {
  red: [
    { row: 8, col: 10 },
    { row: 10, col: 10 },
    { row: 9, col: 9 },
  ],
  green: [
    { row: 10, col: 8 },
    { row: 10, col: 10 },
    { row: 9, col: 9 },
  ],
  yellow: [
    { row: 8, col: 8 },
    { row: 10, col: 8 },
    { row: 9, col: 9 },
  ],
  blue: [
    { row: 8, col: 8 },
    { row: 8, col: 10 },
    { row: 9, col: 9 },
  ],
};

/** Finished tokens sit on the centroid of their arrival triangle. */
export const HOME_SPOTS: Record<Color, CellPosition> = {
  red: { row: 9, col: 10 },
  green: { row: 10, col: 9 },
  yellow: { row: 9, col: 8 },
  blue: { row: 8, col: 9 },
};

export { TOTAL_JOURNEY_STEPS };

/**
 * Journey progress 0 is that colour's start cell. 74 is the centre.
 * The engine never emits a progress outside 0..TOTAL_JOURNEY_STEPS.
 */
export function tokenPosForProgress(color: Color, progress: number): TokenPos | undefined {
  if (!Number.isInteger(progress) || progress < 0 || progress > TOTAL_JOURNEY_STEPS) {
    return undefined;
  }
  if (progress === TOTAL_JOURNEY_STEPS) return { zone: 'home' };
  if (progress > HOME_ENTRY_DISTANCE) {
    return { zone: 'homeColumn', step: progress - HOME_ENTRY_DISTANCE };
  }
  return { zone: 'track', cell: normalizeTrackCell(START_CELLS[color] + progress) };
}

export function cellForToken(color: Color, pos: TokenPos): CellPosition | undefined {
  switch (pos.zone) {
    case 'yard':
      return YARDS[color]?.tokenPositions[0];
    case 'track':
      return TRACK_CELLS[pos.cell];
    case 'homeColumn':
      return HOME_COLUMNS[color]?.cells[pos.step - 1];
    case 'home':
      return HOME_SPOTS[color];
    default: {
      const _never: never = pos;
      return _never;
    }
  }
}
