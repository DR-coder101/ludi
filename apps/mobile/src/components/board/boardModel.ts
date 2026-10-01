import { computePath, type Color, type GameState, type TokenPos } from '@ludi/rules';
import { HOME_COLUMNS, TRACK_CELLS, type CellPosition } from './boardLayout';
import { PLACES, TURN_ORDER, type PieceColor } from '../../theme/tokens';

export interface MoveLike {
  tokenIndex: number;
  resulting: TokenPos;
}

export interface BoardPiece {
  key: string;
  color: Color;
  piece: PieceColor;
  row: number;
  col: number;
  /** Tokens of this colour sharing the cell; > 1 shows the hot-pink count badge. */
  count: number;
  /** Token the press acts on: the first legal one in the cell, else the first. */
  tokenIndex: number;
  legal: boolean;
  /** Horizontal nudge in cells when different colours share a cell. */
  dx: number;
}

export interface YardView {
  color: Color;
  piece: PieceColor;
  seated: boolean;
  active: boolean;
  /** Token indices waiting in the yard, in token order; fills slots left to right. */
  tokens: number[];
  /** Yard tokens that can come out this turn. */
  legal: number[];
}

export interface MoveHighlight {
  tokenIndex: number;
  piece: PieceColor;
  from: CellPosition;
  /** Cells passed over, excluding the destination. */
  path: CellPosition[];
  to: CellPosition;
  steps: number;
}

export interface BoardModel {
  turn: Color;
  yards: Record<Color, YardView>;
  pieces: BoardPiece[];
  finished: { color: Color; piece: PieceColor; row: number; col: number; count: number }[];
  highlight: MoveHighlight | null;
}

/** Where a finished token rests: the centroid of its colour's arrival triangle in the centre flag. */
export const HOME_SPOTS: Record<Color, CellPosition> = {
  red: { row: 10, col: 9 },
  green: { row: 9, col: 10 },
  yellow: { row: 8, col: 9 },
  blue: { row: 9, col: 8 },
};

/** Grid cell for a token position, or null while it sits in the yard. */
export function cellOf(pos: TokenPos, color: Color): CellPosition | null {
  switch (pos.zone) {
    case 'track':
      return TRACK_CELLS[pos.cell];
    case 'homeColumn':
      return HOME_COLUMNS[color].cells[pos.step - 1];
    case 'home':
      return HOME_SPOTS[color];
    default:
      return null;
  }
}

function samePos(a: TokenPos, b: TokenPos): boolean {
  if (a.zone !== b.zone) return false;
  if (a.zone === 'track' && b.zone === 'track') return a.cell === b.cell;
  if (a.zone === 'homeColumn' && b.zone === 'homeColumn') return a.step === b.step;
  return true;
}

/**
 * Cells a token hops through moving `from` → `to`, one per pip, ending on `to`.
 * Coming out of the yard is a single hop onto the start star.
 */
export function hopCells(from: TokenPos, to: TokenPos, color: Color): CellPosition[] {
  if (from.zone === 'yard') {
    const start = cellOf(to, color);
    return start ? [start] : [];
  }
  const cells: CellPosition[] = [];
  for (let step = 1; step <= 8; step++) {
    const pos = computePath(from, step, color);
    if (!pos) break;
    const cell = cellOf(pos, color);
    if (cell) cells.push(cell);
    if (samePos(pos, to)) return cells;
  }
  const end = cellOf(to, color);
  return end ? [end] : [];
}

function pickHighlight(
  state: GameState,
  moves: MoveLike[],
  focusTokenIndex: number | null,
): MoveHighlight | null {
  if (state.phase !== 'awaiting_move' || state.dice == null) return null;
  const onBoard = moves.filter((m) => state.tokens[m.tokenIndex]?.pos.zone !== 'yard');
  const move = onBoard.find((m) => m.tokenIndex === focusTokenIndex) ?? onBoard[0];
  if (!move) return null;
  const token = state.tokens[move.tokenIndex];
  const from = cellOf(token.pos, token.color);
  if (!from) return null;
  const cells = hopCells(token.pos, move.resulting, token.color);
  const to = cells[cells.length - 1];
  if (!to) return null;
  return {
    tokenIndex: move.tokenIndex,
    piece: PLACES[token.color].piece,
    from,
    path: cells.slice(0, -1),
    to,
    steps: state.dice,
  };
}

/**
 * Everything the board draws for one engine state. `hidden` tokens are left out
 * (they are mid-animation and drawn by the hop layer instead).
 */
export function buildBoardModel(
  state: GameState,
  moves: MoveLike[],
  options: { focusTokenIndex?: number | null; hidden?: number[] } = {},
): BoardModel {
  const hidden = new Set(options.hidden ?? []);
  const legal = new Set(moves.map((m) => m.tokenIndex));
  const seated = new Set(state.config.playerColors);

  const yards = {} as Record<Color, YardView>;
  for (const color of TURN_ORDER) {
    yards[color] = {
      color,
      piece: PLACES[color].piece,
      seated: seated.has(color),
      active: state.phase !== 'finished' && state.turn === color,
      tokens: [],
      legal: [],
    };
  }

  const groups = new Map<string, { color: Color; cell: CellPosition; tokens: number[] }>();
  const finished = new Map<Color, number>();

  state.tokens.forEach((token, index) => {
    if (hidden.has(index)) return;
    if (token.pos.zone === 'yard') {
      yards[token.color].tokens.push(index);
      if (legal.has(index)) yards[token.color].legal.push(index);
      return;
    }
    if (token.pos.zone === 'home') {
      finished.set(token.color, (finished.get(token.color) ?? 0) + 1);
      return;
    }
    const cell = cellOf(token.pos, token.color);
    if (!cell) return;
    const key = `${cell.row},${cell.col},${token.color}`;
    const group = groups.get(key) ?? { color: token.color, cell, tokens: [] };
    group.tokens.push(index);
    groups.set(key, group);
  });

  const perCell = new Map<string, number>();
  for (const g of groups.values()) {
    const k = `${g.cell.row},${g.cell.col}`;
    perCell.set(k, (perCell.get(k) ?? 0) + 1);
  }
  const seen = new Map<string, number>();
  const pieces: BoardPiece[] = [];
  for (const [key, g] of groups) {
    const k = `${g.cell.row},${g.cell.col}`;
    const total = perCell.get(k) ?? 1;
    const nth = seen.get(k) ?? 0;
    seen.set(k, nth + 1);
    const legalToken = g.tokens.find((t) => legal.has(t));
    pieces.push({
      key,
      color: g.color,
      piece: PLACES[g.color].piece,
      row: g.cell.row,
      col: g.cell.col,
      count: g.tokens.length,
      tokenIndex: legalToken ?? g.tokens[0],
      legal: legalToken !== undefined,
      dx: total > 1 ? (nth - (total - 1) / 2) * 0.36 : 0,
    });
  }

  return {
    turn: state.turn,
    yards,
    pieces,
    finished: [...finished].map(([color, count]) => ({
      color,
      piece: PLACES[color].piece,
      ...HOME_SPOTS[color],
      count,
    })),
    highlight: pickHighlight(state, moves, options.focusTokenIndex ?? null),
  };
}
