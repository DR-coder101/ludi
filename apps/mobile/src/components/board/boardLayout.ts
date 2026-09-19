/**
 * Ludi Board Layout Data - 19×19 Jamaican Plywood Geometry
 * 
 * Board structure (19×19 grid, 0-indexed: 0-18):
 * - Full board: 8 + 3 + 8 = 19 (yard + center + yard)
 * - Corner yards: 8×8 each (piece storage areas)
 * - Arms: 3 wide × 8 long (connecting yards to center)
 * - Center: 3×3 with X pattern (four home triangles)
 * 
 * Geometry:
 * - Rows 0-7, Cols 0-7:     Top-left yard (Yellow)
 * - Rows 0-7, Cols 8-10:    Top arm (3 wide × 8 long)
 * - Rows 0-7, Cols 11-18:   Top-right yard (Green)
 * - Rows 8-10, Cols 0-7:    Left arm (3 wide × 8 long)
 * - Rows 8-10, Cols 8-10:   Center (3×3)
 * - Rows 8-10, Cols 11-18:  Right arm (3 wide × 8 long)
 * - Rows 11-18, Cols 0-7:   Bottom-left yard (Blue)
 * - Rows 11-18, Cols 8-10:  Bottom arm (3 wide × 8 long)
 * - Rows 11-18, Cols 11-18: Bottom-right yard (Red)
 * 
 * Track: 52 cells clockwise, START indices at 0 (Red), 13 (Green), 26 (Yellow), 39 (Blue)
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
 * Main track cells (52 total, clockwise circuit)
 * 
 * Track uses outer lanes of the cross-shaped playable area.
 * Each segment = 13 cells (8 along one arm + 5 transitioning to next)
 * 
 * Segment distribution:
 * - Red (0-12): Bottom come-out → up right lane → turn right → right along bottom of right arm
 * - Green (13-25): Right come-out → continue right → turn up → up right lane of top arm
 * - Yellow (26-38): Top come-out → left then down left outer lane
 * - Blue (39-51): Left come-out → down then right back to Red start
 */
export const TRACK_CELLS: CellPosition[] = [
  // RED SEGMENT (cells 0-12): Red come-out → up col 10 → right on row 10
  { row: 18, col: 10 },  // 0 - Red START (SAFE) - bottom come-out
  { row: 17, col: 10 },  // 1
  { row: 16, col: 10 },  // 2
  { row: 15, col: 10 },  // 3
  { row: 14, col: 10 },  // 4
  { row: 13, col: 10 },  // 5
  { row: 12, col: 10 },  // 6
  { row: 11, col: 10 },  // 7 - end of bottom arm
  
  // Turn right: enter right arm bottom lane (row 10)
  { row: 10, col: 11 },  // 8 - SAFE (star) - corner connector
  { row: 10, col: 12 },  // 9
  { row: 10, col: 13 },  // 10
  { row: 10, col: 14 },  // 11
  { row: 10, col: 15 },  // 12
  
  // GREEN SEGMENT (cells 13-25): Green come-out → right → up col 18 → up col 10
  { row: 10, col: 16 },  // 13 - Green START (SAFE) - right come-out
  { row: 10, col: 17 },  // 14
  { row: 10, col: 18 },  // 15 - reach right edge
  
  // Turn up: travel up right edge then cross to top arm
  { row: 9, col: 18 },   // 16
  { row: 8, col: 18 },   // 17 - exit right arm
  
  // Continue up along right lane (col 10) of top arm
  { row: 7, col: 10 },   // 18
  { row: 6, col: 10 },   // 19
  { row: 5, col: 10 },   // 20
  { row: 4, col: 10 },   // 21 - SAFE (star) - approaching top corner
  { row: 3, col: 10 },   // 22
  { row: 2, col: 10 },   // 23
  { row: 1, col: 10 },   // 24
  { row: 0, col: 10 },   // 25 - reach top edge
  
  // YELLOW SEGMENT (cells 26-38): Yellow come-out → left → down col 8
  { row: 0, col: 9 },    // 26 - Yellow START (SAFE) - top come-out (turn left)
  { row: 0, col: 8 },    // 27 - reach left edge of top arm
  
  // Turn down: travel down left lane (col 8) of top arm
  { row: 1, col: 8 },    // 28
  { row: 2, col: 8 },    // 29
  { row: 3, col: 8 },    // 30
  { row: 4, col: 8 },    // 31
  { row: 5, col: 8 },    // 32
  { row: 6, col: 8 },    // 33
  { row: 7, col: 8 },    // 34 - SAFE (star) - corner connector (end of top arm)
  
  // Continue down entering left arm top lane (row 8)
  { row: 8, col: 7 },    // 35
  { row: 8, col: 6 },    // 36
  { row: 8, col: 5 },    // 37
  { row: 8, col: 4 },    // 38
  
  // BLUE SEGMENT (cells 39-51): Blue come-out → left → down → right back to Red
  { row: 8, col: 3 },    // 39 - Blue START (SAFE) - left come-out (continuing left)
  { row: 8, col: 2 },    // 40
  { row: 8, col: 1 },    // 41
  { row: 8, col: 0 },    // 42 - reach left edge
  
  // Turn down: travel down left edge then enter bottom arm
  { row: 9, col: 0 },    // 43
  { row: 10, col: 0 },   // 44 - exit left arm
  
  // Enter bottom arm, travel down left lane (col 8) then turn right
  { row: 11, col: 8 },   // 45
  { row: 12, col: 8 },   // 46
  { row: 13, col: 8 },   // 47 - SAFE (star) - corner connector
  { row: 14, col: 8 },   // 48
  { row: 15, col: 8 },   // 49
  { row: 16, col: 8 },   // 50
  { row: 17, col: 8 },   // 51
  // Cell 52 wraps back to Red start at {18, 10} (index 0)
];

/**
 * Start cells for each color (indices into TRACK_CELLS)
 * These are the come-out cells where players enter the track from their yards
 */
export const START_CELLS: Record<Color, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

/**
 * Safe cells (star markers + start cells) - indices into TRACK_CELLS
 * Start cells: 0 (red), 13 (green), 26 (yellow), 39 (blue)
 * Star cells: 8, 21, 34, 47
 */
export const SAFE_CELLS: number[] = [0, 13, 26, 39, 8, 21, 34, 47];

/**
 * Yards (starting areas) - each 8×8 corner, holds 4 tokens
 * 
 * Positioned adjacent to each color's come-out cell:
 * - Red: bottom-right corner (adjacent to bottom arm)
 * - Green: top-right corner (adjacent to right arm)
 * - Yellow: top-left corner (adjacent to top arm)
 * - Blue: bottom-left corner (adjacent to left arm)
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
 * Home columns (6 cells leading to home center)
 * 
 * Each runs from the track into the middle lane of that color's arm,
 * toward the 3×3 center. Maps engine steps 1-6 onto the 6 innermost cells
 * of each 8-cell arm (cells 6-1 from the edge, stopping at center boundary).
 * 
 * Home entry points (last track cell before entering home column):
 * - Red: track cell 51 {row: 17, col: 8} → enters home at {row: 17, col: 9}
 * - Green: track cell 12 {row: 10, col: 15} → enters home at {row: 9, col: 15}
 * - Yellow: track cell 25 {row: 0, col: 10} → enters home at {row: 1, col: 9}
 * - Blue: track cell 38 {row: 8, col: 4} → enters home at {row: 9, col: 4}
 */
export const HOME_COLUMNS: Record<Color, HomeColumnPosition> = {
  red: {
    // Bottom arm middle lane (col 9), moving UP toward center
    cells: [
      { row: 17, col: 9 },  // step 1 - enter home column from track cell 51
      { row: 16, col: 9 },  // step 2
      { row: 15, col: 9 },  // step 3
      { row: 14, col: 9 },  // step 4
      { row: 13, col: 9 },  // step 5
      { row: 12, col: 9 },  // step 6 - reach center edge (row 11 = center boundary)
    ],
  },
  green: {
    // Right arm middle lane (row 9), moving LEFT toward center
    cells: [
      { row: 9, col: 15 },  // step 1 - enter from track cell 12
      { row: 9, col: 14 },  // step 2
      { row: 9, col: 13 },  // step 3
      { row: 9, col: 12 },  // step 4
      { row: 9, col: 11 },  // step 5
      { row: 9, col: 10 },  // step 6 - reach center edge (col 11 = center boundary)
    ],
  },
  yellow: {
    // Top arm middle lane (col 9), moving DOWN toward center
    cells: [
      { row: 1, col: 9 },   // step 1 - enter from track cell 25
      { row: 2, col: 9 },   // step 2
      { row: 3, col: 9 },   // step 3
      { row: 4, col: 9 },   // step 4
      { row: 5, col: 9 },   // step 5
      { row: 6, col: 9 },   // step 6 - reach center edge (row 7 = center boundary)
    ],
  },
  blue: {
    // Left arm middle lane (row 9), moving RIGHT toward center
    cells: [
      { row: 9, col: 4 },   // step 1 - enter from track cell 38
      { row: 9, col: 5 },   // step 2
      { row: 9, col: 6 },   // step 3
      { row: 9, col: 7 },   // step 4
      { row: 9, col: 8 },   // step 5
      { row: 9, col: 9 },   // step 6 - reach center edge (col 8 = center boundary)
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
 * Jamaican Board Theme - Color Palette
 * 
 * Player piece colors (engine color → display color):
 * - Middlesex (engine: red)    → RED pieces (#D32F2F)
 * - Kingston (engine: green)   → GREEN pieces (#00A651)
 * - Surrey (engine: yellow)    → YELLOW pieces (#FCD116)
 * - Cornwall (engine: blue)    → BLACK pieces (#000000)
 */
export const COLORS: Record<Color, string> = {
  red: '#D32F2F',      // Middlesex - red pieces
  green: '#00A651',    // Kingston - Jamaica green
  yellow: '#FCD116',   // Surrey - Jamaica gold
  blue: '#000000',     // Cornwall - BLACK pieces (engine id stays 'blue')
};

/**
 * Jamaican Theme Palette
 * 
 * Based on Jamaican flag colors and traditional board design
 */
export const THEME = {
  // Board foundation
  board: '#1A1A1A',           // Black board background
  grid: '#FFFFFF',            // White grid lines (thin)
  
  // Jamaican flag colors
  jamaicaGreen: '#00A651',    // Jamaican green
  jamaicaGold: '#FCD116',     // Jamaican gold/yellow
  black: '#000000',           // Black (saltire, accents)
  
  // Board elements
  frame: '#000000',           // Black frame
  comeOut: '#00A651',         // Green come-out cells
  arrow: '#FFFFFF',           // White direction arrows
  safe: '#000000',            // Black circle on safe cells
  
  // Center 3×3 pattern
  centerX: '#FCD116',         // Yellow saltire X
  centerTopBottom: '#00A651', // Green top/bottom triangles
  centerLeftRight: '#000000', // Black left/right triangles
  centerSilhouette: '#000000', // Jamaica island silhouette
  
  // Home stretch pattern (repeating bands: Green → Yellow → Black)
  homePattern: ['#00A651', '#FCD116', '#000000', '#00A651', '#FCD116', '#000000'],
  
  // Outer lane pattern
  outerLane: {
    green: '#00A651',
    yellow: '#FCD116',
    black: '#000000',
  },
} as const;

/**
 * County Skins - Display names for player colors
 * 
 * Maps engine colors to Jamaican parish/county names.
 * Yard placement follows engine START adjacency, NOT photo corner labels.
 */
export const COUNTY_NAMES: Record<Color, string> = {
  red: 'Middlesex',    // Engine red=0  → bottom-right yard
  green: 'Kingston',   // Engine green=13 → top-right yard
  yellow: 'Surrey',    // Engine yellow=26 → top-left yard
  blue: 'Cornwall',    // Engine blue=39 → bottom-left yard (BLACK pieces)
};
