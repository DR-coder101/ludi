/**
 * Ludi Board Layout Data - 19×19 Jamaican Plywood Geometry
 *
 * Board structure (19×19 grid, 0-indexed: 0-18), per the approved design pack
 * (lib.js cellType / STARTS / ENTRIES) and docs/board/track-68.svg:
 * - Corner yards: 8×8 each (piece storage areas)
 * - Arms: 3 wide × 8 long; each arm = 17 track cells + a 7-cell home column
 * - Center: 3×3 (home)
 *
 * Geometry:
 * - Rows 0-7, Cols 0-7:     Top-left yard (Montego Bay, gold pieces, engine yellow)
 * - Rows 0-7, Cols 8-10:    Top arm
 * - Rows 0-7, Cols 11-18:   Top-right yard (Ocho Rios, green pieces, engine green)
 * - Rows 8-10, Cols 0-7:    Left arm
 * - Rows 8-10, Cols 8-10:   Center (3×3)
 * - Rows 8-10, Cols 11-18:  Right arm
 * - Rows 11-18, Cols 0-7:   Bottom-left yard (Negril, black pieces, engine blue)
 * - Rows 11-18, Cols 8-10:  Bottom arm
 * - Rows 11-18, Cols 11-18: Bottom-right yard (Kingston, red pieces, engine red)
 *
 * Track: 68 cells, increasing index runs counter-clockwise as drawn.
 * START indices 0 (Red), 17 (Green), 34 (Yellow), 51 (Blue); home entries
 * (arm end cells with the entry arrow) 66, 15, 32, 49.
 */

import {
  TRACK_SIZE,
  HOME_COLUMN_LENGTH,
  START_CELLS as ENGINE_START_CELLS,
  SAFE_CELLS as ENGINE_SAFE_CELLS,
  HOME_COLUMN_ENTRY as ENGINE_HOME_COLUMN_ENTRY,
} from '@ludi/rules';

export type Color = 'red' | 'green' | 'yellow' | 'blue';

export interface CellPosition {
  row: number;
  col: number;
}

export interface YardPosition {
  topLeft: CellPosition;
  tokenPositions: CellPosition[]; // 4 token positions within the yard
}

export interface HomeColumnPosition {
  cells: CellPosition[]; // engine homeColumn.step 1..7 → cells[0..6]
}

export { TRACK_SIZE, HOME_COLUMN_LENGTH };

/**
 * Main track cells, indexed by engine track cell (0-67).
 *
 * Every step is orthogonally adjacent except the four inner-corner steps
 * around the centre (6→7, 23→24, 40→41, 57→58), which are diagonal because
 * the arms only touch at those corners.
 */
export const TRACK_CELLS: CellPosition[] = [
  // Bottom arm, right lane, up toward centre
  { row: 17, col: 10 }, // 0  - Red START (safe)
  { row: 16, col: 10 }, // 1
  { row: 15, col: 10 }, // 2
  { row: 14, col: 10 }, // 3
  { row: 13, col: 10 }, // 4
  { row: 12, col: 10 }, // 5
  { row: 11, col: 10 }, // 6  - inner corner
  // Right arm, bottom lane, out to the edge
  { row: 10, col: 11 }, // 7  - diagonal from 6
  { row: 10, col: 12 }, // 8
  { row: 10, col: 13 }, // 9
  { row: 10, col: 14 }, // 10
  { row: 10, col: 15 }, // 11
  { row: 10, col: 16 }, // 12
  { row: 10, col: 17 }, // 13
  { row: 10, col: 18 }, // 14
  { row: 9, col: 18 },  // 15 - Green home entry (arrow left)
  { row: 8, col: 18 },  // 16
  // Right arm, top lane, back toward centre
  { row: 8, col: 17 },  // 17 - Green START (safe)
  { row: 8, col: 16 },  // 18
  { row: 8, col: 15 },  // 19
  { row: 8, col: 14 },  // 20
  { row: 8, col: 13 },  // 21
  { row: 8, col: 12 },  // 22
  { row: 8, col: 11 },  // 23 - inner corner
  // Top arm, right lane, up to the edge
  { row: 7, col: 10 },  // 24 - diagonal from 23
  { row: 6, col: 10 },  // 25
  { row: 5, col: 10 },  // 26
  { row: 4, col: 10 },  // 27
  { row: 3, col: 10 },  // 28
  { row: 2, col: 10 },  // 29
  { row: 1, col: 10 },  // 30
  { row: 0, col: 10 },  // 31
  { row: 0, col: 9 },   // 32 - Yellow home entry (arrow down)
  { row: 0, col: 8 },   // 33
  // Top arm, left lane, down toward centre
  { row: 1, col: 8 },   // 34 - Yellow START (safe)
  { row: 2, col: 8 },   // 35
  { row: 3, col: 8 },   // 36
  { row: 4, col: 8 },   // 37
  { row: 5, col: 8 },   // 38
  { row: 6, col: 8 },   // 39
  { row: 7, col: 8 },   // 40 - inner corner
  // Left arm, top lane, out to the edge
  { row: 8, col: 7 },   // 41 - diagonal from 40
  { row: 8, col: 6 },   // 42
  { row: 8, col: 5 },   // 43
  { row: 8, col: 4 },   // 44
  { row: 8, col: 3 },   // 45
  { row: 8, col: 2 },   // 46
  { row: 8, col: 1 },   // 47
  { row: 8, col: 0 },   // 48
  { row: 9, col: 0 },   // 49 - Blue home entry (arrow right)
  { row: 10, col: 0 },  // 50
  // Left arm, bottom lane, back toward centre
  { row: 10, col: 1 },  // 51 - Blue START (safe)
  { row: 10, col: 2 },  // 52
  { row: 10, col: 3 },  // 53
  { row: 10, col: 4 },  // 54
  { row: 10, col: 5 },  // 55
  { row: 10, col: 6 },  // 56
  { row: 10, col: 7 },  // 57 - inner corner
  // Bottom arm, left lane, down to the edge
  { row: 11, col: 8 },  // 58 - diagonal from 57
  { row: 12, col: 8 },  // 59
  { row: 13, col: 8 },  // 60
  { row: 14, col: 8 },  // 61
  { row: 15, col: 8 },  // 62
  { row: 16, col: 8 },  // 63
  { row: 17, col: 8 },  // 64
  { row: 18, col: 8 },  // 65
  { row: 18, col: 9 },  // 66 - Red home entry (arrow up)
  { row: 18, col: 10 }, // 67 - then wraps to 0
];

/**
 * Start cells for each color (indices into TRACK_CELLS), from the engine.
 */
export const START_CELLS: Record<Color, number> = ENGINE_START_CELLS;

/**
 * Home column entry cells (indices into TRACK_CELLS), from the engine.
 * The step after this cell is homeColumn step 1 (HOME_COLUMNS[color].cells[0]).
 */
export const HOME_COLUMN_ENTRY: Record<Color, number> = ENGINE_HOME_COLUMN_ENTRY;

/**
 * Safe cells (indices into TRACK_CELLS): the four start stars.
 */
export const SAFE_CELLS: number[] = Array.from(ENGINE_SAFE_CELLS).sort((a, b) => a - b);

/**
 * Yards (starting areas) - each 8×8 corner, holds 4 tokens
 *
 * Token positions are at quarter-points within each yard (2.5 cells in from edges)
 */
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
    topLeft: { row: 0, col: 11 },
    tokenPositions: [
      { row: 2.5, col: 13.5 },
      { row: 2.5, col: 15.5 },
      { row: 4.5, col: 13.5 },
      { row: 4.5, col: 15.5 },
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
    topLeft: { row: 11, col: 0 },
    tokenPositions: [
      { row: 13.5, col: 2.5 },
      { row: 13.5, col: 4.5 },
      { row: 15.5, col: 2.5 },
      { row: 15.5, col: 4.5 },
    ],
  },
};

/**
 * Home columns: the full 7-cell middle lane of each colour's arm, from the
 * cell after the entry arrow to the cell touching the centre.
 */
export const HOME_COLUMNS: Record<Color, HomeColumnPosition> = {
  red: {
    // Bottom arm middle lane (col 9), entered from (18,9), moving UP
    cells: [
      { row: 17, col: 9 }, // step 1
      { row: 16, col: 9 }, // step 2
      { row: 15, col: 9 }, // step 3
      { row: 14, col: 9 }, // step 4
      { row: 13, col: 9 }, // step 5
      { row: 12, col: 9 }, // step 6
      { row: 11, col: 9 }, // step 7 - touches centre
    ],
  },
  green: {
    // Right arm middle lane (row 9), entered from (9,18), moving LEFT
    cells: [
      { row: 9, col: 17 }, // step 1
      { row: 9, col: 16 }, // step 2
      { row: 9, col: 15 }, // step 3
      { row: 9, col: 14 }, // step 4
      { row: 9, col: 13 }, // step 5
      { row: 9, col: 12 }, // step 6
      { row: 9, col: 11 }, // step 7 - touches centre
    ],
  },
  yellow: {
    // Top arm middle lane (col 9), entered from (0,9), moving DOWN
    cells: [
      { row: 1, col: 9 }, // step 1
      { row: 2, col: 9 }, // step 2
      { row: 3, col: 9 }, // step 3
      { row: 4, col: 9 }, // step 4
      { row: 5, col: 9 }, // step 5
      { row: 6, col: 9 }, // step 6
      { row: 7, col: 9 }, // step 7 - touches centre
    ],
  },
  blue: {
    // Left arm middle lane (row 9), entered from (9,0), moving RIGHT
    cells: [
      { row: 9, col: 1 }, // step 1
      { row: 9, col: 2 }, // step 2
      { row: 9, col: 3 }, // step 3
      { row: 9, col: 4 }, // step 4
      { row: 9, col: 5 }, // step 5
      { row: 9, col: 6 }, // step 6
      { row: 9, col: 7 }, // step 7 - touches centre
    ],
  },
};

/**
 * Center triangles - 4 triangular regions in the 3×3 center block
 * The X pattern divides rows 8-10, cols 8-10 into 4 home triangles
 * Each triangle is defined by its 3 corner cells
 * 
 * Center point: {row: 9, col: 9}
 */
export const CENTER_TRIANGLES: Record<Color, CellPosition[]> = {
  red: [
    // Bottom triangle (Red enters from bottom arm)
    { row: 10, col: 8 },   // bottom-left vertex
    { row: 10, col: 10 },  // bottom-right vertex
    { row: 9, col: 9 },    // center point (apex)
  ],
  green: [
    // Right triangle (Green enters from right arm)
    { row: 8, col: 10 },   // top-right vertex
    { row: 10, col: 10 },  // bottom-right vertex
    { row: 9, col: 9 },    // center point (apex)
  ],
  yellow: [
    // Top triangle (Yellow enters from top arm)
    { row: 8, col: 8 },    // top-left vertex
    { row: 8, col: 10 },   // top-right vertex
    { row: 9, col: 9 },    // center point (apex)
  ],
  blue: [
    // Left triangle (Blue enters from left arm)
    { row: 8, col: 8 },    // top-left vertex
    { row: 10, col: 8 },   // bottom-left vertex
    { row: 9, col: 9 },    // center point (apex)
  ],
};

/**
 * Board dimensions
 */
export const BOARD_SIZE = 19;
export const CELL_SIZE = 1; // relative unit

/**
 * Flat piece colours (engine colour → hex), used by the win banner.
 * The board screen draws from `theme/tokens.ts`; place names live in `PLACES` there:
 * red = Kingston, green = Ocho Rios, yellow = Montego Bay (gold), blue = Negril (black pieces).
 */
export const COLORS: Record<Color, string> = {
  red: '#D32F2F',
  green: '#00A651',
  yellow: '#FCD116',
  blue: '#000000',
};
