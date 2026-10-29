import { describe, expect, it } from 'vitest';
import { applyMove, createGame, legalMoves } from '@ludi/rules';
import { buildBoardModel, captureReturn, cellOf, hopCells } from './boardModel';
import { boardFixture } from '../../dev/boardFixtures';

const rc = (c: { row: number; col: number } | null) => (c ? [c.row, c.col] : null);

describe('cellOf', () => {
  it('puts start cells on the mockup start stars', () => {
    expect(rc(cellOf({ zone: 'track', cell: 0 }, 'red'))).toEqual([10, 17]);
    expect(rc(cellOf({ zone: 'track', cell: 17 }, 'green'))).toEqual([17, 8]);
    expect(rc(cellOf({ zone: 'track', cell: 34 }, 'yellow'))).toEqual([8, 1]);
    expect(rc(cellOf({ zone: 'track', cell: 51 }, 'blue'))).toEqual([1, 10]);
  });

  it('walks home columns toward the centre', () => {
    expect(rc(cellOf({ zone: 'homeColumn', step: 1 }, 'red'))).toEqual([9, 17]);
    expect(rc(cellOf({ zone: 'homeColumn', step: 7 }, 'yellow'))).toEqual([9, 7]);
    expect(cellOf({ zone: 'yard' }, 'blue')).toBeNull();
  });
});

describe('hopCells', () => {
  it('hops one cell per pip and ends on the destination', () => {
    const cells = hopCells({ zone: 'track', cell: 1 }, { zone: 'track', cell: 7 }, 'red').map(rc);
    expect(cells).toEqual([[10, 15], [10, 14], [10, 13], [10, 12], [10, 11], [11, 10]]);
  });

  it('turns into the home column after the entry arrow', () => {
    const cells = hopCells({ zone: 'track', cell: 64 }, { zone: 'homeColumn', step: 2 }, 'red').map(rc);
    expect(cells).toEqual([[8, 18], [9, 18], [9, 17], [9, 16]]);
  });

  it('pops straight onto the start star from the yard', () => {
    expect(hopCells({ zone: 'yard' }, { zone: 'track', cell: 34 }, 'yellow').map(rc)).toEqual([[8, 1]]);
  });
});

function captureSetup() {
  const game = createGame({
    playerColors: ['red', 'green'],
    houseRules: {
      maxConsecutiveSixes: 2,
      extraRollOnCapture: false,
      blockadeCanMoveTogether: false,
      exactFinishBonus: false,
      playForPlacements: false,
    },
  });
  game.tokens[0].pos = { zone: 'track', cell: 5 };
  game.tokens[4].pos = { zone: 'track', cell: 7 };
  const state = {
    ...game,
    phase: 'awaiting_move' as const,
    dice: [
      { value: 2, used: false },
      { value: 3, used: true },
    ],
  };
  const move = legalMoves(state).find((m) => m.tokenIndex === 0 && m.captures);
  return { state, move };
}

describe('capture return to yard', () => {
  it('keeps the captured piece in its home yard after the engine move', () => {
    const { state, move } = captureSetup();
    expect(move?.captures).toEqual({ color: 'green', index: 0 });
    const next = applyMove(state, move!.tokenIndex, move!.dieIndex).state;
    const model = buildBoardModel(next, []);
    expect(model.yards.green.tokens).toContain(4);
    expect(model.pieces.find((p) => p.tokenIndex === 4)).toBeUndefined();
    expect(model.pieces.find((p) => p.row === 11 && p.col === 10)?.tokenIndex).toBe(0);
  });

  it('maps the captured piece from the capture square to that yard slot', () => {
    const { state, move } = captureSetup();
    const next = applyMove(state, move!.tokenIndex, move!.dieIndex).state;
    const slot = buildBoardModel(next, []).yards.green.tokens.indexOf(4);
    expect(slot).toBe(0);
    expect(captureReturn(state, move!.captures!)).toEqual({
      tokenIndex: 4,
      color: 'green',
      from: { row: 11, col: 10 },
      slot: 0,
    });
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

  it('mid: reproduces board-midgame.png pieces, stack, yard counts and the +6 route for a 6 + 3', () => {
    const state = boardFixture('mid');
    const model = buildBoardModel(state, legalMoves(state));

    const placed = model.pieces.map((p) => [p.piece, p.row, p.col, p.count]).sort();
    expect(placed).toEqual(
      [
        ['red', 10, 16, 1],
        ['red', 9, 13, 1],
        ['black', 14, 8, 1],
        ['black', 8, 15, 1],
        ['gold', 8, 4, 1],
        ['gold', 4, 10, 1],
        ['green', 5, 8, 2],
        ['green', 10, 3, 1],
      ].sort(),
    );

    expect(model.yards.red.tokens).toHaveLength(2);
    expect(model.yards.green.tokens).toHaveLength(2);
    expect(model.yards.yellow.tokens).toHaveLength(2);
    expect(model.yards.blue.tokens).toHaveLength(1);
    expect(model.yards.red.legal).toHaveLength(2);

    expect(model.highlight).not.toBeNull();
    const h = model.highlight!;
    expect(rc(h.from)).toEqual([10, 16]);
    expect(h.path.map(rc)).toEqual([[10, 15], [10, 14], [10, 13], [10, 12], [10, 11]]);
    expect(rc(h.to)).toEqual([11, 10]);
    expect(h.steps).toBe(6);

    // The 3 also takes the home-column piece in, so both red pieces glow.
    const legalOnBoard = model.pieces.filter((p) => p.legal).map((p) => [p.row, p.col]).sort();
    expect(legalOnBoard).toEqual([[10, 16], [9, 13]]);
  });

  it('mid: previews the focused die', () => {
    const state = boardFixture('mid');
    const model = buildBoardModel(state, legalMoves(state), { focusDie: 1 });
    expect(rc(model.highlight!.from)).toEqual([10, 16]);
    expect(model.highlight!.steps).toBe(3);
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
    expect(model.pieces.find((p) => p.row === 10 && p.col === 16)).toBeUndefined();
  });
});
