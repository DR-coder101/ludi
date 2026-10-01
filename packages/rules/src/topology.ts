/**
 * Board topology helpers for Ludi (Jamaican/Caribbean Ludo)
 *
 * Geometry is the 19×19 plywood board from the approved design pack
 * (lib.js cellType/STARTS/ENTRIES); see docs/board/track-68.svg.
 *
 * The board has:
 * - 68-cell main track (circular, absolute indices 0-67), 17 cells per arm
 * - 4 start cells (one per color), 17 apart: Red=0, Green=17, Yellow=34, Blue=51
 * - Safe cells: the 4 start cells (the only star cells on the board)
 * - Home column entry = start − 2 (the arm end cell with the entry arrow):
 *   Red=66, Green=15, Yellow=32, Blue=49
 * - 4 home columns of 7 cells each (homeColumn.step 1..7), then the centre (home)
 * - Journey from start cell to home: 66 track + 7 home column + 1 centre = 74 steps
 *
 * Source: docs/GAME_RULES.md §1, §7, §8
 */

import type { Color, TokenPos } from "./types";

export const TRACK_SIZE = 68;
export const ARM_LENGTH = TRACK_SIZE / 4;
export const HOME_COLUMN_LENGTH = 7;

export const START_CELLS: Record<Color, number> = {
  red: 0,
  green: ARM_LENGTH,
  yellow: ARM_LENGTH * 2,
  blue: ARM_LENGTH * 3,
};

/** Steps from a colour's start cell to its home column entry cell. */
export const HOME_ENTRY_DISTANCE = TRACK_SIZE - 2;

export const HOME_COLUMN_ENTRY: Record<Color, number> = {
  red: normalizeTrackCell(START_CELLS.red + HOME_ENTRY_DISTANCE),
  green: normalizeTrackCell(START_CELLS.green + HOME_ENTRY_DISTANCE),
  yellow: normalizeTrackCell(START_CELLS.yellow + HOME_ENTRY_DISTANCE),
  blue: normalizeTrackCell(START_CELLS.blue + HOME_ENTRY_DISTANCE),
};

/** Start cell → home (centre), counting every single-step move. */
export const TOTAL_JOURNEY_STEPS = HOME_ENTRY_DISTANCE + HOME_COLUMN_LENGTH + 1;

export const SAFE_CELLS = new Set([
  START_CELLS.red,
  START_CELLS.green,
  START_CELLS.yellow,
  START_CELLS.blue,
]);

/**
 * Convert a track cell index to its absolute position on the circular track.
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
 * - On track: advance in increasing index order; the step after the home
 *   column entry cell is homeColumn step 1
 * - In home column: advance steps, must land exactly on home (step 7 + 1 = home)
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
    return homeColumnOrHome(currentPos.step + steps);
  }

  const stepsOnTrack = distanceFromStart(currentPos.cell, color);

  // start − 1 is never on this colour's route (it turns off at start − 2)
  if (stepsOnTrack > HOME_ENTRY_DISTANCE) {
    return null;
  }

  const totalStepsFromStart = stepsOnTrack + steps;

  if (totalStepsFromStart > HOME_ENTRY_DISTANCE) {
    return homeColumnOrHome(totalStepsFromStart - HOME_ENTRY_DISTANCE);
  }

  return { zone: "track", cell: normalizeTrackCell(START_CELLS[color] + totalStepsFromStart) };
}

function homeColumnOrHome(step: number): TokenPos | null {
  if (step === HOME_COLUMN_LENGTH + 1) {
    return { zone: "home" };
  }
  if (step > HOME_COLUMN_LENGTH + 1) {
    return null; // overshoot
  }
  return { zone: "homeColumn", step };
}

function distanceFromStart(cell: number, color: Color): number {
  return normalizeTrackCell(cell - START_CELLS[color]);
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
  return distanceFromStart(pos.cell, color);
}
