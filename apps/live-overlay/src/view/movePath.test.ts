import { describe, expect, it } from 'vitest';
import type { TokenPos } from '@ludi/rules';
import { applyMovedToPieces, framesForMovedPath, stepAt } from './movePath.js';

const path: TokenPos[] = [
  { zone: 'track', cell: 0 },
  { zone: 'track', cell: 1 },
  { zone: 'track', cell: 2 },
  { zone: 'track', cell: 3 },
];

describe('framesForMovedPath', () => {
  it('keeps every square the server sent, in order', () => {
    expect(framesForMovedPath(path)).toEqual(path);
  });

  it('does not invent a start square the server omitted', () => {
    expect(framesForMovedPath([{ zone: 'track', cell: 17 }])).toEqual([{ zone: 'track', cell: 17 }]);
  });
});

describe('stepAt', () => {
  it('clamps to the first and last square', () => {
    expect(stepAt(path, -1)).toEqual({ zone: 'track', cell: 0 });
    expect(stepAt(path, 1)).toEqual({ zone: 'track', cell: 1 });
    expect(stepAt(path, 99)).toEqual({ zone: 'track', cell: 3 });
  });

  it('returns null for an empty path', () => {
    expect(stepAt([], 0)).toBeNull();
  });
});

describe('applyMovedToPieces', () => {
  const pieces = [
    { key: 'red-0', color: 'red' as const, town: 'kingston' as const, tokenIndex: 0, pos: { zone: 'track' as const, cell: 3 } },
    { key: 'green-0', color: 'green' as const, town: 'ochoRios' as const, tokenIndex: 0, pos: { zone: 'track' as const, cell: 20 } },
  ];

  it('walks the matching token along the server path and leaves others still', () => {
    const moved = {
      type: 'moved' as const,
      userId: 'dave',
      tokenIndex: 0,
      path,
    };
    const mid = applyMovedToPieces(pieces, moved, 1);
    expect(mid[0]?.pos).toEqual({ zone: 'track', cell: 1 });
    expect(mid[1]?.pos).toEqual({ zone: 'track', cell: 20 });
    expect(applyMovedToPieces(pieces, moved, 99)[0]?.pos).toEqual({ zone: 'track', cell: 3 });
  });
});
