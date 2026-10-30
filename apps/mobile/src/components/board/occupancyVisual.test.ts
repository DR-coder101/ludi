import { describe, expect, it } from 'vitest';
import { buildBoardModel } from './boardModel';
import { blockadeMarks, occupancyVisual } from './occupancyVisual';
import { boardFixture } from '../../dev/boardFixtures';

/** BoardArt cell pitch. Kept here so this file never imports the SVG module. */
const CELL = 20;

describe('occupancyVisual', () => {
  it('keeps a lone token as a single disc', () => {
    expect(occupancyVisual()).toEqual({ kind: 'single' });
    expect(occupancyVisual(1)).toEqual({ kind: 'single' });
  });

  it('marks two same-colour tokens as a blockade with an x2 badge and a diagonal pair', () => {
    expect(occupancyVisual(2)).toEqual({
      kind: 'blockade',
      count: 2,
      badge: 'x2',
      pair: [
        { dx: 0.5, dy: -0.5 },
        { dx: -0.5, dy: 0.5 },
      ],
      discScale: 0.84,
    });
  });

  it('keeps extras on the same cell as one blockade with the real count on the badge', () => {
    expect(occupancyVisual(3)).toMatchObject({ kind: 'blockade', count: 3, badge: 'x3' });
    expect(occupancyVisual(4)).toMatchObject({ kind: 'blockade', count: 4, badge: 'x4' });
  });
});

describe('blockadeMarks on the mid fixture', () => {
  const model = buildBoardModel(boardFixture('mid'), []);
  const singles = model.pieces.filter((piece) => piece.count === 1);
  const stacked = model.pieces.filter((piece) => piece.count > 1);

  it('puts a pink cell ring and x2 badge on the two green tokens at (5, 8)', () => {
    expect(stacked).toEqual([
      expect.objectContaining({ piece: 'green', row: 5, col: 8, count: 2 }),
    ]);
    expect(blockadeMarks(model.pieces, CELL)).toEqual([
      {
        key: '5,8,blue',
        badge: 'x2',
        ring: { x: 160.5, y: 100.5, size: 19, rx: 2.4, strokeWidth: 1.8 },
      },
    ]);
  });

  it('leaves every one-piece cell without a badge or ring', () => {
    expect(singles).toHaveLength(7);
    expect(blockadeMarks(singles, CELL)).toEqual([]);
    expect(singles.map((piece) => occupancyVisual(piece.count))).toEqual(
      singles.map(() => ({ kind: 'single' })),
    );
  });
});
