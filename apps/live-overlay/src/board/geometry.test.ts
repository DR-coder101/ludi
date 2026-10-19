import { HOME_COLUMNS, TRACK_CELLS, YARDS } from '@ludi/board-geometry';
import { describe, expect, it } from 'vitest';
import {
  ALONG,
  ARM_B,
  ENTRY,
  HOME_COL,
  START,
  TRACK,
  YARD_TL,
  gpos,
  posToPoint,
} from './geometry.js';

describe('wide-track geometry', () => {
  it('keeps 68 track squares and the four starts and lane entries', () => {
    expect(TRACK).toHaveLength(68);
    expect(START).toEqual({ red: 0, green: 17, yellow: 34, blue: 51 });
    expect(ENTRY).toEqual({ red: 66, green: 15, yellow: 32, blue: 49 });
  });

  it('uses the same track, home and yard tables as the mobile board', () => {
    expect(TRACK).toEqual(TRACK_CELLS.map((c) => [c.row, c.col]));
    expect(HOME_COL.red).toEqual(HOME_COLUMNS.red.cells.map((c) => [c.row, c.col]));
    expect(HOME_COL.green).toEqual(HOME_COLUMNS.green.cells.map((c) => [c.row, c.col]));
    expect(HOME_COL.yellow).toEqual(HOME_COLUMNS.yellow.cells.map((c) => [c.row, c.col]));
    expect(HOME_COL.blue).toEqual(HOME_COLUMNS.blue.cells.map((c) => [c.row, c.col]));
    expect(YARD_TL).toEqual({
      red: [YARDS.red.topLeft.row, YARDS.red.topLeft.col],
      green: [YARDS.green.topLeft.row, YARDS.green.topLeft.col],
      yellow: [YARDS.yellow.topLeft.row, YARDS.yellow.topLeft.col],
      blue: [YARDS.blue.topLeft.row, YARDS.blue.topLeft.col],
    });
  });

  it('makes the middle three bands wider than the along-arm cells', () => {
    expect(ARM_B).toBeGreaterThan(ALONG);
    expect(gpos(9) - gpos(8)).toBe(ARM_B);
    expect(gpos(1) - gpos(0)).toBe(ALONG);
  });

  it('moves a piece square by square along the track', () => {
    const a = posToPoint('red', { zone: 'track', cell: 0 }, 0);
    const b = posToPoint('red', { zone: 'track', cell: 1 }, 0);
    expect(a).not.toEqual(b);
    expect(a.y).toBe(b.y);
    expect(a.x).toBeGreaterThan(b.x);
  });

  it('places four yard slots in a row inside each yard', () => {
    const a = posToPoint('yellow', { zone: 'yard' }, 0);
    const b = posToPoint('yellow', { zone: 'yard' }, 3);
    expect(b.x).toBeGreaterThan(a.x);
    expect(b.y).toBe(a.y);
  });
});
