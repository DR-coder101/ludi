import { describe, expect, it } from 'vitest';
import { legalMoves } from '@ludi/rules';
import { buildBoardModel, cellOf, hopCells } from './boardModel';
import { boardFixture } from '../../dev/boardFixtures';

const rc = (c: { row: number; col: number } | null) => (c ? [c.row, c.col] : null);

describe('cellOf', () => {
  it('puts start cells on the mockup start stars', () => {
    expect(rc(cellOf({ zone: 'track', cell: 0 }, 'red'))).toEqual([17, 10]);
    expect(rc(cellOf({ zone: 'track', cell: 17 }, 'green'))).toEqual([8, 17]);
    expect(rc(cellOf({ zone: 'track', cell: 34 }, 'yellow'))).toEqual([1, 8]);
    expect(rc(cellOf({ zone: 'track', cell: 51 }, 'blue'))).toEqual([10, 1]);
  });

  it('walks home columns toward the centre', () => {
    expect(rc(cellOf({ zone: 'homeColumn', step: 1 }, 'red'))).toEqual([17, 9]);
    expect(rc(cellOf({ zone: 'homeColumn', step: 7 }, 'yellow'))).toEqual([7, 9]);
    expect(cellOf({ zone: 'yard' }, 'blue')).toBeNull();
  });
});

describe('hopCells', () => {
  it('hops one cell per pip and ends on the destination', () => {
    const cells = hopCells({ zone: 'track', cell: 1 }, { zone: 'track', cell: 7 }, 'red').map(rc);
    expect(cells).toEqual([[15, 10], [14, 10], [13, 10], [12, 10], [11, 10], [10, 11]]);
  });

  it('turns into the home column after the entry arrow', () => {
    const cells = hopCells({ zone: 'track', cell: 64 }, { zone: 'homeColumn', step: 2 }, 'red').map(rc);
    expect(cells).toEqual([[18, 8], [18, 9], [17, 9], [16, 9]]);
  });

  it('pops straight onto the start star from the yard', () => {
    expect(hopCells({ zone: 'yard' }, { zone: 'track', cell: 34 }, 'yellow').map(rc)).toEqual([[1, 8]]);
  });
});

describe('buildBoardModel on the mockup fixtures', () => {
  it('start: every seated yard holds 4 pieces and Kingston has the turn', () => {
    const model = buildBoardModel(boardFixture('start'), []);
    expect(model.pieces).toHaveLength(0);
    expect(model.highlight).toBeNull();
    for (const yard of Object.values(model.yards)) expect(yard.tokens).toHaveLength(4);
    expect(model.yards.red.active).toBe(true);
    expect(model.yards.green.active).toBe(false);
  });

  it('mid: reproduces board-midgame.png pieces, stack, yard counts and the +6 route', () => {
    const state = boardFixture('mid');
    const model = buildBoardModel(state, legalMoves(state));

    const placed = model.pieces.map((p) => [p.piece, p.row, p.col, p.count]).sort();
    expect(placed).toEqual(
      [
        ['red', 16, 10, 1],
        ['red', 13, 9, 1],
        ['green', 8, 14, 1],
        ['green', 15, 8, 1],
        ['gold', 4, 8, 1],
        ['gold', 10, 4, 1],
        ['black', 8, 5, 2],
        ['black', 3, 10, 1],
      ].sort(),
    );

    expect(model.yards.red.tokens).toHaveLength(2);
    expect(model.yards.green.tokens).toHaveLength(2);
    expect(model.yards.yellow.tokens).toHaveLength(2);
    expect(model.yards.blue.tokens).toHaveLength(1);
    expect(model.yards.red.legal).toHaveLength(2);

    expect(model.highlight).not.toBeNull();
    const h = model.highlight!;
    expect(rc(h.from)).toEqual([16, 10]);
    expect(h.path.map(rc)).toEqual([[15, 10], [14, 10], [13, 10], [12, 10], [11, 10]]);
    expect(rc(h.to)).toEqual([10, 11]);
    expect(h.steps).toBe(6);

    const legalOnBoard = model.pieces.filter((p) => p.legal).map((p) => [p.row, p.col]);
    expect(legalOnBoard).toEqual([[16, 10]]);
  });

  it('nudges different colours that share a cell apart', () => {
    const state = boardFixture('start');
    state.tokens[0].pos = { zone: 'track', cell: 17 };
    state.tokens[4].pos = { zone: 'track', cell: 17 };
    const model = buildBoardModel(state, []);
    const dx = model.pieces.map((p) => p.dx).sort();
    expect(dx).toEqual([-0.18, 0.18]);
  });

  it('leaves hidden (animating) tokens out', () => {
    const state = boardFixture('mid');
    const model = buildBoardModel(state, [], { hidden: [0] });
    expect(model.pieces.find((p) => p.row === 16 && p.col === 10)).toBeUndefined();
  });
});
