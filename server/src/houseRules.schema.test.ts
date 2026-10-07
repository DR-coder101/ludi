import { describe, expect, it } from 'vitest';
import { HouseRulesSchema } from '@ludi/protocol';

const valid = {
  maxConsecutiveSixes: 2 as const,
  extraRollOnCapture: false,
  exactFinishBonus: false,
  playForPlacements: false,
};

describe('HouseRulesSchema blockadeCanMoveTogether', () => {
  it('defaults an omitted flag to false', () => {
    const parsed = HouseRulesSchema.parse(valid);
    expect(parsed.blockadeCanMoveTogether).toBe(false);
  });

  it('accepts an explicit false', () => {
    const parsed = HouseRulesSchema.parse({ ...valid, blockadeCanMoveTogether: false });
    expect(parsed.blockadeCanMoveTogether).toBe(false);
  });

  it('coerces true to false', () => {
    const parsed = HouseRulesSchema.parse({ ...valid, blockadeCanMoveTogether: true });
    expect(parsed.blockadeCanMoveTogether).toBe(false);
  });
});
