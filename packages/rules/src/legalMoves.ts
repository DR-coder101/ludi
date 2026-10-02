/**
 * Legal move generation for Ludi
 * Source: docs/GAME_RULES.md §3-§8, §10, §11
 */

import type { GameState, TokenPos, Color, TokenState } from "./types";
import { computePath, isSafeCell } from "./topology";

export interface TokenRef {
  color: Color;
  index: 0 | 1 | 2 | 3;
}

export interface LegalMove {
  tokenIndex: number;
  /** Which die of the current throw this move spends. */
  dieIndex: 0 | 1;
  /** That die's value. */
  steps: number;
  resulting: TokenPos;
  captures?: TokenRef;
}

/**
 * Compute all legal moves for the current game state: one entry per
 * (token, unused die) pair that can be played right now. When both dice show
 * the same value, each die is listed separately.
 * Returns empty array if no legal moves exist.
 *
 * Rules enforced:
 * - §2: Each die is played separately; spent dice offer no moves
 * - §3: Can only leave yard with a die showing 6
 * - §6: Blockades (2+ same-color tokens) block everyone, cannot pass or land
 * - §7: Safe cells allow multi-color coexistence, no captures
 * - §8: Exact count required for home column/home entry (no overshoot)
 * - §5: Landing on single opponent token captures it (except safe cells)
 */
export function legalMoves(state: GameState): LegalMove[] {
  if (state.phase !== "awaiting_move" || state.dice === null) {
    return [];
  }

  const moves: LegalMove[] = [];
  state.dice.forEach((die, dieIndex) => {
    if (die.used) return;
    for (const move of movesForSteps(state, die.value)) {
      moves.push({ ...move, dieIndex: dieIndex as 0 | 1, steps: die.value });
    }
  });
  return moves;
}

function movesForSteps(
  state: GameState,
  steps: number
): { tokenIndex: number; resulting: TokenPos; captures?: TokenRef }[] {
  const moves: { tokenIndex: number; resulting: TokenPos; captures?: TokenRef }[] = [];

  state.tokens.forEach((token, tokenIndex) => {
    if (token.color !== state.turn || token.pos.zone === "home") return;

    let resulting: TokenPos | null;
    if (token.pos.zone === "yard") {
      // Leaving the yard needs a die showing exactly 6
      if (steps !== 6) return;
      resulting = computePath(token.pos, 1, token.color);
    } else {
      resulting = computePath(token.pos, steps, token.color);
      // Overshoot or passing a blockade
      if (!resulting || wouldPassThroughBlockade(token.pos, steps, token.color, state)) return;
    }

    if (!resulting || isBlockedByObstacle(resulting, token.color, state)) return;

    const capture = getCaptureAt(resulting, token.color, state);
    moves.push({ tokenIndex, resulting, captures: capture || undefined });
  });

  return moves;
}

/**
 * Check if the destination position is blocked by a blockade or contains
 * a blockade that would prevent landing.
 */
function isBlockedByObstacle(
  pos: TokenPos,
  movingColor: Color,
  state: GameState
): boolean {
  // Home and yard are never blocked
  if (pos.zone === "home" || pos.zone === "yard") {
    return false;
  }

  const tokensAtPos = getTokensAt(pos, state);

  // No tokens at destination
  if (tokensAtPos.length === 0) {
    return false;
  }

  // Check for blockade (2+ tokens of same color)
  const colorGroups = groupByColor(tokensAtPos);
  
  for (const [color, tokens] of Object.entries(colorGroups)) {
    if (tokens.length >= 2) {
      // Blockade exists - blocks everyone including the owner (§6)
      return true;
    }
  }

  // Check if we can share the cell
  if (pos.zone === "track" && isSafeCell(pos.cell)) {
    // Safe cells allow multi-color coexistence (§7)
    return false;
  }

  // Home column cells allow same-color stacking (but would be blocked by blockade above)
  if (pos.zone === "homeColumn") {
    // Only can't land if opponent is there
    const opponents = tokensAtPos.filter((t) => t.color !== movingColor);
    return opponents.length > 0;
  }

  // Regular track cell: can land if empty or only opponent single token (will capture)
  return false;
}

/**
 * Check if moving from current position would pass through a blockade.
 * Blockades cannot be passed (§6).
 */
function wouldPassThroughBlockade(
  currentPos: TokenPos,
  steps: number,
  color: Color,
  state: GameState
): boolean {
  // Can't pass through from yard or already at destination
  if (currentPos.zone === "yard" || steps <= 0) {
    return false;
  }

  // Check each intermediate cell
  for (let i = 1; i < steps; i++) {
    const intermediatePos = computePath(currentPos, i, color);
    if (!intermediatePos) continue;

    const tokensAtPos = getTokensAt(intermediatePos, state);
    const colorGroups = groupByColor(tokensAtPos);

    // Check for blockades at intermediate position
    for (const tokens of Object.values(colorGroups)) {
      if (tokens.length >= 2) {
        return true; // Blockade blocks passage
      }
    }
  }

  return false;
}

/**
 * Check if landing at this position would capture an opponent token.
 * Returns the captured token reference, or null.
 * 
 * §5: Capture occurs when landing on single opponent token
 * §7: No captures on safe cells
 */
function getCaptureAt(
  pos: TokenPos,
  movingColor: Color,
  state: GameState
): TokenRef | null {
  // Can only capture on regular track cells (not safe, not home column, not home)
  if (pos.zone !== "track") {
    return null;
  }

  if (isSafeCell(pos.cell)) {
    return null; // No captures on safe cells (§7)
  }

  const tokensAtPos = getTokensAt(pos, state);
  const opponents = tokensAtPos.filter((t) => t.color !== movingColor);

  // Can only capture a single opponent token
  if (opponents.length === 1) {
    return { color: opponents[0].color, index: opponents[0].index };
  }

  return null;
}

/**
 * Get all tokens at a specific position.
 */
function getTokensAt(pos: TokenPos, state: GameState): TokenState[] {
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

  return true; // yard or home (no additional fields)
}

/**
 * Group tokens by color.
 */
function groupByColor(tokens: TokenState[]): Record<Color, TokenState[]> {
  const groups: Record<string, TokenState[]> = {};
  
  for (const token of tokens) {
    if (!groups[token.color]) {
      groups[token.color] = [];
    }
    groups[token.color].push(token);
  }

  return groups as Record<Color, TokenState[]>;
}
