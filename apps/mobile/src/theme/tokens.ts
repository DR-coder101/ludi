/**
 * Ludi design tokens: "Jamaican street / dancehall, premium".
 * Values come from the approved design pack (tokens.md, build/lib.js, build/board.html).
 */
import type { Color as EngineColor } from '@ludi/rules';

export const color = {
  bg: '#0B0B0C',
  ink: '#141416',
  yard: '#0E0E10',
  line: 'rgba(255,255,255,0.08)',
  cream: '#F6EFD9',
  creamSoft: 'rgba(246,239,217,0.8)',
  creamMuted: 'rgba(246,239,217,0.78)',
  green: '#009B3A',
  greenDeep: '#006B28',
  greenBright: '#19C45A',
  gold: '#FED100',
  goldDeep: '#C9A200',
  /** Gold CTA gradient end. */
  goldCta: '#E0B800',
  goldLight: '#FFF3A0',
  goldHot: '#FFE45C',
  red: '#E4202E',
  redText: '#FF3340',
  redDeep: '#9E0F1A',
  silver: '#D9DCE1',
  hot: '#FF3B7F',
  white: '#FFFFFF',
} as const;

/** Piece colours as drawn; engine ids map onto these via PLACES. */
export type PieceColor = 'gold' | 'green' | 'red' | 'black';

/** Radial piece gradients, light source top-left at 38%/32%. */
export const piece: Record<PieceColor, { hi: string; mid: string; lo: string; rim: string }> = {
  gold: { hi: '#FFF3A0', mid: '#FED100', lo: '#A88400', rim: '#FFF8D0' },
  green: { hi: '#7CF2A4', mid: '#0FAE47', lo: '#005C22', rim: '#D8FFE6' },
  red: { hi: '#FF9AA0', mid: '#E4202E', lo: '#7A0710', rim: '#FFE0E2' },
  black: { hi: '#7A7D84', mid: '#26272B', lo: '#050506', rim: '#C9CDD4' },
};

/** Accent used for text, frames and borders per piece colour. */
export const accent: Record<PieceColor, string> = {
  gold: color.gold,
  green: color.greenBright,
  red: color.redText,
  black: color.silver,
};

export type Corner = 'TL' | 'TR' | 'BL' | 'BR';
export type PinKey = 'negril' | 'montego' | 'ocho' | 'kingston';

export interface Place {
  /** Poster lines for the yard heading. */
  lines: string[];
  full: string;
  short: string;
  piece: PieceColor;
  corner: Corner;
  pin: PinKey;
}

/** Engine colour → place. Corners follow the engine start cells on the 68-cell track. */
export const PLACES: Record<EngineColor, Place> = {
  yellow: { lines: ['MONTEGO', 'BAY'], full: 'Montego Bay', short: 'MOBAY', piece: 'gold', corner: 'TL', pin: 'montego' },
  green: { lines: ['OCHO', 'RIOS'], full: 'Ocho Rios', short: 'OCHI', piece: 'green', corner: 'TR', pin: 'ocho' },
  blue: { lines: ['NEGRIL'], full: 'Negril', short: 'NEGRIL', piece: 'black', corner: 'BL', pin: 'negril' },
  red: { lines: ['KINGSTON'], full: 'Kingston', short: 'KINGSTON', piece: 'red', corner: 'BR', pin: 'kingston' },
};

/** Player-strip order in the mockup: Kingston, Ocho Rios, Montego Bay, Negril (engine turn order). */
export const TURN_ORDER: EngineColor[] = ['red', 'green', 'yellow', 'blue'];

export const font = {
  display: 'Anton_400Regular',
  sticker: 'ArchivoBlack_400Regular',
  body: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
} as const;

export const motion = {
  /** Piece hop, per cell. */
  hopMs: 110,
  hopScale: 1.08,
  /** Legal-move ring pulse loop. */
  pulseMs: 900,
  /** Current-turn yard frame breathing loop. */
  breatheMs: 1600,
  pressScale: 0.97,
  pressMs: 90,
  /** Dice tumble before the face settles. */
  diceRollMs: 650,
  /** Home speaker cone: kick out, decay, rest (one cycle ≈ 1.25 s, half-time at ~96 BPM). */
  kickMs: 90,
  kickDecayMs: 420,
  kickRestMs: 740,
  kickScale: 0.014,
  /** Home vinyl ring, one full turn. */
  vinylTurnMs: 40000,
} as const;

export const layout = {
  topBarHeight: 56,
  topBarGap: 12,
  boardInset: 4,
  boardBevel: 4,
  boardGap: 18,
  railWidth: 64,
  railInset: 10,
  railGap: 14,
  railButton: 48,
  topButton: 42,
  turnCardHeight: 172,
  stripGap: 12,
  /** Rails + turn card + player strip + equaliser. */
  lowerHeight: 280,
} as const;
