/** Same-colour stack on one cell. GAME_RULES.md §6. */
export type OccupancyVisual =
  | { kind: 'single' }
  | {
      kind: 'blockade';
      count: number;
      badge: string;
      /** Disc-centre offsets in units of the glyph radius. Back disc first. */
      pair: readonly [{ dx: number; dy: number }, { dx: number; dy: number }];
      /** Pair discs are slightly smaller so both fit inside the cell ring. */
      discScale: number;
    };

export interface BlockadeMark {
  key: string;
  badge: string;
  ring: { x: number; y: number; size: number; rx: number; strokeWidth: number };
}

const PAIR_OFFSET = 0.5;
const DISC_SCALE = 0.84;

export function occupancyVisual(stack?: number): OccupancyVisual {
  if (stack == null || stack < 2) return { kind: 'single' };
  return {
    kind: 'blockade',
    count: stack,
    badge: `x${stack}`,
    pair: [
      { dx: PAIR_OFFSET, dy: -PAIR_OFFSET },
      { dx: -PAIR_OFFSET, dy: PAIR_OFFSET },
    ],
    discScale: DISC_SCALE,
  };
}

/** Pink ring follows the track cell's rounded square. */
export function blockadeRingRect(
  row: number,
  col: number,
  cell: number,
): { x: number; y: number; size: number; rx: number; strokeWidth: number } {
  return {
    x: col * cell + 0.5,
    y: row * cell + 0.5,
    size: cell - 1,
    rx: 2.4,
    strokeWidth: 1.8,
  };
}

export function blockadeMarks(
  pieces: ReadonlyArray<{ key: string; count: number; row: number; col: number }>,
  cell: number,
): BlockadeMark[] {
  const marks: BlockadeMark[] = [];
  for (const piece of pieces) {
    const mark = occupancyVisual(piece.count);
    if (mark.kind !== 'blockade') continue;
    marks.push({
      key: piece.key,
      badge: mark.badge,
      ring: blockadeRingRect(piece.row, piece.col, cell),
    });
  }
  return marks;
}
