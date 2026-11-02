import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DIE_FACE_FILE,
  DIE_FACES,
  DIE_PIP_LAYOUT,
  DIE_ROLL_BEATS,
  DIE_ROLL_MS,
  dieFace,
  isDieFace,
  type DieFace,
} from './dieFace';

const diceDir = join(process.cwd(), 'assets/dice');

describe('dieFace mapping 1-6', () => {
  it('maps each face to its sprite file and standard pip layout', () => {
    const layout = JSON.parse(readFileSync(join(diceDir, 'pip-layout.json'), 'utf8')) as Record<
      string,
      { count: number; pips: [number, number][] }
    >;
    expect(DIE_FACES).toEqual([1, 2, 3, 4, 5, 6]);
    for (const face of DIE_FACES) {
      expect(DIE_FACE_FILE[face]).toBe(`face-${face}.png`);
      expect(DIE_PIP_LAYOUT[face]).toHaveLength(face);
      expect(layout[String(face)]?.count).toBe(face);
      expect(layout[String(face)]?.pips).toEqual(DIE_PIP_LAYOUT[face]);
      expect(existsSync(join(diceDir, DIE_FACE_FILE[face]))).toBe(true);
      expect(existsSync(join(diceDir, `face-${face}@2x.png`))).toBe(true);
      expect(existsSync(join(diceDir, `face-${face}@3x.png`))).toBe(true);
    }
    expect(DIE_PIP_LAYOUT[1]).toEqual([[0, 0]]);
    expect(DIE_PIP_LAYOUT[2]).toEqual([
      [-0.42, 0.42],
      [0.42, -0.42],
    ]);
    expect(DIE_PIP_LAYOUT[3]).toEqual([
      [-0.42, 0.42],
      [0, 0],
      [0.42, -0.42],
    ]);
    expect(DIE_PIP_LAYOUT[4]).toEqual([
      [-0.42, 0.42],
      [0.42, 0.42],
      [-0.42, -0.42],
      [0.42, -0.42],
    ]);
    expect(DIE_PIP_LAYOUT[5]).toEqual([
      [-0.42, 0.42],
      [0.42, 0.42],
      [0, 0],
      [-0.42, -0.42],
      [0.42, -0.42],
    ]);
    expect(DIE_PIP_LAYOUT[6]).toEqual([
      [-0.42, 0.5],
      [0.42, 0.5],
      [-0.42, 0],
      [0.42, 0],
      [-0.42, -0.5],
      [0.42, -0.5],
    ]);
  });

  it('keeps an unknown value off the board by falling back to 5', () => {
    expect(dieFace(0)).toBe(5);
    expect(dieFace(7)).toBe(5);
    expect(isDieFace(3)).toBe(true);
    expect(isDieFace(0)).toBe(false);
    const faces: DieFace[] = [1, 2, 3, 4, 5, 6];
    expect(faces.map(dieFace)).toEqual(faces);
  });
});

describe('die roll beats', () => {
  it('covers the roll clip in three beats inside 600-800ms', () => {
    expect(DIE_ROLL_BEATS.drop + DIE_ROLL_BEATS.bounce + DIE_ROLL_BEATS.settle).toBe(DIE_ROLL_MS);
    expect(DIE_ROLL_MS).toBeGreaterThanOrEqual(600);
    expect(DIE_ROLL_MS).toBeLessThanOrEqual(800);
    expect(Math.abs(DIE_ROLL_MS - 784)).toBeLessThanOrEqual(30);
  });
});
