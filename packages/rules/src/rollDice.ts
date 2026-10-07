/**
 * Dice rolling logic for Ludi
 * Source: docs/GAME_RULES.md §2, §4, §8, §11
 */

import type { GameState } from "./types.js";
import type { GameEvent } from "./applyMove.js";
import { legalMoves } from "./legalMoves.js";
import { endThrow, passTurn } from "./turn.js";

export interface RollDiceResult {
  state: GameState;
  /** Both faces thrown, in die order; returned even when the throw is forfeited. */
  values: [number, number];
  /** turn_passed / extra_turn when the throw ends immediately. */
  events: GameEvent[];
}

export type RngFunction = () => number;

/**
 * Throw both dice for the current player.
 *
 * RNG function should return a value in [0, 1); it is called once per die.
 *
 * Handles:
 * - §4: A throw showing a 6 earns a bonus roll; one throw past
 *   maxConsecutiveSixes forfeits the throw and passes the turn
 * - §8: When neither die can be played, the throw ends at once
 *   (bonus roll if earned, else the turn passes)
 */
export function rollDice(state: GameState, rng: RngFunction): RollDiceResult {
  if (state.phase !== "awaiting_roll") {
    throw new Error("Cannot roll dice: not in awaiting_roll phase");
  }

  const values: [number, number] = [faceFrom(rng()), faceFrom(rng())];
  const events: GameEvent[] = [];
  const rolledSix = values.includes(6);
  const consecutiveSixes = rolledSix ? state.consecutiveSixes + 1 : 0;

  const max = state.config.houseRules.maxConsecutiveSixes;
  if (rolledSix && max !== "unlimited" && consecutiveSixes > max) {
    const passed = passTurn(state);
    events.push({ type: "turn_passed", color: passed.turn });
    return { state: passed, values, events };
  }

  const rolled: GameState = {
    ...state,
    phase: "awaiting_move",
    dice: [
      { value: values[0], used: false },
      { value: values[1], used: false },
    ],
    extraRollEarned: rolledSix,
    consecutiveSixes,
  };

  if (legalMoves(rolled).length === 0) {
    return { state: endThrow(rolled, events), values, events };
  }

  return { state: rolled, values, events };
}

function faceFrom(r: number): number {
  return Math.min(6, Math.floor(r * 6) + 1);
}
