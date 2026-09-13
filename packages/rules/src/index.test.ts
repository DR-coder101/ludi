import { describe, it, expect } from 'vitest';
import { createGame, legalMoves } from './index';

describe('rules package exports', () => {
  it('should export createGame', () => {
    expect(createGame).toBeDefined();
  });

  it('should export legalMoves', () => {
    expect(legalMoves).toBeDefined();
  });

  it('should create a valid initial game state', () => {
    const config = {
      playerColors: ['red', 'green'] as const,
      houseRules: {
        maxConsecutiveSixes: 2 as const,
        extraRollOnCapture: false,
        blockadeCanMoveTogether: false,
        exactFinishBonus: false,
        playForPlacements: false,
      },
    };

    const state = createGame(config);
    
    expect(state.tokens.length).toBe(8);
    expect(state.turn).toBe('red');
    expect(state.phase).toBe('awaiting_roll');
    expect(state.dice).toBeNull();
  });
});
