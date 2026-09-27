/**
 * Pure board model: maps engine state onto the 19×19 drawing (380-unit
 * viewBox, 20 units per cell). All cell coordinates come from
 * `boardLayout.ts`; nothing here re-derives the track.
 */
import { computePath } from '@ludi/rules';
import type { Color, TokenPos, TokenState } from '@ludi/rules';
import {
  HOME_COLUMNS,
  START_CELLS,
  TRACK_CELLS,
  YARDS,
  type CellPosition,
} from './boardLayout';
import { boardGeometry } from '../../theme/tokens';

const C = boardGeometry.cell;
const CENTRE = (boardGeometry.grid * C) / 2;

export interface Point {
  x: number;
  y: number;
}

export interface Anchor extends Point {
  r: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export type CellKind = 'yard' | 'centre' | 'home' | 'track';

export function cellKind(row: number, col: number): CellKind {
  const armRow = row >= 8 && row <= 10;
  const armCol = col >= 8 && col <= 10;
  if (!armRow && !armCol) return 'yard';
  if (armRow && armCol) return 'centre';
  if (HOME_STRIP_KEYS.has(`${row},${col}`)) return 'home';
  return 'track';
}

/** Distance from the arm's outer end, used for the green/black/gold/black stripes. */
export function stripeIndex(row: number, col: number): number {
  if (row < 8) return row;
  if (row > 10) return 18 - row;
  if (col < 8) return col;
  return 18 - col;
}

export function cellCenter(cell: CellPosition): Point {
  return { x: cell.col * C + C / 2, y: cell.row * C + C / 2 };
}

function directionOf(from: CellPosition, to: CellPosition): Direction {
  if (to.row > from.row) return 'down';
  if (to.row < from.row) return 'up';
  if (to.col > from.col) return 'right';
  return 'left';
}

export interface HomeStrip {
  color: Color;
  /** Six engine home-column cells plus the cell that meets the centre. */
  cells: CellPosition[];
  /** Arm end cell where the column is entered. */
  entry: CellPosition;
  /** Direction of travel toward the centre. */
  direction: Direction;
}

function buildHomeStrip(color: Color): HomeStrip {
  const cells = HOME_COLUMNS[color].cells;
  const dr = cells[1].row - cells[0].row;
  const dc = cells[1].col - cells[0].col;
  const last = cells[cells.length - 1];
  return {
    color,
    cells: [...cells, { row: last.row + dr, col: last.col + dc }],
    entry: { row: cells[0].row - dr, col: cells[0].col - dc },
    direction: directionOf(cells[0], cells[1]),
  };
}

export const HOME_STRIPS: Record<Color, HomeStrip> = {
  red: buildHomeStrip('red'),
  green: buildHomeStrip('green'),
  yellow: buildHomeStrip('yellow'),
  blue: buildHomeStrip('blue'),
};

const HOME_STRIP_KEYS = new Set(
  Object.values(HOME_STRIPS).flatMap((s) => s.cells.map((c) => `${c.row},${c.col}`)),
);

export function startCell(color: Color): CellPosition {
  return TRACK_CELLS[START_CELLS[color]];
}

export function yardOrigin(color: Color): Point {
  const { topLeft } = YARDS[color];
  return { x: topLeft.col * C, y: topLeft.row * C };
}

export function yardSlotAnchor(color: Color, slot: number): Anchor {
  const o = yardOrigin(color);
  return { x: o.x + 29 + slot * 34, y: o.y + 123, r: boardGeometry.yardPieceRadius };
}

/** Piece anchor inside the centre triangle its home column enters. */
function homeAnchor(color: Color): Anchor {
  const cells = HOME_COLUMNS[color].cells;
  const p = cellCenter(cells[cells.length - 1]);
  const dx = Math.sign(p.x - CENTRE);
  const dy = Math.sign(p.y - CENTRE);
  return { x: CENTRE + dx * C, y: CENTRE + dy * C, r: boardGeometry.homePieceRadius };
}

/** Anchor for a token that is on the board (not in its yard). */
export function boardAnchor(pos: Exclude<TokenPos, { zone: 'yard' }>, color: Color): Anchor {
  if (pos.zone === 'home') return homeAnchor(color);
  const cell = pos.zone === 'track' ? TRACK_CELLS[pos.cell] : HOME_COLUMNS[color].cells[pos.step - 1];
  const c = cellCenter(cell);
  return { x: c.x, y: c.y - 1, r: boardGeometry.trackPieceRadius };
}

export interface PieceLayout extends Anchor {
  tokenIndex: number;
  color: Color;
  zone: TokenPos['zone'];
  /** Same-colour tokens sharing this spot (1 when alone). */
  stackCount: number;
  /** The drawn/tappable piece of its stack. */
  stackTop: boolean;
  /** Token indices in this piece's stack, bottom first. */
  stack: number[];
}

const MIXED_OFFSETS: Record<number, Point[]> = {
  2: [{ x: -3.2, y: 0 }, { x: 3.2, y: 0 }],
  3: [{ x: 0, y: -3.4 }, { x: -3.2, y: 2.4 }, { x: 3.2, y: 2.4 }],
  4: [{ x: -3.2, y: -3.2 }, { x: 3.2, y: -3.2 }, { x: -3.2, y: 3.2 }, { x: 3.2, y: 3.2 }],
};

/**
 * Where every token is drawn. Yard tokens pack into the yard's four slots
 * left to right; tokens sharing a spot become a stack with a count badge.
 */
export function layoutPieces(tokens: readonly TokenState[]): PieceLayout[] {
  const layouts: PieceLayout[] = new Array(tokens.length);
  const yardCounts: Partial<Record<Color, number>> = {};
  const spots = new Map<string, Map<Color, number[]>>();

  tokens.forEach((token, tokenIndex) => {
    if (token.pos.zone === 'yard') {
      const slot = yardCounts[token.color] ?? 0;
      yardCounts[token.color] = slot + 1;
      layouts[tokenIndex] = {
        ...yardSlotAnchor(token.color, slot),
        tokenIndex,
        color: token.color,
        zone: 'yard',
        stackCount: 1,
        stackTop: true,
        stack: [tokenIndex],
      };
      return;
    }
    const anchor = boardAnchor(token.pos, token.color);
    const key = `${anchor.x},${anchor.y}`;
    const byColor = spots.get(key) ?? new Map<Color, number[]>();
    byColor.set(token.color, [...(byColor.get(token.color) ?? []), tokenIndex]);
    spots.set(key, byColor);
    layouts[tokenIndex] = {
      ...anchor,
      tokenIndex,
      color: token.color,
      zone: token.pos.zone,
      stackCount: 1,
      stackTop: true,
      stack: [tokenIndex],
    };
  });

  for (const byColor of spots.values()) {
    const groups = [...byColor.values()];
    const offsets = MIXED_OFFSETS[groups.length];
    groups.forEach((stack, g) => {
      const offset = offsets?.[g] ?? { x: 0, y: 0 };
      stack.forEach((tokenIndex, i) => {
        const l = layouts[tokenIndex];
        layouts[tokenIndex] = {
          ...l,
          x: l.x + offset.x,
          y: l.y + offset.y,
          stackCount: stack.length,
          stackTop: i === stack.length - 1,
          stack,
        };
      });
    });
  }

  return layouts;
}

export function samePos(a: TokenPos, b: TokenPos): boolean {
  if (a.zone !== b.zone) return false;
  if (a.zone === 'track' && b.zone === 'track') return a.cell === b.cell;
  if (a.zone === 'homeColumn' && b.zone === 'homeColumn') return a.step === b.step;
  return true;
}

/** Positions visited one step at a time from `from` toward `to`, via the engine's own path rule. */
export function stepPositions(from: TokenPos, color: Color, maxSteps: number): TokenPos[] {
  const out: TokenPos[] = [];
  let cur: TokenPos | null = from;
  for (let i = 0; i < maxSteps && cur; i++) {
    cur = computePath(cur, 1, color);
    if (cur) out.push(cur);
  }
  return out;
}

export type MotionPlan =
  | { kind: 'none' }
  | { kind: 'enter' }
  | { kind: 'capture' }
  | { kind: 'jump' }
  | { kind: 'hop'; steps: TokenPos[] };

/** How a token should travel between two engine positions. */
export function planMotion(from: TokenPos, to: TokenPos, color: Color): MotionPlan {
  if (samePos(from, to)) return { kind: 'none' };
  if (from.zone === 'yard') return to.zone === 'track' ? { kind: 'enter' } : { kind: 'jump' };
  if (to.zone === 'yard') return { kind: 'capture' };
  const steps = stepPositions(from, color, 6);
  const hit = steps.findIndex((p) => samePos(p, to));
  return hit === -1 ? { kind: 'jump' } : { kind: 'hop', steps: steps.slice(0, hit + 1) };
}

export type MotionKind = 'hop' | 'enter' | 'capture' | 'slide';

export interface PieceMotion {
  kind: MotionKind;
  /** Anchors visited in order; the last is the piece's new resting place. */
  waypoints: Anchor[];
  delayMs: number;
  arrivesHome: boolean;
}

/**
 * Motions for a state transition, one entry per token (null = no change).
 * Captured pieces and re-stacks wait until the moving piece has landed.
 */
export function planBoardMotions(
  prevTokens: readonly TokenState[],
  prevLayouts: readonly PieceLayout[],
  tokens: readonly TokenState[],
  layouts: readonly PieceLayout[],
  hopMs: number,
): (PieceMotion | null)[] {
  if (prevTokens.length !== tokens.length) return tokens.map(() => null);

  const plans = tokens.map((token, i) => planMotion(prevTokens[i].pos, token.pos, token.color));
  const landingMs = Math.max(0, ...plans.map((p) => (p.kind === 'hop' ? p.steps.length * hopMs : 0)));

  return tokens.map((token, i) => {
    const plan = plans[i];
    const to = layouts[i];
    const from = prevLayouts[i];
    const arrivesHome = token.pos.zone === 'home' && prevTokens[i].pos.zone !== 'home';
    if (plan.kind === 'hop') {
      const waypoints = plan.steps.map((p, s) =>
        s === plan.steps.length - 1 || p.zone === 'yard' ? to : boardAnchor(p, token.color),
      );
      return { kind: 'hop', waypoints, delayMs: 0, arrivesHome };
    }
    if (plan.kind === 'enter') return { kind: 'enter', waypoints: [to], delayMs: 0, arrivesHome };
    if (plan.kind === 'capture') return { kind: 'capture', waypoints: [to], delayMs: landingMs, arrivesHome };
    if (plan.kind === 'jump' || from.x !== to.x || from.y !== to.y || from.r !== to.r) {
      return { kind: 'slide', waypoints: [to], delayMs: plan.kind === 'jump' ? 0 : landingMs, arrivesHome };
    }
    return null;
  });
}

export interface MoveHighlight {
  tokenIndex: number;
  fromYard: boolean;
  from: Anchor;
  /** Intermediate cells, excluding origin and destination. */
  path: Point[];
  to: Anchor;
  steps: number;
}

export interface LegalMoveLike {
  tokenIndex: number;
  resulting: TokenPos;
}

export function planHighlights(
  tokens: readonly TokenState[],
  moves: readonly LegalMoveLike[],
  dice: number | null,
  layouts: readonly PieceLayout[],
): MoveHighlight[] {
  return moves.flatMap((move) => {
    const token = tokens[move.tokenIndex];
    const from = layouts[move.tokenIndex];
    if (!token || !from || move.resulting.zone === 'yard') return [];
    const fromYard = token.pos.zone === 'yard';
    const steps = fromYard ? 0 : dice ?? 0;
    const visited = fromYard ? [] : stepPositions(token.pos, token.color, steps);
    const path = visited
      .slice(0, -1)
      .filter((p): p is Exclude<TokenPos, { zone: 'yard' }> => p.zone !== 'yard')
      .map((p) => boardAnchor(p, token.color));
    return [
      {
        tokenIndex: move.tokenIndex,
        fromYard,
        from,
        path,
        to: boardAnchor(move.resulting, token.color),
        steps,
      },
    ];
  });
}
