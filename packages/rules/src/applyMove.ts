/**
 * Move application and game event generation for Ludi
 * Source: docs/GAME_RULES.md §2-§6, §8, §9, §11
 */

import type { GameState, TokenPos, Color, Dice } from "./types.js";
import { legalMoves } from "./legalMoves.js";
import { endThrow, passTurn } from "./turn.js";

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
 * Play one die: move `tokenIndex` by the value of die `dieIndex`.
 * The (tokenIndex, dieIndex) pair must appear in legalMoves(state).
 *
 * This function:
 * - Moves the token and marks the die used (§2)
 * - Handles captures (§5); start cells are safe so coming out never captures
 * - Emits blockade form/break events (§6)
 * - Handles win detection & placements (§9)
 * - Keeps the phase at awaiting_move while the other die can still be played;
 *   otherwise ends the throw with a bonus roll (§4) or passes the turn (§8)
 */
export function applyMove(state: GameState, tokenIndex: number, dieIndex: number): ApplyMoveResult {
  const events: GameEvent[] = [];

  if (state.phase !== "awaiting_move" || state.dice === null) {
    throw new Error("Cannot apply move: not in awaiting_move phase or dice is null");
  }

  const die = state.dice[dieIndex];
  if (!die) {
    throw new Error(`Invalid die index: ${dieIndex}`);
  }
  if (die.used) {
    throw new Error(`Die ${dieIndex} has already been played this throw`);
  }

  const token = state.tokens[tokenIndex];
  if (!token) {
    throw new Error(`Invalid token index: ${tokenIndex}`);
  }

  if (token.color !== state.turn) {
    throw new Error(`Cannot move token: it's ${state.turn}'s turn, but token is ${token.color}`);
  }

  const move = legalMoves(state).find((m) => m.tokenIndex === tokenIndex && m.dieIndex === dieIndex);
  if (!move) {
    throw new Error(`Move is not legal for token ${tokenIndex} with die ${dieIndex}`);
  }

  const dice = state.dice.map((d, i) => (i === dieIndex ? { ...d, used: true } : d)) as Dice;
  const newState: GameState = {
    ...state,
    tokens: [...state.tokens],
    dice,
  };

  const oldPos = token.pos;
  const newPos = move.resulting;

  const wasInBlockade = oldPos.zone !== "yard" && oldPos.zone !== "home" &&
    countOwnAt(oldPos, token.color, newState) >= 2;

  if (move.captures) {
    const captured = newState.tokens.findIndex(
      (t) => t.color === move.captures!.color && t.index === move.captures!.index
    );
    newState.tokens[captured] = { ...newState.tokens[captured], pos: { zone: "yard" } };
    events.push({
      type: "captured",
      color: token.color,
      tokenIndex: token.index,
      capturedColor: move.captures.color,
      capturedTokenIndex: move.captures.index,
    });
    if (newState.config.houseRules.extraRollOnCapture) {
      newState.extraRollEarned = true;
    }
  }

  newState.tokens[tokenIndex] = { ...token, pos: newPos };

  if (oldPos.zone === "yard") {
    events.push({ type: "came_out", color: token.color, tokenIndex: token.index });
  } else if (newPos.zone === "homeColumn" && oldPos.zone === "track") {
    events.push({ type: "entered_home_column", color: token.color, tokenIndex: token.index });
  } else if (newPos.zone === "home") {
    events.push({ type: "got_home", color: token.color, tokenIndex: token.index });
    if (newState.config.houseRules.exactFinishBonus) {
      newState.extraRollEarned = true;
    }
  } else {
    events.push({ type: "moved", color: token.color, tokenIndex: token.index });
  }

  if (wasInBlockade && countOwnAt(oldPos, token.color, newState) < 2) {
    events.push({ type: "blockade_broken", color: token.color });
  }

  // A new blockade forms when the moved token makes exactly two
  if (newPos.zone !== "yard" && newPos.zone !== "home" && countOwnAt(newPos, token.color, newState) === 2) {
    events.push({ type: "blockade_formed", color: token.color });
  }

  const finishedNow = newState.tokens
    .filter((t) => t.color === token.color)
    .every((t) => t.pos.zone === "home");

  if (finishedNow && !newState.placements.includes(token.color)) {
    newState.placements = [...newState.placements, token.color];

    const playForPlacements = newState.config.houseRules.playForPlacements;
    const playersRemaining = newState.config.playerColors.filter(
      (c) => !newState.placements.includes(c)
    ).length;

    if (!playForPlacements || playersRemaining <= 1) {
      newState.winner = newState.placements[0];
      newState.phase = "finished";
      newState.dice = null;
      newState.extraRollEarned = false;

      if (playForPlacements) {
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

    // Finished with placements still to play for: the rest of this throw is void
    const passed = passTurn(newState);
    events.push({ type: "turn_passed", color: passed.turn });
    return { state: passed, events };
  }

  // The other die is still playable: same player picks again
  if (legalMoves(newState).length > 0) {
    return { state: newState, events };
  }

  return { state: endThrow(newState, events), events };
}

function countOwnAt(pos: TokenPos, color: Color, state: GameState): number {
  return state.tokens.filter((t) => t.color === color && positionsEqual(t.pos, pos)).length;
}

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
