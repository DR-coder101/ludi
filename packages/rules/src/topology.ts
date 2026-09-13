/**
 * Board topology helpers for Ludi
 * Source: GAME_RULES.md §1, §7, §8
 * 
 * Track layout: 52-cell circular track
 * Start cells: Red=0, Green=13, Yellow=26, Blue=39
 * Safe cells: Start cells (0, 13, 26, 39) + star cells (8, 21, 34, 47)
 * Home columns: 6 steps each, entered after completing full track
 * Total journey: 57 steps (52 track + 5 home column to reach center)
 */

import type { Color, TokenPos } from "./types";

export const TRACK_SIZE = 52;
export const HOME_COLUMN_LENGTH = 6;

export const START_CELLS: Record<Color, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

export const STAR_CELLS = [8, 21, 34, 47];

export const ALL_SAFE_CELLS = [
  ...Object.values(START_CELLS),
  ...STAR_CELLS,
];

/**
 * Check if a track cell is a safe cell (no captures allowed)
 */
export function isSafeCell(cell: number): boolean {
  return ALL_SAFE_CELLS.includes(cell);
}

/**
 * Check if a track cell is a start cell for the given color
 */
export function isStartCell(cell: number, color: Color): boolean {
  return START_CELLS[color] === cell;
}

/**
 * Get the track cell where a color enters their home column
 * This is the cell just before the home column entry
 */
export function getHomeColumnEntranceCell(color: Color): number {
  const start = START_CELLS[color];
  return (start + TRACK_SIZE - 1) % TRACK_SIZE;
}

/**
 * Advance a token position by a given number of steps
 * Returns null if the move is illegal (e.g., overshoots home)
 */
export function advancePosition(
  pos: TokenPos,
  steps: number,
  color: Color
): TokenPos | null {
  if (steps <= 0) return pos;

  switch (pos.zone) {
    case "yard": {
      if (steps === 6) {
        return { zone: "track", cell: START_CELLS[color] };
      }
      return null;
    }

    case "track": {
      const startCell = START_CELLS[color];
      let stepsFromStart = getStepsFromStart(pos.cell, startCell);
      const totalSteps = stepsFromStart + steps;
      
      if (totalSteps < TRACK_SIZE) {
        const newCell = (pos.cell + steps) % TRACK_SIZE;
        return { zone: "track", cell: newCell };
      }
      
      const stepsIntoHome = totalSteps - TRACK_SIZE;
      
      if (stepsIntoHome === 0) {
        return { zone: "track", cell: startCell };
      } else if (stepsIntoHome <= HOME_COLUMN_LENGTH) {
        return { zone: "homeColumn", step: stepsIntoHome };
      } else {
        return null;
      }
    }

    case "homeColumn": {
      const newStep = pos.step + steps;
      if (newStep === HOME_COLUMN_LENGTH) {
        return { zone: "home" };
      } else if (newStep < HOME_COLUMN_LENGTH) {
        return { zone: "homeColumn", step: newStep };
      } else {
        return null;
      }
    }

    case "home":
      return null;
  }
}

/**
 * Get the number of steps a token has traveled from its start cell
 */
function getStepsFromStart(currentCell: number, startCell: number): number {
  if (currentCell >= startCell) {
    return currentCell - startCell;
  } else {
    return TRACK_SIZE - startCell + currentCell;
  }
}

/**
 * Check if two positions refer to the same location
 */
export function positionsEqual(a: TokenPos, b: TokenPos): boolean {
  if (a.zone !== b.zone) return false;

  switch (a.zone) {
    case "yard":
    case "home":
      return true;
    case "track":
      return (b as any).cell === a.cell;
    case "homeColumn":
      return (b as any).step === a.step;
  }
}
