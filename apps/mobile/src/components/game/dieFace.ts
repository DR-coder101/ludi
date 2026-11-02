export const DIE_FACES = [1, 2, 3, 4, 5, 6] as const;
export type DieFace = (typeof DIE_FACES)[number];

export const DIE_ROLL_MS = 780;

export const DIE_ROLL_BEATS = {
  drop: 380,
  bounce: 200,
  settle: 200,
} as const;

export const DIE_ROLL_SPIN_DEG = 360;

export function dieRollDegrees(progress: number, dir: 1 | -1): number {
  'worklet';
  return progress * DIE_ROLL_SPIN_DEG * dir;
}

export const DIE_FACE_FILE: Record<DieFace, string> = {
  1: 'face-1.png',
  2: 'face-2.png',
  3: 'face-3.png',
  4: 'face-4.png',
  5: 'face-5.png',
  6: 'face-6.png',
};

export const DIE_PIP_LAYOUT: Record<DieFace, readonly (readonly [number, number])[]> = {
  1: [[0, 0]],
  2: [
    [-0.42, 0.42],
    [0.42, -0.42],
  ],
  3: [
    [-0.42, 0.42],
    [0, 0],
    [0.42, -0.42],
  ],
  4: [
    [-0.42, 0.42],
    [0.42, 0.42],
    [-0.42, -0.42],
    [0.42, -0.42],
  ],
  5: [
    [-0.42, 0.42],
    [0.42, 0.42],
    [0, 0],
    [-0.42, -0.42],
    [0.42, -0.42],
  ],
  6: [
    [-0.42, 0.5],
    [0.42, 0.5],
    [-0.42, 0],
    [0.42, 0],
    [-0.42, -0.5],
    [0.42, -0.5],
  ],
};

export function isDieFace(n: number): n is DieFace {
  return n === 1 || n === 2 || n === 3 || n === 4 || n === 5 || n === 6;
}

export function dieFace(n: number): DieFace {
  return isDieFace(n) ? n : 5;
}
