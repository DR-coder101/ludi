import { describe, expect, it } from 'vitest';
import {
  computePath,
  HOME_COLUMN_ENTRY as ENGINE_HOME_COLUMN_ENTRY,
  HOME_COLUMN_LENGTH as ENGINE_HOME_COLUMN_LENGTH,
  START_CELLS as ENGINE_START_CELLS,
  TOTAL_JOURNEY_STEPS,
  TRACK_SIZE as ENGINE_TRACK_SIZE,
  type TokenPos,
} from '@ludi/rules';
import {
  BOARD_SIZE,
  HOME_COLUMN_ENTRY,
  HOME_COLUMN_LENGTH,
  HOME_COLUMNS,
  SAFE_CELLS,
  START_CELLS,
  TRACK_CELLS,
  TRACK_SIZE,
  type CellPosition,
  type Color,
} from './boardLayout';

// Independent port of the design pack's lib.js cellType(r, c).
type CellType = 'yard' | 'centre' | 'track' | 'home-gold' | 'home-red' | 'home-black' | 'home-green';
function libCellType(r: number, c: number): CellType {
  if ((r < 8 || r > 10) && (c < 8 || c > 10)) return 'yard';
  if (r >= 8 && r <= 10 && c >= 8 && c <= 10) return 'centre';
  if (c === 9 && r >= 1 && r <= 7) return 'home-gold';
  if (c === 9 && r >= 11 && r <= 17) return 'home-red';
  if (r === 9 && c >= 1 && c <= 7) return 'home-black';
  if (r === 9 && c >= 11 && c <= 17) return 'home-green';
  return 'track';
}

const COLORS: Color[] = ['red', 'green', 'yellow', 'blue'];
const HOME_TYPE: Record<Color, CellType> = {
  red: 'home-red',
  green: 'home-green',
  yellow: 'home-gold',
  blue: 'home-black',
};

// lib.js STARTS / ENTRIES, keyed by engine colour (gold = yellow, black = blue).
const MOCKUP_STARTS: Record<Color, CellPosition> = {
  red: { row: 17, col: 10 },
  green: { row: 8, col: 17 },
  yellow: { row: 1, col: 8 },
  blue: { row: 10, col: 1 },
};
const MOCKUP_ENTRIES: Record<Color, { cell: CellPosition; dir: CellPosition }> = {
  red: { cell: { row: 18, col: 9 }, dir: { row: -1, col: 0 } },
  green: { cell: { row: 9, col: 18 }, dir: { row: 0, col: -1 } },
  yellow: { cell: { row: 0, col: 9 }, dir: { row: 1, col: 0 } },
  blue: { cell: { row: 9, col: 0 }, dir: { row: 0, col: 1 } },
};

const key = (p: CellPosition) => `${p.row},${p.col}`;
const manhattan = (a: CellPosition, b: CellPosition) =>
  Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
const isOrthogonal = (a: CellPosition, b: CellPosition) => manhattan(a, b) === 1;
const isDiagonal = (a: CellPosition, b: CellPosition) =>
  Math.abs(a.row - b.row) === 1 && Math.abs(a.col - b.col) === 1;

const CENTRE: CellPosition[] = [];
for (let r = 8; r <= 10; r++) for (let c = 8; c <= 10; c++) CENTRE.push({ row: r, col: c });

function cellFor(color: Color, pos: TokenPos): CellPosition | null {
  if (pos.zone === 'track') return TRACK_CELLS[pos.cell];
  if (pos.zone === 'homeColumn') return HOME_COLUMNS[color].cells[pos.step - 1];
  return null;
}

describe('boardLayout sizes match the engine', () => {
  it('re-exports engine constants', () => {
    expect(TRACK_SIZE).toBe(ENGINE_TRACK_SIZE);
    expect(TRACK_SIZE).toBe(68);
    expect(HOME_COLUMN_LENGTH).toBe(ENGINE_HOME_COLUMN_LENGTH);
    expect(HOME_COLUMN_LENGTH).toBe(7);
    expect(START_CELLS).toEqual(ENGINE_START_CELLS);
    expect(HOME_COLUMN_ENTRY).toEqual(ENGINE_HOME_COLUMN_ENTRY);
  });

  it('has one TRACK_CELLS entry per engine track index', () => {
    expect(TRACK_CELLS).toHaveLength(TRACK_SIZE);
  });

  it('has HOME_COLUMN_LENGTH cells in every home column', () => {
    for (const color of COLORS) {
      expect(HOME_COLUMNS[color].cells).toHaveLength(HOME_COLUMN_LENGTH);
    }
  });
});

describe('TRACK_CELLS', () => {
  it('maps every track index to a distinct cell', () => {
    const seen = new Map<string, number>();
    TRACK_CELLS.forEach((cell, i) => {
      const prev = seen.get(key(cell));
      expect(prev, `track ${i} shares (${key(cell)}) with track ${prev}`).toBeUndefined();
      seen.set(key(cell), i);
    });
    expect(seen.size).toBe(TRACK_SIZE);
  });

  it('keeps every cell on integer coordinates inside the 19×19 grid', () => {
    TRACK_CELLS.forEach((cell, i) => {
      expect(Number.isInteger(cell.row) && Number.isInteger(cell.col), `track ${i}`).toBe(true);
      expect(cell.row).toBeGreaterThanOrEqual(0);
      expect(cell.row).toBeLessThan(BOARD_SIZE);
      expect(cell.col).toBeGreaterThanOrEqual(0);
      expect(cell.col).toBeLessThan(BOARD_SIZE);
    });
  });

  it('only uses mockup track cells (never yard, centre or home strip)', () => {
    TRACK_CELLS.forEach((cell, i) => {
      expect(libCellType(cell.row, cell.col), `track ${i} at (${key(cell)})`).toBe('track');
    });
  });

  it('covers every mockup track cell exactly once', () => {
    const mockupTrack = new Set<string>();
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (libCellType(r, c) === 'track') mockupTrack.add(`${r},${c}`);
      }
    }
    expect(new Set(TRACK_CELLS.map(key))).toEqual(mockupTrack);
  });

  it('steps to an adjacent cell every time, including 67 → 0', () => {
    const diagonalFrom: number[] = [];
    for (let i = 0; i < TRACK_SIZE; i++) {
      const a = TRACK_CELLS[i];
      const b = TRACK_CELLS[(i + 1) % TRACK_SIZE];
      if (isDiagonal(a, b)) {
        diagonalFrom.push(i);
      } else {
        expect(isOrthogonal(a, b), `step ${i} → ${(i + 1) % TRACK_SIZE}: (${key(a)}) → (${key(b)})`).toBe(true);
      }
    }
    // The four inner corners around the centre, where the arms only touch diagonally.
    expect(diagonalFrom).toEqual([6, 23, 40, 57]);
    for (const i of diagonalFrom) {
      for (const cell of [TRACK_CELLS[i], TRACK_CELLS[i + 1]]) {
        expect(CENTRE.some((c) => isOrthogonal(c, cell)), `corner (${key(cell)})`).toBe(true);
      }
    }
  });

  it('puts the starts on the mockup start stars, 17 apart', () => {
    for (const color of COLORS) {
      expect(TRACK_CELLS[START_CELLS[color]], color).toEqual(MOCKUP_STARTS[color]);
    }
    expect(START_CELLS).toEqual({ red: 0, green: 17, yellow: 34, blue: 51 });
  });

  it('marks only the four start stars as safe', () => {
    expect(SAFE_CELLS).toEqual([0, 17, 34, 51]);
  });

  it('puts each home entry on the mockup arrow cell, two before the start', () => {
    for (const color of COLORS) {
      expect(TRACK_CELLS[HOME_COLUMN_ENTRY[color]], color).toEqual(MOCKUP_ENTRIES[color].cell);
      expect((START_CELLS[color] - HOME_COLUMN_ENTRY[color] + TRACK_SIZE) % TRACK_SIZE).toBe(2);
    }
  });
});

describe('HOME_COLUMNS', () => {
  it('uses only the matching mockup home strip', () => {
    for (const color of COLORS) {
      HOME_COLUMNS[color].cells.forEach((cell, k) => {
        expect(libCellType(cell.row, cell.col), `${color} H${k}`).toBe(HOME_TYPE[color]);
      });
    }
  });

  it('never overlaps the track or another home column', () => {
    const used = new Set(TRACK_CELLS.map(key));
    for (const color of COLORS) {
      for (const cell of HOME_COLUMNS[color].cells) {
        expect(used.has(key(cell)), `${color} (${key(cell)})`).toBe(false);
        used.add(key(cell));
      }
    }
    expect(used.size).toBe(TRACK_SIZE + 4 * HOME_COLUMN_LENGTH);
  });

  it('runs in a straight line from the entry arrow to the centre', () => {
    for (const color of COLORS) {
      const { cell: entry, dir } = MOCKUP_ENTRIES[color];
      const cells = HOME_COLUMNS[color].cells;
      cells.forEach((cell, k) => {
        expect(cell, `${color} H${k}`).toEqual({
          row: entry.row + dir.row * (k + 1),
          col: entry.col + dir.col * (k + 1),
        });
      });
      const last = cells[cells.length - 1];
      expect(CENTRE.some((c) => isOrthogonal(c, last)), `${color} last cell touches centre`).toBe(true);
    }
  });

  it('starts one arrow-step past the entry cell', () => {
    for (const color of COLORS) {
      const entry = TRACK_CELLS[HOME_COLUMN_ENTRY[color]];
      const { dir } = MOCKUP_ENTRIES[color];
      expect(HOME_COLUMNS[color].cells[0], color).toEqual({
        row: entry.row + dir.row,
        col: entry.col + dir.col,
      });
    }
  });

  it('is entered by the engine only from its own entry cell', () => {
    for (const color of COLORS) {
      const entriesFrom: number[] = [];
      for (let cell = 0; cell < TRACK_SIZE; cell++) {
        const next = computePath({ zone: 'track', cell }, 1, color);
        if (next?.zone === 'homeColumn') {
          entriesFrom.push(cell);
          expect(next.step).toBe(1);
        }
      }
      expect(entriesFrom, color).toEqual([HOME_COLUMN_ENTRY[color]]);
    }
  });

  it('is never entered by another colour', () => {
    for (const color of COLORS) {
      const entry = HOME_COLUMN_ENTRY[color];
      for (const other of COLORS.filter((c) => c !== color)) {
        const next = computePath({ zone: 'track', cell: entry }, 1, other);
        expect(next?.zone, `${other} passing ${color}'s entry`).toBe('track');
      }
    }
  });
});

describe('engine paths render as adjacent board steps', () => {
  it.each(COLORS)('%s walks yard → home one pip at a time on adjacent cells', (color) => {
    let pos: TokenPos = { zone: 'yard' };
    let prevCell: CellPosition | null = null;
    let prevPos: TokenPos = pos;
    let steps = 0;
    let homeColumnEntries = 0;

    while (pos.zone !== 'home') {
      const next = computePath(pos, 1, color);
      expect(next, `${color} stuck at ${JSON.stringify(pos)}`).not.toBeNull();
      prevPos = pos;
      pos = next as TokenPos;
      steps++;

      const cell = cellFor(color, pos);
      if (prevPos.zone === 'yard') {
        expect(cell).toEqual(MOCKUP_STARTS[color]);
      } else if (cell && prevCell) {
        const ok = isOrthogonal(prevCell, cell) || isDiagonal(prevCell, cell);
        expect(ok, `${color} ${JSON.stringify(prevPos)} → ${JSON.stringify(pos)}`).toBe(true);
      }

      if (prevPos.zone === 'track' && pos.zone === 'homeColumn') {
        homeColumnEntries++;
        expect(prevPos.cell).toBe(HOME_COLUMN_ENTRY[color]);
        expect(pos.step).toBe(1);
        expect(cell).toEqual(HOME_COLUMNS[color].cells[0]);
      }
      if (pos.zone === 'home') {
        expect(prevPos).toEqual({ zone: 'homeColumn', step: HOME_COLUMN_LENGTH });
        expect(CENTRE.some((c) => prevCell && isOrthogonal(c, prevCell))).toBe(true);
      }
      prevCell = cell;
    }

    expect(homeColumnEntries).toBe(1);
    // One pip out of the yard, then the full start → centre journey.
    expect(steps).toBe(1 + TOTAL_JOURNEY_STEPS);
  });
});
