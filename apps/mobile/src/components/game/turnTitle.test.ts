import { describe, expect, it } from 'vitest';
import { antonTitleWidth, turnTitleSize, TURN_TITLE_MAX, TURN_TITLE_WIDTH_PHONE } from './turnTitle';

describe('turnTitleSize', () => {
  it('keeps YOU ROLLED 6 + 2! untruncated in the screens column', () => {
    const title = 'YOU ROLLED 6 + 2!';
    const size = turnTitleSize(title, TURN_TITLE_WIDTH_PHONE);
    expect(antonTitleWidth(title, size)).toBeLessThanOrEqual(TURN_TITLE_WIDTH_PHONE);
    expect(size).toBeGreaterThanOrEqual(16);
  });

  it("leaves IT'S YOUR TURN at the mockup size so board-start does not shift", () => {
    expect(turnTitleSize("IT'S YOUR TURN", TURN_TITLE_WIDTH_PHONE)).toBe(TURN_TITLE_MAX);
  });
});
