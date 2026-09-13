/**
 * Move application and game event generation for Ludi
 * Source: docs/GAME_RULES.md §4-§6, §9, §11
 */

import type { GameState, TokenPos, Color } from "./types";
import { legalMoves } from "./legalMoves";
import { computePath, isStartCell, isSafeCell } from "./topology";

export type GameEventType =
  | "moved"
  | "came_out"
  | "captured"
  | "blockade_formed"
  | "blockade_broken"
  | "entered_home_column"
  | "got_home"
  | "extra_turn"
  | "turn_passed"
  | "game_over";

export interface GameEvent {
  type: GameEventType;
  color: Color;
  tokenIndex?: number;
  capturedColor?: Color;
  capturedTokenIndex?: number;
  placement?: number;
}

export interface ApplyMoveResult {
  state: GameState;
  events: GameEvent[];
}

/**
 * Apply a move for the specified token.
 * The tokenIndex must be a legal move from legalMoves(state).
 * 
 * This function:
 * - Moves the token to its destination
 * - Handles captures (§5) including start-cell-safe exception (§10 case 8)
 * - Emits blockade form/break events (§6)
 * - Handles win detection & placements (§9)
 * - Manages consecutive-six logic and turn passing (§4)
 * - Respects house rules toggles
 */
export function applyMove(state: GameState, tokenIndex: number): ApplyMoveResult {
  const events: GameEvent[] = [];
  
  // Validate that we're in the right phase
  if (state.phase !== "awaiting_move" || state.dice === null) {
    throw new Error("Cannot apply move: not in awaiting_move phase or dice is null");
  }

  const token = state.tokens[tokenIndex];
  if (!token) {
    throw new Error(`Invalid token index: ${tokenIndex}`);
  }

  if (token.color !== state.turn) {
    throw new Error(`Cannot move token: it's ${state.turn}'s turn, but token is ${token.color}`);
  }

  // Find the move in legal moves
  const legal = legalMoves(state);
  const move = legal.find((m) => m.tokenIndex === tokenIndex);
  
  if (!move) {
    throw new Error(`Move is not legal for token ${tokenIndex}`);
  }

  // Clone state for immutability
  let newState: GameState = {
    ...state,
    tokens: state.tokens.map((t, i) => (i === tokenIndex ? { ...t } : t)),
  };

  const oldPos = token.pos;
  const newPos = move.resulting;

  // Check for blockade break before moving
  const wasInBlockade = oldPos.zone !== "yard" && oldPos.zone !== "home" && 
    getTokensAt(oldPos, newState).filter(t => t.color === token.color).length >= 2;

  // Handle capture BEFORE moving token
  if (move.captures) {
    const capturedTokenGlobalIndex = newState.tokens.findIndex(
      (t) => t.color === move.captures!.color && t.index === move.captures!.index
    );

    if (capturedTokenGlobalIndex !== -1) {
      // Exception: coming out onto opponent on your start cell → NO capture (§10 case 8)
      const isComingOut = oldPos.zone === "yard";
      const isLandingOnOwnStart = newPos.zone === "track" && isStartCell(newPos.cell, token.color);
      
      if (!(isComingOut && isLandingOnOwnStart)) {
        // Apply capture: send opponent token to yard
        newState.tokens[capturedTokenGlobalIndex] = {
          ...newState.tokens[capturedTokenGlobalIndex],
          pos: { zone: "yard" },
        };

        events.push({
          type: "captured",
          color: token.color,
          tokenIndex: token.index,
          capturedColor: move.captures.color,
          capturedTokenIndex: move.captures.index,
        });
      }
    }
  }

  // Move the token
  newState.tokens[tokenIndex] = {
    ...newState.tokens[tokenIndex],
    pos: newPos,
  };

  // Emit appropriate movement event
  if (oldPos.zone === "yard" && newPos.zone === "track") {
    events.push({
      type: "came_out",
      color: token.color,
      tokenIndex: token.index,
    });
  } else if (newPos.zone === "homeColumn" && oldPos.zone === "track") {
    events.push({
      type: "entered_home_column",
      color: token.color,
      tokenIndex: token.index,
    });
  } else if (newPos.zone === "home") {
    events.push({
      type: "got_home",
      color: token.color,
      tokenIndex: token.index,
    });
  } else {
    events.push({
      type: "moved",
      color: token.color,
      tokenIndex: token.index,
    });
  }

  // Check for blockade break (after move)
  if (wasInBlockade) {
    const stillInBlockade = getTokensAt(oldPos, newState).filter(t => t.color === token.color).length >= 2;
    if (!stillInBlockade) {
      events.push({
        type: "blockade_broken",
        color: token.color,
      });
    }
  }

  // Check for blockade formation (at new position)
  if (newPos.zone !== "yard" && newPos.zone !== "home") {
    const tokensAtNewPos = getTokensAt(newPos, newState).filter(t => t.color === token.color);
    if (tokensAtNewPos.length >= 2) {
      // Check if this is a NEW blockade (wasn't one before the move)
      const wasBlockadeBefore = tokensAtNewPos.length - 1 >= 2; // Subtract the token we just moved
      if (!wasBlockadeBefore) {
        events.push({
          type: "blockade_formed",
          color: token.color,
        });
      }
    }
  }

  // Check for win condition
  const colorTokens = newState.tokens.filter((t) => t.color === token.color);
  const allHome = colorTokens.every((t) => t.pos.zone === "home");

  if (allHome && !newState.placements.includes(token.color)) {
    newState.placements = [...newState.placements, token.color];

    // Check if game should end
    const shouldContinue = newState.config.houseRules.playForPlacements;
    const playersRemaining = newState.config.playerColors.filter(
      (c) => !newState.placements.includes(c)
    ).length;

    if (!shouldContinue || playersRemaining <= 1) {
      newState.winner = newState.placements[0];
      newState.phase = "finished";
      
      // Add remaining players to placements if playing for placements
      if (shouldContinue) {
        for (const color of newState.config.playerColors) {
          if (!newState.placements.includes(color)) {
            newState.placements = [...newState.placements, color];
          }
        }
      }

      events.push({
        type: "game_over",
        color: token.color,
        placement: newState.placements.indexOf(token.color) + 1,
      });

      return { state: newState, events };
    }
  }

  // Determine if extra turn is granted
  let grantsExtraRoll = false;

  // 1. Rolling a 6 grants extra roll (unless forfeited)
  if (state.dice === 6) {
    grantsExtraRoll = true;
  }

  // 2. Capture grants extra roll if house rule enabled
  if (move.captures && newState.config.houseRules.extraRollOnCapture) {
    const isComingOut = oldPos.zone === "yard";
    const isLandingOnOwnStart = newPos.zone === "track" && isStartCell(newPos.cell, token.color);
    
    // Only if capture actually happened
    if (!(isComingOut && isLandingOnOwnStart)) {
      grantsExtraRoll = true;
    }
  }

  // 3. Getting a token home with exactFinishBonus house rule
  if (newPos.zone === "home" && newState.config.houseRules.exactFinishBonus) {
    grantsExtraRoll = true;
  }

  if (grantsExtraRoll) {
    // Grant extra turn
    events.push({
      type: "extra_turn",
      color: token.color,
    });

    newState.phase = "awaiting_roll";
    newState.dice = null;
    
    // Update consecutive sixes counter
    if (state.dice === 6) {
      newState.consecutiveSixes = state.consecutiveSixes + 1;
    } else {
      newState.consecutiveSixes = 0;
    }
  } else {
    // Pass turn to next player
    const currentIndex = newState.config.playerColors.indexOf(newState.turn);
    const nextIndex = (currentIndex + 1) % newState.config.playerColors.length;
    
    // Skip players who have finished (if playing for placements)
    let nextColor = newState.config.playerColors[nextIndex];
    let attempts = 0;
    while (newState.placements.includes(nextColor) && attempts < newState.config.playerColors.length) {
      const nextNextIndex = (newState.config.playerColors.indexOf(nextColor) + 1) % newState.config.playerColors.length;
      nextColor = newState.config.playerColors[nextNextIndex];
      attempts++;
    }

    newState.turn = nextColor;
    newState.phase = "awaiting_roll";
    newState.dice = null;
    newState.consecutiveSixes = 0;

    events.push({
      type: "turn_passed",
      color: nextColor,
    });
  }

  return { state: newState, events };
}

/**
 * Get all tokens at a specific position.
 */
function getTokensAt(pos: TokenPos, state: GameState) {
  return state.tokens.filter((t) => positionsEqual(t.pos, pos));
}

/**
 * Check if two positions are equal.
 */
function positionsEqual(a: TokenPos, b: TokenPos): boolean {
  if (a.zone !== b.zone) return false;

  if (a.zone === "track" && b.zone === "track") {
    return a.cell === b.cell;
  }

  if (a.zone === "homeColumn" && b.zone === "homeColumn") {
    return a.step === b.step;
  }

  return true;
}
