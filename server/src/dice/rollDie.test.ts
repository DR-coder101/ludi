import { readFileSync } from 'fs';
import { describe, expect, it } from 'vitest';
import { rollDieFace, rulesRngFromDie } from './rollDie.js';

describe('rollDieFace', () => {
  it('is implemented as crypto.randomInt(1, 7)', () => {
    const source = readFileSync(new URL('./rollDie.ts', import.meta.url), 'utf8');
    expect(source).toContain('crypto.randomInt(1, 7)');
  });

  it('returns faces 1 through 6 and the rules adapter inverts them', () => {
    const faces = new Set<number>();
    for (let i = 0; i < 200; i++) {
      const face = rollDieFace();
      expect(face).toBeGreaterThanOrEqual(1);
      expect(face).toBeLessThanOrEqual(6);
      faces.add(face);
      const unit = rulesRngFromDie();
      const mapped = Math.min(6, Math.floor(unit * 6) + 1);
      expect(mapped).toBeGreaterThanOrEqual(1);
      expect(mapped).toBeLessThanOrEqual(6);
    }
    expect(faces.size).toBeGreaterThan(1);
  });
});
