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
 * PLYWOOD-FAITHFUL LAYOUT: Come-outs adjacent to each 8×8 yard corner.
 * Track flows clockwise around the cross, with START cells at yard entry points.
 * 
 * Yard positions (for reference):
 * - Red yard: rows 11-18, cols 11-18 → START at (11, 10) [just outside top-left]
 * - Green yard: rows 0-7, cols 11-18 → START at (8, 18) [just below bottom-right]
 * - Yellow yard: rows 0-7, cols 0-7 → START at (7, 8) [just right of bottom-right]
 * - Blue yard: rows 11-18, cols 0-7 → START at (10, 7) [just above top-right]
 * 
 * Each segment = 13 cells, START indices remain 0/13/26/39
 */
export const TRACK_CELLS: CellPosition[] = [
  // RED SEGMENT (cells 0-12): Red come-out ADJACENT TO YARD → up → right
  { row: 11, col: 10 },  // 0 - Red START (SAFE) - adjacent to red yard top-left corner
  { row: 10, col: 10 },  // 1 - enter right arm
  { row: 10, col: 11 },  // 2
  { row: 10, col: 12 },  // 3
  { row: 10, col: 13 },  // 4
  { row: 10, col: 14 },  // 5
  { row: 10, col: 15 },  // 6
  { row: 10, col: 16 },  // 7
  { row: 10, col: 17 },  // 8 - SAFE (star) - right arm approach
  { row: 10, col: 18 },  // 9 - reach right edge
  
  // Turn up along right edge
  { row: 9, col: 18 },   // 10
  { row: 8, col: 18 },   // 11
  { row: 7, col: 18 },   // 12 - reach green yard area
  
  // GREEN SEGMENT (cells 13-25): Green come-out ADJACENT TO YARD → continue up → left
  { row: 8, col: 18 },   // 13 - Green START (SAFE) - adjacent to green yard bottom-right corner
  { row: 7, col: 18 },   // 14
  { row: 6, col: 18 },   // 15
  { row: 5, col: 18 },   // 16
  { row: 4, col: 18 },   // 17
  { row: 3, col: 18 },   // 18
  { row: 2, col: 18 },   // 19
  { row: 1, col: 18 },   // 20
  { row: 0, col: 18 },   // 21 - SAFE (star) - top edge
  
  // Turn left along top edge
  { row: 0, col: 17 },   // 22
  { row: 0, col: 16 },   // 23
  { row: 0, col: 15 },   // 24
  { row: 0, col: 14 },   // 25 - approach yellow yard
  
  // YELLOW SEGMENT (cells 26-38): Yellow come-out ADJACENT TO YARD → down left lane
  { row: 7, col: 8 },    // 26 - Yellow START (SAFE) - adjacent to yellow yard bottom-right corner
  { row: 8, col: 8 },    // 27 - enter left arm
  { row: 8, col: 7 },    // 28
  { row: 8, col: 6 },    // 29
  { row: 8, col: 5 },    // 30
  { row: 8, col: 4 },    // 31
  { row: 8, col: 3 },    // 32
  { row: 8, col: 2 },    // 33
  { row: 8, col: 1 },    // 34 - SAFE (star) - left arm approach
  { row: 8, col: 0 },    // 35 - reach left edge
  
  // Turn down along left edge
  { row: 9, col: 0 },    // 36
  { row: 10, col: 0 },   // 37
  { row: 11, col: 0 },   // 38 - reach blue yard area
  
  // BLUE SEGMENT (cells 39-51): Blue come-out ADJACENT TO YARD → continue down → right
  { row: 10, col: 7 },   // 39 - Blue START (SAFE) - adjacent to blue yard top-right corner
  { row: 11, col: 7 },   // 40
  { row: 12, col: 7 },   // 41
  { row: 13, col: 7 },   // 42
  { row: 14, col: 7 },   // 43
  { row: 15, col: 7 },   // 44
  { row: 16, col: 7 },   // 45
  { row: 17, col: 7 },   // 46
  { row: 18, col: 7 },   // 47 - SAFE (star) - bottom edge
  
  // Turn right along bottom edge then up to Red start
  { row: 18, col: 8 },   // 48
  { row: 18, col: 9 },   // 49
  { row: 18, col: 10 },  // 50
  { row: 17, col: 10 },  // 51
  // Cell 52 wraps back to Red start at (11, 10) [index 0]
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
 * Star cells: 8, 21, 34, 47 (one before each next player's come-out)
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
 * - Red: track cell 51 {row: 17, col: 10} → enters home at {row: 16, col: 10}
 * - Green: track cell 12 {row: 7, col: 18} → enters home at {row: 7, col: 17}
 * - Yellow: track cell 25 {row: 0, col: 14} → enters home at {row: 1, col: 14} (WRONG - needs fix)
 * - Blue: track cell 38 {row: 11, col: 0} → enters home at {row: 11, col: 1}
 */
export const HOME_COLUMNS: Record<Color, HomeColumnPosition> = {
  red: {
    // Bottom arm middle lane (col 9), moving UP toward center
    cells: [
      { row: 17, col: 9 },  // step 1
      { row: 16, col: 9 },  // step 2
      { row: 15, col: 9 },  // step 3
      { row: 14, col: 9 },  // step 4
      { row: 13, col: 9 },  // step 5
      { row: 12, col: 9 },  // step 6 - reach center edge
    ],
  },
  green: {
    // Right arm middle lane (row 9), moving LEFT toward center
    cells: [
      { row: 9, col: 17 },  // step 1
      { row: 9, col: 16 },  // step 2
      { row: 9, col: 15 },  // step 3
      { row: 9, col: 14 },  // step 4
      { row: 9, col: 13 },  // step 5
      { row: 9, col: 12 },  // step 6 - reach center edge
    ],
  },
  yellow: {
    // Top arm middle lane (col 9), moving DOWN toward center
    cells: [
      { row: 1, col: 9 },   // step 1
      { row: 2, col: 9 },   // step 2
      { row: 3, col: 9 },   // step 3
      { row: 4, col: 9 },   // step 4
      { row: 5, col: 9 },   // step 5
      { row: 6, col: 9 },   // step 6 - reach center edge
    ],
  },
  blue: {
    // Left arm middle lane (row 9), moving RIGHT toward center
    cells: [
      { row: 9, col: 1 },   // step 1
      { row: 9, col: 2 },   // step 2
      { row: 9, col: 3 },   // step 3
      { row: 9, col: 4 },   // step 4
      { row: 9, col: 5 },   // step 5
      { row: 9, col: 6 },   // step 6 - reach center edge
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
