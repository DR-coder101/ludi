/**
 * Ludi board layout. Pixel tables live in `@ludi/board-geometry`.
 * Engine indices (START 0/17/34/51, home entry = start − 2) stay in `@ludi/rules`.
 *
 * Track 0→67 is clockwise. Towns stay in corners: Montego Bay TL gold,
 * Ocho Rios TR green pieces (engine blue), Negril BL black (engine green),
 * Kingston BR red.
 */
import {
  TRACK_SIZE,
  HOME_COLUMN_LENGTH,
  START_CELLS as ENGINE_START_CELLS,
  SAFE_CELLS as ENGINE_SAFE_CELLS,
  HOME_COLUMN_ENTRY as ENGINE_HOME_COLUMN_ENTRY,
} from '@ludi/rules';
import type { Color } from '@ludi/board-geometry';

export type { Color, CellPosition, YardPosition, HomeColumnPosition } from '@ludi/board-geometry';
export {
  BOARD_SIZE,
  CENTER_TRIANGLES,
  HOME_COLUMNS,
  TRACK_CELLS,
  YARDS,
} from '@ludi/board-geometry';

export { TRACK_SIZE, HOME_COLUMN_LENGTH };

export const START_CELLS: Record<Color, number> = ENGINE_START_CELLS;
export const HOME_COLUMN_ENTRY: Record<Color, number> = ENGINE_HOME_COLUMN_ENTRY;
export const SAFE_CELLS: number[] = Array.from(ENGINE_SAFE_CELLS).sort((a, b) => a - b);

export const CELL_SIZE = 1;
