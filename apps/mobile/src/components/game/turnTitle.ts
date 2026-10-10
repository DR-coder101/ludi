/** Anton units-per-em from the bundled `Anton_400Regular` TTF. */
const UPEM = 2048;

/** Horizontal advances at 2048 UPM for the turn-card alphabet. */
const ADVANCE: Record<string, number> = {
  A: 994,
  B: 980,
  C: 971,
  D: 1010,
  E: 843,
  F: 817,
  G: 993,
  H: 1022,
  I: 464,
  J: 955,
  K: 967,
  L: 814,
  M: 1528,
  N: 1020,
  O: 996,
  P: 967,
  Q: 1011,
  R: 976,
  S: 945,
  T: 810,
  U: 970,
  V: 961,
  W: 1458,
  X: 991,
  Y: 914,
  Z: 840,
  '0': 1012,
  '1': 677,
  '2': 1012,
  '3': 1012,
  '4': 1012,
  '5': 1012,
  '6': 1012,
  '7': 1012,
  '8': 1012,
  '9': 1012,
  ' ': 480,
  '+': 728,
  '!': 469,
  "'": 438,
  '·': 480,
  '.': 468,
  '-': 637,
};

const FALLBACK = 1100;
const TRACK = 0.5;
const SLACK = 4;

export const TURN_TITLE_MAX = 29;
export const TURN_TITLE_MIN = 16;

/**
 * Title box on the 390 screens phone: column minus rails, card border, and
 * turn-card horizontal padding.
 */
export const TURN_TITLE_WIDTH_PHONE = 390 - 2 * (10 + 64 + 10) - 20 - 2;

export function antonTitleWidth(text: string, size: number): number {
  let width = 0;
  for (let i = 0; i < text.length; i++) {
    width += ((ADVANCE[text[i]] ?? FALLBACK) * size) / UPEM;
    if (i < text.length - 1) width += TRACK;
  }
  return width;
}

/** Font size so the full title fits `width` without ellipsis. Works on web. */
export function turnTitleSize(title: string, width: number): number {
  const atMax = antonTitleWidth(title, TURN_TITLE_MAX);
  if (atMax <= width - SLACK) return TURN_TITLE_MAX;
  return Math.max(TURN_TITLE_MIN, Math.floor((TURN_TITLE_MAX * (width - SLACK)) / atMax));
}
