import { describe, expect, it } from 'vitest';
import type { Color, TokenState } from '@ludi/rules';
import { HOME_COLUMNS, TRACK_CELLS, YARDS } from './boardLayout';
import {
  HOME_STRIPS,
  cellKind,
  layoutPieces,
  planBoardMotions,
  planHighlights,
  planMotion,
  startCell,
} from './boardModel';
import { places } from '../../theme/tokens';

const COLORS: Color[] = ['red', 'green', 'yellow', 'blue'];

function tokensAt(entries: [Color, TokenState['pos']][]): TokenState[] {
  const counts: Partial<Record<Color, number>> = {};
  return entries.map(([color, pos]) => {
    const index = (counts[color] ?? 0) as 0 | 1 | 2 | 3;
    counts[color] = index + 1;
    return { color, index, pos };
  });
}

describe('board geometry stays on main', () => {
  it('keeps every engine track cell where main puts it', () => {
    const main =
      '11,10 10,10 10,11 10,12 10,13 10,14 10,15 10,16 10,17 10,18 9,18 8,18 7,18 8,18 7,18 6,18 5,18 4,18 3,18 2,18 1,18 0,18 ' +
      '0,17 0,16 0,15 0,14 7,8 8,8 8,7 8,6 8,5 8,4 8,3 8,2 8,1 8,0 9,0 10,0 11,0 10,7 11,7 12,7 13,7 14,7 15,7 16,7 17,7 18,7 ' +
      '18,8 18,9 18,10 17,10';
    expect(TRACK_CELLS.map((c) => `${c.row},${c.col}`).join(' ')).toBe(main);
  });

  it('keeps the come-outs at Red (11,10), Green (8,18), Yellow (7,8), Blue (10,7)', () => {
    expect(startCell('red')).toEqual({ row: 11, col: 10 });
    expect(startCell('green')).toEqual({ row: 8, col: 18 });
    expect(startCell('yellow')).toEqual({ row: 7, col: 8 });
    expect(startCell('blue')).toEqual({ row: 10, col: 7 });
  });

  it('draws 8×8 yards, a 3×3 centre, 7-cell home strips and striped arms', () => {
    const counts: Record<string, number> = {};
    for (let r = 0; r < 19; r++) for (let c = 0; c < 19; c++) counts[cellKind(r, c)] = (counts[cellKind(r, c)] ?? 0) + 1;
    expect(counts).toEqual({ yard: 256, centre: 9, home: 28, track: 68 });
  });
});

describe('places', () => {
  const cornerOf = (color: Color) => {
    const { row, col } = YARDS[color].topLeft;
    return `${row === 0 ? 'T' : 'B'}${col === 0 ? 'L' : 'R'}`;
  };

  it('puts each place in the corner of its engine colour', () => {
    expect(places.yellow.full).toBe('Montego Bay');
    expect(places.green.full).toBe('Ocho Rios');
    expect(places.blue.full).toBe('Negril');
    expect(places.red.full).toBe('Kingston');
    for (const color of COLORS) expect(places[color].corner).toBe(cornerOf(color));
  });

  it('keeps each come-out beside its own yard', () => {
    for (const color of COLORS) {
      const s = startCell(color);
      const { row, col } = YARDS[color].topLeft;
      const dr = s.row < row ? row - s.row : Math.max(0, s.row - (row + 7));
      const dc = s.col < col ? col - s.col : Math.max(0, s.col - (col + 7));
      expect(Math.max(dr, dc)).toBe(1);
    }
  });

  it('enters each home column from its arm end with the arrow pointing at the centre', () => {
    expect(HOME_STRIPS.yellow).toMatchObject({ entry: { row: 0, col: 9 }, direction: 'down' });
    expect(HOME_STRIPS.green).toMatchObject({ entry: { row: 9, col: 18 }, direction: 'left' });
    expect(HOME_STRIPS.red).toMatchObject({ entry: { row: 18, col: 9 }, direction: 'up' });
    expect(HOME_STRIPS.blue).toMatchObject({ entry: { row: 9, col: 0 }, direction: 'right' });
  });
});

describe('layoutPieces', () => {
  it('draws a track piece at the centre of the boardLayout cell for every engine index', () => {
    for (let cell = 0; cell < 52; cell++) {
      const [piece] = layoutPieces(tokensAt([['red', { zone: 'track', cell }]]));
      expect({ x: piece.x, y: piece.y }).toEqual({ x: TRACK_CELLS[cell].col * 20 + 10, y: TRACK_CELLS[cell].row * 20 + 9 });
    }
  });

  it('draws home-column pieces on the boardLayout home column cells', () => {
    for (const color of COLORS) {
      for (let step = 1; step <= 6; step++) {
        const [piece] = layoutPieces(tokensAt([[color, { zone: 'homeColumn', step }]]));
        const cell = HOME_COLUMNS[color].cells[step - 1];
        expect({ x: piece.x, y: piece.y }).toEqual({ x: cell.col * 20 + 10, y: cell.row * 20 + 9 });
      }
    }
  });

  it('packs yard pieces into the slots left to right', () => {
    const pieces = layoutPieces(
      tokensAt([
        ['red', { zone: 'track', cell: 4 }],
        ['red', { zone: 'yard' }],
        ['red', { zone: 'home' }],
        ['red', { zone: 'yard' }],
      ]),
    );
    expect(pieces[1].x).toBeLessThan(pieces[3].x);
    expect(pieces[3].x - pieces[1].x).toBe(34);
    expect(pieces[1].y).toBe(pieces[3].y);
  });

  it('stacks same-colour pieces with one badge-carrying top piece', () => {
    const pieces = layoutPieces(
      tokensAt([
        ['blue', { zone: 'track', cell: 31 }],
        ['blue', { zone: 'track', cell: 31 }],
      ]),
    );
    expect(pieces.map((p) => p.stackCount)).toEqual([2, 2]);
    expect(pieces.map((p) => p.stackTop)).toEqual([false, true]);
    expect(pieces[0].stack).toEqual([0, 1]);
    expect(pieces[0].x).toBe(pieces[1].x);
  });

  it('offsets different colours sharing a safe cell instead of stacking them', () => {
    const pieces = layoutPieces(
      tokensAt([
        ['red', { zone: 'track', cell: 13 }],
        ['green', { zone: 'track', cell: 13 }],
      ]),
    );
    expect(pieces.map((p) => p.stackCount)).toEqual([1, 1]);
    expect(pieces[0].x).not.toBe(pieces[1].x);
  });
});

describe('motion', () => {
  it('hops cell by cell into the home column using the engine path', () => {
    const plan = planMotion({ zone: 'track', cell: 50 }, { zone: 'homeColumn', step: 2 }, 'red');
    expect(plan).toEqual({
      kind: 'hop',
      steps: [
        { zone: 'track', cell: 51 },
        { zone: 'homeColumn', step: 1 },
        { zone: 'homeColumn', step: 2 },
      ],
    });
  });

  it('classifies come-outs, captures and finishing', () => {
    expect(planMotion({ zone: 'yard' }, { zone: 'track', cell: 0 }, 'red').kind).toBe('enter');
    expect(planMotion({ zone: 'track', cell: 9 }, { zone: 'yard' }, 'green').kind).toBe('capture');
    expect(planMotion({ zone: 'homeColumn', step: 5 }, { zone: 'home' }, 'blue').kind).toBe('hop');
    expect(planMotion({ zone: 'track', cell: 3 }, { zone: 'track', cell: 3 }, 'red').kind).toBe('none');
  });

  it('holds a captured piece until the capturing piece lands', () => {
    const before = tokensAt([
      ['red', { zone: 'track', cell: 2 }],
      ['green', { zone: 'track', cell: 5 }],
    ]);
    const after = tokensAt([
      ['red', { zone: 'track', cell: 5 }],
      ['green', { zone: 'yard' }],
    ]);
    const motions = planBoardMotions(before, layoutPieces(before), after, layoutPieces(after), 110);
    expect(motions[0]).toMatchObject({ kind: 'hop', delayMs: 0 });
    expect(motions[0]?.waypoints).toHaveLength(3);
    expect(motions[1]).toMatchObject({ kind: 'capture', delayMs: 330 });
  });
});

describe('planHighlights', () => {
  it('traces the dots between origin and destination for a track move', () => {
    const tokens = tokensAt([
      ['red', { zone: 'yard' }],
      ['red', { zone: 'track', cell: 2 }],
    ]);
    const layouts = layoutPieces(tokens);
    const [yard, run] = planHighlights(
      tokens,
      [
        { tokenIndex: 0, resulting: { zone: 'track', cell: 0 } },
        { tokenIndex: 1, resulting: { zone: 'track', cell: 8 } },
      ],
      6,
      layouts,
    );
    expect(yard).toMatchObject({ fromYard: true, path: [] });
    expect(run.path).toHaveLength(5);
    expect(run.to).toMatchObject({ x: TRACK_CELLS[8].col * 20 + 10, y: TRACK_CELLS[8].row * 20 + 9 });
    expect(run.steps).toBe(6);
  });
});
