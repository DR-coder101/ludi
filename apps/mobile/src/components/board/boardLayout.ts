/**
 * Ludi Board Layout Data
 * 
 * Defines all cell coordinates for a 15×15 grid board.
 * Cell indices follow the track from Red's start (0) clockwise.
 * 
 * Track layout (52 cells total):
 * - Red starts at index 0 (middle of bottom edge)
 * - Green starts at index 13 (middle of left edge)
 * - Yellow starts at index 26 (middle of top edge)
 * - Blue starts at index 39 (middle of right edge)
 */

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
  cells: CellPosition[]; // 6 cells from track to home
}

/**
 * Main track cells (52 total, forming a circuit around the board)
 * Index 0 = Red start (row 13, col 7)
 * Goes clockwise: right → up → left → down
 */
export const TRACK_CELLS: CellPosition[] = [
  // Red's start → moving right (bottom edge)
  { row: 13, col: 7 },  // 0 - Red start (SAFE)
  { row: 13, col: 8 },  // 1
  { row: 12, col: 8 },  // 2
  { row: 11, col: 8 },  // 3
  { row: 10, col: 8 },  // 4
  { row: 9, col: 8 },   // 5
  
  // Turn up (right edge bottom)
  { row: 8, col: 8 },   // 6
  { row: 8, col: 9 },   // 7
  { row: 8, col: 10 },  // 8 - SAFE (star)
  { row: 8, col: 11 },  // 9
  { row: 8, col: 12 },  // 10
  { row: 8, col: 13 },  // 11
  { row: 8, col: 14 },  // 12
  
  // Green's start (right edge middle)
  { row: 7, col: 14 },  // 13 - Green start (SAFE)
  { row: 6, col: 14 },  // 14
  { row: 6, col: 13 },  // 15
  { row: 6, col: 12 },  // 16
  { row: 6, col: 11 },  // 17
  { row: 6, col: 10 },  // 18
  
  // Turn left (top edge right)
  { row: 6, col: 9 },   // 19
  { row: 6, col: 8 },   // 20
  { row: 5, col: 8 },   // 21 - SAFE (star)
  { row: 4, col: 8 },   // 22
  { row: 3, col: 8 },   // 23
  { row: 2, col: 8 },   // 24
  { row: 1, col: 8 },   // 25
  
  // Yellow's start (top edge middle)
  { row: 1, col: 7 },   // 26 - Yellow start (SAFE)
  { row: 1, col: 6 },   // 27
  { row: 2, col: 6 },   // 28
  { row: 3, col: 6 },   // 29
  { row: 4, col: 6 },   // 30
  { row: 5, col: 6 },   // 31
  
  // Turn down (left edge top)
  { row: 6, col: 6 },   // 32
  { row: 6, col: 5 },   // 33
  { row: 6, col: 4 },   // 34 - SAFE (star)
  { row: 6, col: 3 },   // 35
  { row: 6, col: 2 },   // 36
  { row: 6, col: 1 },   // 37
  { row: 6, col: 0 },   // 38
  
  // Blue's start (left edge middle)
  { row: 7, col: 0 },   // 39 - Blue start (SAFE)
  { row: 8, col: 0 },   // 40
  { row: 8, col: 1 },   // 41
  { row: 8, col: 2 },   // 42
  { row: 8, col: 3 },   // 43
  { row: 8, col: 4 },   // 44
  
  // Turn right (bottom edge left)
  { row: 8, col: 5 },   // 45
  { row: 8, col: 6 },   // 46
  { row: 9, col: 6 },   // 47 - SAFE (star)
  { row: 10, col: 6 },  // 48
  { row: 11, col: 6 },  // 49
  { row: 12, col: 6 },  // 50
  { row: 13, col: 6 },  // 51
];

/**
 * Start cells for each color (indices into TRACK_CELLS)
 */
export const START_CELLS: Record<Color, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

/**
 * Safe cells (star markers) - indices into TRACK_CELLS
 * Start cells: 0 (red), 13 (green), 26 (yellow), 39 (blue)
 * Star cells: 8, 21, 34, 47
 */
export const SAFE_CELLS: number[] = [0, 13, 26, 39, 8, 21, 34, 47];

/**
 * Yards (starting areas) - each holds 4 tokens
 */
export const YARDS: Record<Color, YardPosition> = {
  red: {
    topLeft: { row: 10, col: 10 },
    tokenPositions: [
      { row: 10.5, col: 10.5 },
      { row: 10.5, col: 12.5 },
      { row: 12.5, col: 10.5 },
      { row: 12.5, col: 12.5 },
    ],
  },
  green: {
    topLeft: { row: 10, col: 1 },
    tokenPositions: [
      { row: 10.5, col: 1.5 },
      { row: 10.5, col: 3.5 },
      { row: 12.5, col: 1.5 },
      { row: 12.5, col: 3.5 },
    ],
  },
  yellow: {
    topLeft: { row: 1, col: 1 },
    tokenPositions: [
      { row: 1.5, col: 1.5 },
      { row: 1.5, col: 3.5 },
      { row: 3.5, col: 1.5 },
      { row: 3.5, col: 3.5 },
    ],
  },
  blue: {
    topLeft: { row: 1, col: 10 },
    tokenPositions: [
      { row: 1.5, col: 10.5 },
      { row: 1.5, col: 12.5 },
      { row: 3.5, col: 10.5 },
      { row: 3.5, col: 12.5 },
    ],
  },
};

/**
 * Home columns (6 cells leading to home center)
 */
export const HOME_COLUMNS: Record<Color, HomeColumnPosition> = {
  red: {
    cells: [
      { row: 12, col: 7 },
      { row: 11, col: 7 },
      { row: 10, col: 7 },
      { row: 9, col: 7 },
      { row: 8, col: 7 },
      { row: 7, col: 7 },
    ],
  },
  green: {
    cells: [
      { row: 7, col: 13 },
      { row: 7, col: 12 },
      { row: 7, col: 11 },
      { row: 7, col: 10 },
      { row: 7, col: 9 },
      { row: 7, col: 8 },
    ],
  },
  yellow: {
    cells: [
      { row: 2, col: 7 },
      { row: 3, col: 7 },
      { row: 4, col: 7 },
      { row: 5, col: 7 },
      { row: 6, col: 7 },
      { row: 7, col: 7 },
    ],
  },
  blue: {
    cells: [
      { row: 7, col: 1 },
      { row: 7, col: 2 },
      { row: 7, col: 3 },
      { row: 7, col: 4 },
      { row: 7, col: 5 },
      { row: 7, col: 6 },
    ],
  },
};

/**
 * Center triangles - 4 triangular regions meeting at the center
 * Each triangle is defined by its 3 corner cells
 */
export const CENTER_TRIANGLES: Record<Color, CellPosition[]> = {
  red: [
    { row: 8, col: 7 },   // top vertex
    { row: 7, col: 6 },   // left base
    { row: 7, col: 8 },   // right base
  ],
  green: [
    { row: 7, col: 9 },   // right vertex
    { row: 6, col: 8 },   // top base
    { row: 8, col: 8 },   // bottom base
  ],
  yellow: [
    { row: 6, col: 7 },   // bottom vertex
    { row: 7, col: 6 },   // left base
    { row: 7, col: 8 },   // right base
  ],
  blue: [
    { row: 7, col: 5 },   // left vertex
    { row: 6, col: 6 },   // top base
    { row: 8, col: 6 },   // bottom base
  ],
};

/**
 * Board dimensions
 */
export const BOARD_SIZE = 15;
export const CELL_SIZE = 1; // relative unit

/**
 * Color palette (standard Ludo colors)
 */
export const COLORS: Record<Color, string> = {
  red: '#E53935',
  green: '#43A047',
  yellow: '#FDD835',
  blue: '#1E88E5',
};
