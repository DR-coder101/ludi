import { describe, expect, it } from 'vitest';
import {
  ALONG,
  ARM_B,
  ENTRY,
  START,
  TRACK,
  gpos,
  posToPoint,
} from './geometry.js';

describe('wide-track geometry', () => {
  it('keeps 68 track squares and the four starts and lane entries', () => {
    expect(TRACK).toHaveLength(68);
    expect(START).toEqual({ red: 0, green: 17, yellow: 34, blue: 51 });
    expect(ENTRY).toEqual({ red: 66, green: 15, yellow: 32, blue: 49 });
  });

  it('makes the middle three bands wider than the along-arm cells', () => {
    expect(ARM_B).toBeGreaterThan(ALONG);
    expect(gpos(9) - gpos(8)).toBe(ARM_B);
    expect(gpos(1) - gpos(0)).toBe(ALONG);
  });

  it('moves a piece square by square along the track', () => {
    const a = posToPoint('red', { zone: 'track', cell: 0 }, 0);
    const b = posToPoint('red', { zone: 'track', cell: 1 }, 0);
    expect(a).not.toEqual(b);
    expect(a.y).not.toBe(b.y);
  });
});
