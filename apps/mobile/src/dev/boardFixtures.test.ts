import { describe, expect, it } from 'vitest';
import { TRACK_CELLS } from '../components/board/boardLayout';
import { cellKind, layoutPieces } from '../components/board/boardModel';
import { midFixture, startFixture } from './boardFixtures';

describe('dev board fixtures', () => {
  it('start: two players, every piece in its yard, awaiting the roll', () => {
    const { state } = startFixture();
    expect(state.config.playerColors).toEqual(['red', 'yellow']);
    expect(state.tokens).toHaveLength(8);
    expect(state.tokens.every((t) => t.pos.zone === 'yard')).toBe(true);
    expect(state.phase).toBe('awaiting_roll');
  });

  it('mid: four players with pieces on the track, a stack of 2 and a highlighted legal move', () => {
    const { state, legalMoves } = midFixture();
    expect(state.config.playerColors).toHaveLength(4);
    expect(state.tokens.filter((t) => t.pos.zone === 'track').length).toBeGreaterThanOrEqual(6);
    expect(layoutPieces(state.tokens).some((p) => p.stackCount === 2)).toBe(true);
    expect(legalMoves.map((m) => m.tokenIndex)).toEqual([0, 1, 2]);
    expect(legalMoves[2].resulting).toEqual({ zone: 'track', cell: 8 });
  });

  it('mid: track pieces sit on arm cells of the drawn board', () => {
    for (const t of midFixture().state.tokens) {
      if (t.pos.zone !== 'track') continue;
      const { row, col } = TRACK_CELLS[t.pos.cell];
      expect(cellKind(row, col)).toMatch(/track|home/);
    }
  });
});
