/**
 * Legal move generation for Ludi
 * Source: GAME_RULES.md §3–§8, §10, §11
 * 
 * This module implements move generation ONLY - no capture resolution,
 * no turn advancement, no state mutation. Just: given a game state with
 * a rolled dice value, what are all the legal moves?
 */

import type { GameState, LegalMove, TokenPos, TokenRef, Color } from "./types";
import { advancePosition, positionsEqual, isSafeCell } from "./topology";
import { getTokensForColor, getTokenGlobalIndex } from "./game";

/**
 * Generate all legal moves for the current game state
 * 
 * Assumptions:
 * - state.phase is "awaiting_move"
 * - state.dice is set (1-6)
 * 
 * Rules applied:
 * - §3: Can only leave yard on exactly 6
 * - §6: Blockades (2+ same-color tokens) block everyone, cannot pass or land
 * - §7: Safe cells allow multiple colors (but blockades still block)
 * - §8: Exact count required for home column/home; overshoot = illegal
 * - §10: Returns empty array when no legal moves exist
 */
export function legalMoves(state: GameState): LegalMove[] {
  if (state.phase !== "awaiting_move" || state.dice === null) {
    return [];
  }

  const moves: LegalMove[] = [];
  const currentPlayerTokens = getTokensForColor(state, state.turn);

  for (const token of currentPlayerTokens) {
    const move = tryMove(state, token, state.dice);
    if (move !== null) {
      moves.push(move);
    }
  }

  return moves;
}

/**
 * Try to move a single token by the dice value
 * Returns null if the move is illegal
 */
function tryMove(
  state: GameState,
  token: { color: Color; index: number; pos: TokenPos },
  steps: number
): LegalMove | null {
  const resulting = advancePosition(token.pos, steps, token.color);
  
  if (resulting === null) {
    return null;
  }

  if (!isPathClear(state, token.color, token.pos, steps)) {
    return null;
  }

  if (!isDestinationLegal(state, token.color, resulting, token.pos)) {
    return null;
  }

  const tokenIndex = getTokenGlobalIndex(state, token.color, token.index);
  const captureInfo = getCaptureInfo(state, token.color, resulting);

  return {
    tokenIndex,
    resulting,
    ...(captureInfo && { captures: captureInfo }),
  };
}

/**
 * Check if the path from origin to destination is clear of blockades
 * Blockades block movement through them, not just landing
 */
function isPathClear(
  state: GameState,
  movingColor: Color,
  origin: TokenPos,
  steps: number
): boolean {
  if (origin.zone !== "track") {
    return true;
  }

  let currentPos: TokenPos = origin;
  for (let i = 1; i <= steps; i++) {
    const nextPos = advancePosition(currentPos, 1, movingColor);
    if (nextPos === null) {
      return true;
    }
    
    if (nextPos.zone === "track") {
      const tokensAtPos = getTokensAtPosition(state, nextPos);
      if (hasBlockade(tokensAtPos)) {
        return false;
      }
    }
    
    currentPos = nextPos;
    if (currentPos.zone !== "track") {
      break;
    }
  }
  
  return true;
}

/**
 * Check if a destination is legal for a token to land on
 * 
 * Legal destinations:
 * - Empty cells
 * - Cells with own single token (forms blockade)
 * - Cells with single opponent token on non-safe cells (capture)
 * - Safe cells with any number of different-color tokens
 * 
 * Illegal destinations:
 * - Any cell with a blockade (2+ same-color tokens)
 */
function isDestinationLegal(
  state: GameState,
  movingColor: Color,
  destination: TokenPos,
  origin: TokenPos
): boolean {
  if (destination.zone === "yard" || destination.zone === "home") {
    return true;
  }

  if (destination.zone === "homeColumn") {
    return true;
  }

  if (destination.zone === "track") {
    const tokensAtDest = getTokensAtPosition(state, destination);
    
    if (tokensAtDest.length === 0) {
      return true;
    }

    if (hasBlockade(tokensAtDest)) {
      return false;
    }

    if (isSafeCell(destination.cell)) {
      return true;
    }

    const ownTokensAtDest = tokensAtDest.filter(t => t.color === movingColor);
    const oppTokensAtDest = tokensAtDest.filter(t => t.color !== movingColor);
    
    if (ownTokensAtDest.length === 1 && oppTokensAtDest.length === 0) {
      return true;
    }
    
    if (oppTokensAtDest.length === 1 && ownTokensAtDest.length === 0) {
      return true;
    }

    return false;
  }

  return true;
}

/**
 * Check if there's a blockade at a position (2+ same-color tokens)
 */
function hasBlockade(tokens: Array<{ color: Color; index: number }>): boolean {
  const colorGroups = groupTokensByColor(tokens);
  
  for (const colorTokens of Object.values(colorGroups)) {
    if (colorTokens.length >= 2) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if landing at this position would capture an opponent token
 * Returns the token reference if a capture would occur, null otherwise
 * 
 * Capture rules (§5):
 * - Only single opponent tokens can be captured
 * - No captures on safe cells
 * - No captures in home columns or home
 */
function getCaptureInfo(
  state: GameState,
  movingColor: Color,
  destination: TokenPos
): TokenRef | null {
  if (destination.zone !== "track") {
    return null;
  }

  if (isSafeCell(destination.cell)) {
    return null;
  }

  const tokensAtDest = getTokensAtPosition(state, destination);
  const opponentTokens = tokensAtDest.filter((t) => t.color !== movingColor);

  if (opponentTokens.length === 1) {
    return {
      color: opponentTokens[0].color,
      index: opponentTokens[0].index,
    };
  }

  return null;
}

/**
 * Get all tokens at a specific position
 */
function getTokensAtPosition(
  state: GameState,
  pos: TokenPos
): Array<{ color: Color; index: number }> {
  return state.tokens
    .filter((token) => positionsEqual(token.pos, pos))
    .map((token) => ({ color: token.color, index: token.index }));
}

/**
 * Group tokens by color
 */
function groupTokensByColor(
  tokens: Array<{ color: Color; index: number }>
): Record<string, Array<{ color: Color; index: number }>> {
  const groups: Record<string, Array<{ color: Color; index: number }>> = {};
  
  for (const token of tokens) {
    if (!groups[token.color]) {
      groups[token.color] = [];
    }
    groups[token.color].push(token);
  }
  
  return groups;
}
