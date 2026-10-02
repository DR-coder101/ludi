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

/** One of the two dice in the current throw (§2). */
export interface Die {
  value: number;
  used: boolean;
}

export type Dice = [Die, Die];

export interface GameState {
  config: GameConfig;
  tokens: TokenState[];
  turn: Color;
  phase: "awaiting_roll" | "awaiting_move" | "finished";
  /** The current throw; null while awaiting a roll. */
  dice: Dice | null;
  /** Whether this throw has earned a bonus roll, taken once both dice are done (§4). */
  extraRollEarned: boolean;
  /** Consecutive throws this turn showing at least one 6 (§4). */
  consecutiveSixes: number;
  winner: Color | null;
  placements: Color[];
}
