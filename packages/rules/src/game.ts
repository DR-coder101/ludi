/**
 * Core game state management
 * Source: GAME_RULES.md §11
 */

import type { GameConfig, GameState, TokenState, Color } from "./types";
import { START_CELLS } from "./topology";

/**
 * Create initial game state
 */
export function createGame(config: GameConfig): GameState {
  const tokens: TokenState[] = [];

  for (const color of config.playerColors) {
    for (let i = 0; i < 4; i++) {
      tokens.push({
        color,
        index: i as 0 | 1 | 2 | 3,
        pos: { zone: "yard" },
      });
    }
  }

  return {
    config,
    tokens,
    turn: config.playerColors[0],
    phase: "awaiting_roll",
    dice: null,
    consecutiveSixes: 0,
    winner: null,
    placements: [],
  };
}

/**
 * Get all tokens for a specific color
 */
export function getTokensForColor(
  state: GameState,
  color: Color
): TokenState[] {
  return state.tokens.filter((t) => t.color === color);
}

/**
 * Get a specific token by color and index
 */
export function getToken(
  state: GameState,
  color: Color,
  index: number
): TokenState | undefined {
  return state.tokens.find((t) => t.color === color && t.index === index);
}

/**
 * Get the global index of a token in the state.tokens array
 */
export function getTokenGlobalIndex(
  state: GameState,
  color: Color,
  index: number
): number {
  return state.tokens.findIndex((t) => t.color === color && t.index === index);
}
