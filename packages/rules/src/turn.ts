/**
 * Turn hand-off shared by rollDice and applyMove.
 * Source: docs/GAME_RULES.md §2, §4, §8
 */

import type { Color, GameState } from "./types";
import type { GameEvent } from "./applyMove";

/** Next colour in turn order, skipping players who have already finished. */
export function nextTurn(state: GameState): Color {
  const colors = state.config.playerColors;
  let next = state.turn;
  for (let i = 0; i < colors.length; i++) {
    next = colors[(colors.indexOf(next) + 1) % colors.length];
    if (!state.placements.includes(next)) return next;
  }
  return next;
}

/** Ends the current player's turn: next player, fresh roll, streaks cleared. */
export function passTurn(state: GameState): GameState {
  return {
    ...state,
    turn: nextTurn(state),
    phase: "awaiting_roll",
    dice: null,
    extraRollEarned: false,
    consecutiveSixes: 0,
  };
}

/**
 * Both dice spent, or the remaining die has no legal move (it is forfeited):
 * take the bonus roll if one was earned, else pass the turn. The six streak
 * carries into a bonus roll.
 */
export function endThrow(state: GameState, events: GameEvent[]): GameState {
  if (state.extraRollEarned) {
    events.push({ type: "extra_turn", color: state.turn });
    return { ...state, phase: "awaiting_roll", dice: null, extraRollEarned: false };
  }
  const passed = passTurn(state);
  events.push({ type: "turn_passed", color: passed.turn });
  return passed;
}
