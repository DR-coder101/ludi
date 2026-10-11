import { computePath, type Color, type TokenPos } from '@ludi/rules';

export function stepsPath(from: TokenPos, steps: number, color: Color): TokenPos[] {
  if (from.zone === 'yard') {
    const dest = computePath(from, 1, color);
    return dest ? [dest] : [];
  }
  const out: TokenPos[] = [];
  for (let i = 1; i <= steps; i += 1) {
    const pos = computePath(from, i, color);
    if (pos) out.push(pos);
  }
  return out;
}

export function pieceArrayIndex(
  tokens: readonly { color: Color; index: 0 | 1 | 2 | 3 }[],
  color: Color,
  piece: 1 | 2 | 3 | 4,
): number {
  return tokens.findIndex((t) => t.color === color && t.index === piece - 1);
}
