/**
 * Board topology helpers for Ludi (Jamaican/Caribbean Ludo)
 * 
 * The board has:
 * - 52-cell main track (circular, absolute indices 0-51)
 * - 4 start cells (one per color): Red=0, Green=13, Yellow=26, Blue=39
 * - 4 safe/star cells: indices 8, 21, 34, 47
 * - 4 home columns (6 steps each per color)
 * - Total journey from start cell to home: 57 steps
 * 
 * Source: docs/GAME_RULES.md §1, §7
 */

import type { Color, TokenPos } from "./types";

export const START_CELLS: Record<Color, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

export const SAFE_CELLS = new Set([
  0, 13, 26, 39,  // start cells
  8, 21, 34, 47,  // star-marked cells
]);

export const HOME_COLUMN_ENTRY: Record<Color, number> = {
  red: 51,
  green: 12,
  yellow: 25,
  blue: 38,
};

export const TRACK_SIZE = 52;
export const HOME_COLUMN_LENGTH = 6;
export const TOTAL_JOURNEY_STEPS = 57;

/**
 * Convert a track cell index to its absolute position on the 52-cell circular track.
 */
export function normalizeTrackCell(cell: number): number {
  return ((cell % TRACK_SIZE) + TRACK_SIZE) % TRACK_SIZE;
}

/**
 * Check if a track cell is safe (no captures allowed).
 */
export function isSafeCell(cell: number): boolean {
  return SAFE_CELLS.has(normalizeTrackCell(cell));
}

/**
 * Check if a track cell is the start cell for a given color.
 */
export function isStartCell(cell: number, color: Color): boolean {
  return normalizeTrackCell(cell) === START_CELLS[color];
}

/**
 * Check if a track cell is the home column entry point for a given color.
 */
export function isHomeColumnEntry(cell: number, color: Color): boolean {
  return normalizeTrackCell(cell) === HOME_COLUMN_ENTRY[color];
}

/**
 * Compute the path for a token from its current position, moving `steps` forward.
 * Returns the resulting TokenPos after moving, or null if the move is invalid.
 * 
 * Path logic:
 * - From yard: can only move to start cell on roll of 6 (handled by caller)
 * - On track: advance clockwise; enter home column after passing entry point
 * - In home column: advance steps, must land exactly on home (step 6 + 1 = home)
 * - Home: cannot move
 */
export function computePath(
  currentPos: TokenPos,
  steps: number,
  color: Color
): TokenPos | null {
  if (steps <= 0) return null;

  // From yard: must be moving to start cell (caller validates roll = 6)
  if (currentPos.zone === "yard") {
    if (steps === 1) {
      return { zone: "track", cell: START_CELLS[color] };
    }
    return null;
  }

  // Already home: cannot move
  if (currentPos.zone === "home") {
    return null;
  }

  // In home column: advance steps, must not overshoot home
  if (currentPos.zone === "homeColumn") {
    const newStep = currentPos.step + steps;
    if (newStep === HOME_COLUMN_LENGTH + 1) {
      return { zone: "home" };
    }
    if (newStep > HOME_COLUMN_LENGTH + 1) {
      return null; // overshoot
    }
    return { zone: "homeColumn", step: newStep };
  }

  // On track: advance clockwise
  const startCell = START_CELLS[color];
  const entryCell = HOME_COLUMN_ENTRY[color];
  
  let stepsOnTrack = 0;
  let currentCell = currentPos.cell;
  
  // Count how many steps from start cell this token has taken
  if (currentCell >= startCell) {
    stepsOnTrack = currentCell - startCell;
  } else {
    stepsOnTrack = TRACK_SIZE - startCell + currentCell;
  }
  
  const totalStepsFromStart = stepsOnTrack + steps;
  
  // Check if we should enter home column
  // Token enters home column after completing full track (52 steps from start)
  if (totalStepsFromStart >= TRACK_SIZE) {
    const stepsIntoHomeColumn = totalStepsFromStart - TRACK_SIZE + 1;
    if (stepsIntoHomeColumn > HOME_COLUMN_LENGTH + 1) {
      return null; // overshoot
    }
    if (stepsIntoHomeColumn === HOME_COLUMN_LENGTH + 1) {
      return { zone: "home" };
    }
    return { zone: "homeColumn", step: stepsIntoHomeColumn };
  }
  
  // Still on track
  const newCell = normalizeTrackCell(startCell + totalStepsFromStart);
  return { zone: "track", cell: newCell };
}

/**
 * Get the absolute track cell for a color's start position.
 */
export function getStartCell(color: Color): number {
  return START_CELLS[color];
}

/**
 * Get all safe cell indices.
 */
export function getSafeCells(): number[] {
  return Array.from(SAFE_CELLS).sort((a, b) => a - b);
}

/**
 * Calculate distance traveled from start cell for a token on track.
 * Returns null if token is not on track.
 */
export function getDistanceFromStart(pos: TokenPos, color: Color): number | null {
  if (pos.zone !== "track") return null;
  
  const startCell = START_CELLS[color];
  const currentCell = pos.cell;
  
  if (currentCell >= startCell) {
    return currentCell - startCell;
  } else {
    return TRACK_SIZE - startCell + currentCell;
  }
}
