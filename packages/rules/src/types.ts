/**
 * Core type definitions for Ludi game rules
 * Source: GAME_RULES.md §11
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

export interface HouseRules {
  maxConsecutiveSixes: 2 | 3 | "unlimited";
  extraRollOnCapture: boolean;
  blockadeCanMoveTogether: boolean;
  exactFinishBonus: boolean;
  playForPlacements: boolean;
}

export interface GameConfig {
  playerColors: Color[];
  houseRules: HouseRules;
}

export type GamePhase = "awaiting_roll" | "awaiting_move" | "finished";

export interface GameState {
  config: GameConfig;
  tokens: TokenState[];
  turn: Color;
  phase: GamePhase;
  dice: number | null;
  consecutiveSixes: number;
  winner: Color | null;
  placements: Color[];
}

export interface TokenRef {
  color: Color;
  index: number;
}

export interface LegalMove {
  tokenIndex: number;
  resulting: TokenPos;
  captures?: TokenRef;
}

export type GameEvent =
  | { type: "moved"; tokenIndex: number; from: TokenPos; to: TokenPos }
  | { type: "came_out"; tokenIndex: number }
  | { type: "captured"; capturedToken: TokenRef; byToken: number }
  | { type: "blockade_formed"; at: TokenPos; color: Color }
  | { type: "blockade_broken"; at: TokenPos; color: Color }
  | { type: "entered_home_column"; tokenIndex: number }
  | { type: "got_home"; tokenIndex: number }
  | { type: "extra_turn"; reason: "rolled_six" | "captured" | "finished" }
  | { type: "turn_passed"; reason: "no_legal_moves" | "timeout" | "forfeit" }
  | { type: "game_over"; winner: Color; placements: Color[] };
