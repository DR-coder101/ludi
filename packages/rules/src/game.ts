/**
 * Game creation and initialization
 * Source: docs/GAME_RULES.md §1, §2, §11
 */

import type { GameConfig, GameState, TokenState, Color } from "./types";

/**
 * Create a new game with the given configuration.
 * All tokens start in their respective yards.
 * Turn order is clockwise: Red → Green → Yellow → Blue.
 * First player is the first color in playerColors array.
 */
export function createGame(config: GameConfig): GameState {
  if (config.playerColors.length < 2 || config.playerColors.length > 4) {
    throw new Error("Game requires 2-4 players");
  }

  // Validate colors are unique and valid
  const colorSet = new Set(config.playerColors);
  if (colorSet.size !== config.playerColors.length) {
    throw new Error("Player colors must be unique");
  }

  const validColors: Color[] = ["red", "green", "yellow", "blue"];
  for (const color of config.playerColors) {
    if (!validColors.includes(color)) {
      throw new Error(`Invalid color: ${color}`);
    }
  }

  // Create tokens: 4 per active color, all starting in yard
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
