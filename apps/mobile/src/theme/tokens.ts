/**
 * Ludi design tokens — "Jamaican street / dancehall, premium".
 * Values come from the approved design spec (tokens.md, DRAFT v1).
 */
import type { Color } from '@ludi/rules';

export const palette = {
  bg: '#0B0B0C',
  bgTop: '#131315',
  bgBottom: '#0E0E0F',
  ink: '#141416',
  panel: '#18181B',
  yardBase: '#0E0E10',
  surfaceLine: 'rgba(255,255,255,0.08)',
  cream: '#F6EFD9',
  textMuted: 'rgba(246,239,217,0.65)',
  textSoft: 'rgba(246,239,217,0.8)',
  green: '#009B3A',
  greenDeep: '#006B28',
  greenBright: '#19C45A',
  gold: '#FED100',
  goldSoft: '#FFF3A0',
  goldDeep: '#C9A200',
  red: '#E4202E',
  redText: '#FF3340',
  redDeep: '#9E0F1A',
  silver: '#D9DCE1',
  hot: '#FF3B7F',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export type PieceTone = 'gold' | 'green' | 'red' | 'black';

/** Radial piece gradients, light source top-left at 38% / 32%. */
export const pieceGradient: Record<PieceTone, { hi: string; mid: string; lo: string; rim: string }> = {
  gold: { hi: '#FFF3A0', mid: '#FED100', lo: '#A88400', rim: '#FFF8D0' },
  green: { hi: '#7CF2A4', mid: '#0FAE47', lo: '#005C22', rim: '#D8FFE6' },
  red: { hi: '#FF9AA0', mid: '#E4202E', lo: '#7A0710', rim: '#FFE0E2' },
  black: { hi: '#7A7D84', mid: '#26272B', lo: '#050506', rim: '#C9CDD4' },
};

export type Corner = 'TL' | 'TR' | 'BL' | 'BR';
export type PinKey = 'montego' | 'ocho' | 'negril' | 'kingston';

export interface Place {
  /** Poster name, one entry per stacked line. */
  lines: string[];
  full: string;
  short: string;
  tone: PieceTone;
  /** Accent for text, borders and highlights on black. */
  accent: string;
  /** Home-column fill. */
  homeFill: string;
  /** Chevron colour on the home column. */
  chevron: string;
  /** Centre-square edge band where this home column arrives. */
  band: string;
  /** Start-cell disc and the star drawn on it. */
  startDisc: string;
  startMark: string;
  corner: Corner;
  pin: PinKey;
}

/**
 * Engine colour → place. Each place sits in the corner where that engine
 * colour's yard, come-out and home column are on the board geometry
 * (`components/board/boardLayout.ts`); `boardModel.test.ts` pins this.
 */
export const places: Record<Color, Place> = {
  yellow: {
    lines: ['MONTEGO', 'BAY'],
    full: 'Montego Bay',
    short: 'MOBAY',
    tone: 'gold',
    accent: palette.gold,
    homeFill: pieceGradient.gold.mid,
    chevron: palette.bg,
    band: palette.gold,
    startDisc: pieceGradient.gold.mid,
    startMark: palette.bg,
    corner: 'TL',
    pin: 'montego',
  },
  green: {
    lines: ['OCHO', 'RIOS'],
    full: 'Ocho Rios',
    short: 'OCHI',
    tone: 'green',
    accent: palette.greenBright,
    homeFill: pieceGradient.green.mid,
    chevron: palette.white,
    band: palette.greenBright,
    startDisc: pieceGradient.green.mid,
    startMark: palette.white,
    corner: 'TR',
    pin: 'ocho',
  },
  blue: {
    lines: ['NEGRIL'],
    full: 'Negril',
    short: 'NEGRIL',
    tone: 'black',
    accent: palette.silver,
    homeFill: '#232428',
    chevron: palette.silver,
    band: palette.silver,
    startDisc: '#2A2B30',
    startMark: palette.white,
    corner: 'BL',
    pin: 'negril',
  },
  red: {
    lines: ['KINGSTON'],
    full: 'Kingston',
    short: 'KINGSTON',
    tone: 'red',
    accent: palette.redText,
    homeFill: pieceGradient.red.mid,
    chevron: palette.white,
    band: pieceGradient.red.mid,
    startDisc: pieceGradient.red.mid,
    startMark: palette.white,
    corner: 'BR',
    pin: 'kingston',
  },
};

export const ENGINE_COLORS: Color[] = ['red', 'green', 'yellow', 'blue'];

/** Board drawing units: the SVG viewBox is 380×380, 19 cells of 20. */
export const boardGeometry = {
  grid: 19,
  cell: 20,
  viewBox: 380,
  frameBevel: 4,
  frameRadius: 10,
  innerRadius: 6,
  trackPieceRadius: 7.4,
  yardPieceRadius: 9.6,
  homePieceRadius: 5.2,
  /** Track stripes outward from the arm's end cell. */
  stripes: [palette.green, palette.bg, palette.gold, palette.bg],
} as const;

export const fontFamily = {
  display: 'Anton_400Regular',
  body: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
  badge: 'ArchivoBlack_400Regular',
} as const;

export const radius = {
  railButton: 24,
  topButton: 21,
  card: 18,
  pill: 20,
  plate: 14,
} as const;

export const space = {
  screen: 16,
  railWidth: 64,
  railInset: 10,
  gap: 12,
} as const;

export const elevation = {
  card: {
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 13,
    elevation: 10,
  },
  board: {
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 16,
  },
  button: {
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 7,
    elevation: 6,
  },
  goldCta: {
    shadowColor: palette.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
} as const;

export const motion = {
  hopMsPerCell: 110,
  hopScale: 1.08,
  hopLift: 5,
  enterMs: 260,
  enterSpring: { damping: 14, stiffness: 180, mass: 0.8 },
  captureFlightMs: 450,
  slideMs: 220,
  diceTumbleMs: 680,
  diceFaceTickMs: 85,
  diceOvershootMs: 120,
  highlightLoopMs: 900,
  highlightScale: 1.15,
  highlightMinOpacity: 0.4,
  pathStaggerMs: 40,
  pathFadeMs: 160,
  turnGlowLoopMs: 1600,
  pressScale: 0.97,
  pressMs: 90,
  reducedCrossfadeMs: 200,
  timerWarnMs: 5000,
} as const;
