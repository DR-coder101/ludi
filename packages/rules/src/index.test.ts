import { describe, it, expect } from 'vitest';
import { createGame, legalMoves } from './index';
import type { GameConfig } from './types';

describe('rules package exports', () => {
  it('should export createGame', () => {
    expect(createGame).toBeDefined();
  });

  it('should export legalMoves', () => {
    expect(legalMoves).toBeDefined();
  });

  it('should create a valid initial game state', () => {
    const config: GameConfig = {
      playerColors: ['red', 'green'],
      houseRules: {
        maxConsecutiveSixes: 2,
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
