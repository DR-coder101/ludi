/**
 * Core types for the Ludi game rules engine
 * Source of truth: docs/GAME_RULES.md §11
 */

export type Color = "red" | "green" | "yellow" | "blue";

export type TokenPos =
  | { zone: "yard" }
  | { zone: "track"; cell: number }
  | { zone: "homeColumn"; step: number }
  | { zone: "home" };

export interface TokenState {
  color: Color;
  index: 0 | 1 | 2 | 3;
  pos: TokenPos;
}

export interface GameConfig {
  playerColors: Color[];
  houseRules: {
    maxConsecutiveSixes: 2 | 3 | "unlimited";
    extraRollOnCapture: boolean;
    blockadeCanMoveTogether: boolean;
    exactFinishBonus: boolean;
    playForPlacements: boolean;
  };
}

export interface GameState {
  config: GameConfig;
  tokens: TokenState[];
  turn: Color;
  phase: "awaiting_roll" | "awaiting_move" | "finished";
  dice: number | null;
  consecutiveSixes: number;
  winner: Color | null;
  placements: Color[];
}
