/**
 * Dice rolling logic for Ludi
 * Source: docs/GAME_RULES.md §4, §11
 */

import type { GameState } from "./types";
import { legalMoves } from "./legalMoves";

export interface RollDiceResult {
  state: GameState;
  value: number;
}

export type RngFunction = () => number;

/**
 * Roll the dice for the current player.
 * 
 * RNG function should return a value in [0, 1) - will be converted to 1-6.
 * 
 * Handles:
 * - §4: Third consecutive 6 forfeit rule (when maxConsecutiveSixes is 2)
 * - Auto-pass when no legal moves exist after roll
 */
export function rollDice(state: GameState, rng: RngFunction): RollDiceResult {
  if (state.phase !== "awaiting_roll") {
    throw new Error("Cannot roll dice: not in awaiting_roll phase");
  }

  // Roll the dice (1-6)
  const value = Math.floor(rng() * 6) + 1;

  // Check for consecutive sixes forfeit (§4, §10 case 2)
  const maxConsecutiveSixes = state.config.houseRules.maxConsecutiveSixes;
  
  if (value === 6 && maxConsecutiveSixes !== "unlimited") {
    const wouldBeConsecutive = state.consecutiveSixes + 1;
    
    if (wouldBeConsecutive > maxConsecutiveSixes) {
      // Forfeit: no move, turn passes
      const currentIndex = state.config.playerColors.indexOf(state.turn);
      const nextIndex = (currentIndex + 1) % state.config.playerColors.length;
      
      // Skip players who have finished
      let nextColor = state.config.playerColors[nextIndex];
      let attempts = 0;
      while (state.placements.includes(nextColor) && attempts < state.config.playerColors.length) {
        const nextNextIndex = (state.config.playerColors.indexOf(nextColor) + 1) % state.config.playerColors.length;
        nextColor = state.config.playerColors[nextNextIndex];
        attempts++;
      }

      return {
        state: {
          ...state,
          turn: nextColor,
          phase: "awaiting_roll",
          dice: null,
          consecutiveSixes: 0,
        },
        value, // Return the value that caused forfeit
      };
    }
  }

  // Normal roll: set dice value and move to awaiting_move phase
  let newState: GameState = {
    ...state,
    dice: value,
    phase: "awaiting_move",
  };

  // Check if any legal moves exist
  const moves = legalMoves(newState);
  
  if (moves.length === 0) {
    // No legal moves: auto-pass (§10 case 10)
    const currentIndex = newState.config.playerColors.indexOf(newState.turn);
    const nextIndex = (currentIndex + 1) % newState.config.playerColors.length;
    
    // Skip players who have finished
    let nextColor = newState.config.playerColors[nextIndex];
    let attempts = 0;
    while (newState.placements.includes(nextColor) && attempts < newState.config.playerColors.length) {
      const nextNextIndex = (newState.config.playerColors.indexOf(nextColor) + 1) % newState.config.playerColors.length;
      nextColor = newState.config.playerColors[nextNextIndex];
      attempts++;
    }

    newState = {
      ...newState,
      turn: nextColor,
      phase: "awaiting_roll",
      dice: null,
      consecutiveSixes: 0,
    };
  }

  return { state: newState, value };
}
