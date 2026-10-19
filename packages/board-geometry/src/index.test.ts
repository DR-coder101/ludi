import { describe, expect, it } from 'vitest';
import {
  HOME_COLUMN_ENTRY,
  START_CELLS,
  TOTAL_JOURNEY_STEPS,
  TRACK_SIZE,
  type Color,
} from '@ludi/rules';
import {
  BOARD_SIZE,
  COLOR_BY_TOWN,
  HOME_COLUMNS,
  TOWN_BY_COLOR,
  TRACK_CELLS,
  YARDS,
  cellForToken,
  tokenPosForProgress,
  type CellPosition,
  type TownId,
} from './index';

const COLORS: Color[] = ['red', 'green', 'yellow', 'blue'];

type Dir = 'left' | 'right' | 'up' | 'down';

/** Dean's approved clockwise layout, 19×19, row,col from top-left. */
const DEAN: Record<
  Color,
  {
    town: TownId;
    start: CellPosition;
    entry: CellPosition;
    arrow: Dir;
    home: CellPosition[];
  }
> = {
  red: {
    town: 'kingston',
    start: { row: 10, col: 17 },
    entry: { row: 9, col: 18 },
    arrow: 'left',
    home: [
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
    town: 'negril',
    start: { row: 17, col: 8 },
    entry: { row: 18, col: 9 },
    arrow: 'up',
    home: [
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
    town: 'montegoBay',
    start: { row: 8, col: 1 },
    entry: { row: 9, col: 0 },
    arrow: 'right',
    home: [
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
    town: 'ochoRios',
    start: { row: 1, col: 10 },
    entry: { row: 0, col: 9 },
    arrow: 'down',
    home: [
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

const YARD_BOX: Record<TownId, { r0: number; c0: number }> = {
  kingston: { r0: 11, c0: 11 },
  ochoRios: { r0: 0, c0: 11 },
  montegoBay: { r0: 0, c0: 0 },
  negril: { r0: 11, c0: 0 },
};

function stepDir(from: CellPosition, to: CellPosition): Dir {
  if (to.row === from.row && to.col === from.col - 1) return 'left';
  if (to.row === from.row && to.col === from.col + 1) return 'right';
  if (to.col === from.col && to.row === from.row - 1) return 'up';
  if (to.col === from.col && to.row === from.row + 1) return 'down';
  throw new Error(`not orthogonal: (${from.row},${from.col}) → (${to.row},${to.col})`);
}

function inYard(cell: CellPosition, town: TownId): boolean {
  const { r0, c0 } = YARD_BOX[town];
  return cell.row >= r0 && cell.row < r0 + 8 && cell.col >= c0 && cell.col < c0 + 8;
}

function orthogonallyAdjacentToYard(cell: CellPosition, town: TownId): boolean {
  const neighbours = [
    { row: cell.row - 1, col: cell.col },
    { row: cell.row + 1, col: cell.col },
    { row: cell.row, col: cell.col - 1 },
    { row: cell.row, col: cell.col + 1 },
  ];
  return neighbours.some((n) => inYard(n, town));
}

describe('Dean clockwise layout', () => {
  it('places each START on the approved OUT square', () => {
    for (const color of COLORS) {
      expect(TRACK_CELLS[START_CELLS[color]], color).toEqual(DEAN[color].start);
    }
  });

  it('places each home entry on the approved arrow cell, two before start', () => {
    for (const color of COLORS) {
      expect(TRACK_CELLS[HOME_COLUMN_ENTRY[color]], color).toEqual(DEAN[color].entry);
      expect((START_CELLS[color] - HOME_COLUMN_ENTRY[color] + TRACK_SIZE) % TRACK_SIZE).toBe(2);
    }
  });

  it('points each entry arrow the approved way into the shaded home lane', () => {
    for (const color of COLORS) {
      const entry = TRACK_CELLS[HOME_COLUMN_ENTRY[color]];
      const first = HOME_COLUMNS[color].cells[0];
      expect(HOME_COLUMNS[color].cells).toEqual(DEAN[color].home);
      expect(stepDir(entry, first), color).toBe(DEAN[color].arrow);
    }
  });

  it('keeps each START orthogonally adjacent to its own town yard', () => {
    for (const color of COLORS) {
      const town = TOWN_BY_COLOR[color];
      const start = TRACK_CELLS[START_CELLS[color]];
      expect(inYard(start, town), `${color} start inside yard`).toBe(false);
      expect(orthogonallyAdjacentToYard(start, town), color).toBe(true);
      expect(YARDS[color].topLeft).toEqual({
        row: YARD_BOX[town].r0,
        col: YARD_BOX[town].c0,
      });
    }
  });

  it('maps engine colours onto towns so turn order is clockwise', () => {
    expect(TOWN_BY_COLOR).toEqual({
      red: 'kingston',
      green: 'negril',
      yellow: 'montegoBay',
      blue: 'ochoRios',
    });
    expect(COLOR_BY_TOWN.negril).toBe('green');
    expect(COLOR_BY_TOWN.ochoRios).toBe('blue');
  });

  it('walks 0→67 clockwise (positive shoelace on a y-down grid)', () => {
    expect(TRACK_CELLS).toHaveLength(TRACK_SIZE);
    let area2 = 0;
    for (let i = 0; i < TRACK_CELLS.length; i++) {
      const a = TRACK_CELLS[i];
      const b = TRACK_CELLS[(i + 1) % TRACK_CELLS.length];
      area2 += a.col * b.row - b.col * a.row;
    }
    expect(area2).toBeGreaterThan(0);
    for (const cell of TRACK_CELLS) {
      expect(cell.row).toBeGreaterThanOrEqual(0);
      expect(cell.row).toBeLessThan(BOARD_SIZE);
      expect(cell.col).toBeGreaterThanOrEqual(0);
      expect(cell.col).toBeLessThan(BOARD_SIZE);
    }
  });
});

describe('every engine (colour, progress) maps to a cell', () => {
  it('defines a board cell for yard, each journey step, and home', () => {
    for (const color of COLORS) {
      const yard = cellForToken(color, { zone: 'yard' });
      expect(yard, `${color} yard`).toEqual(YARDS[color].tokenPositions[0]);
      for (let progress = 0; progress <= TOTAL_JOURNEY_STEPS; progress++) {
        const pos = tokenPosForProgress(color, progress);
        expect(pos, `${color} progress ${progress}`).toBeDefined();
        if (!pos) continue;
        const cell = cellForToken(color, pos);
        expect(cell, `${color} ${progress} ${JSON.stringify(pos)}`).toEqual(
          expect.objectContaining({ row: expect.any(Number), col: expect.any(Number) }),
        );
        expect(cell!.row).toBeGreaterThanOrEqual(0);
        expect(cell!.row).toBeLessThan(BOARD_SIZE);
        expect(cell!.col).toBeGreaterThanOrEqual(0);
        expect(cell!.col).toBeLessThan(BOARD_SIZE);
      }
    }
  });

  it('rejects a progress the engine cannot produce', () => {
    expect(tokenPosForProgress('red', -1)).toBeUndefined();
    expect(tokenPosForProgress('blue', TOTAL_JOURNEY_STEPS + 1)).toBeUndefined();
  });
});
