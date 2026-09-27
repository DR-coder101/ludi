/**
 * Dancehall Premium Design Tokens - APPROVED SPEC
 * 
 * Jamaican place names mapped to engine colors by board corner:
 * - MONTEGO BAY (Gold): Top-left → engine 'yellow'
 * - OCHO RIOS (Green): Top-right → engine 'green'
 * - KINGSTON (Red): Bottom-right → engine 'red'
 * - NEGRIL (Black/Silver): Bottom-left → engine 'blue'
 */

export type PlaceName = 'MONTEGO BAY' | 'OCHO RIOS' | 'NEGRIL' | 'KINGSTON';
export type EngineColor = 'red' | 'green' | 'yellow' | 'blue';

/**
 * Place-to-engine color mapping (DO NOT CHANGE - matches board geometry)
 */
export const PLACE_NAMES: Record<EngineColor, PlaceName> = {
  yellow: 'MONTEGO BAY',   // Top-left yard (row 0-7, col 0-7)
  green: 'OCHO RIOS',       // Top-right yard (row 0-7, col 11-18)
  blue: 'NEGRIL',           // Bottom-left yard (row 11-18, col 0-7)
  red: 'KINGSTON',          // Bottom-right yard (row 11-18, col 11-18)
};

/**
 * Geographic coordinates for place pins
 */
export const PLACE_PINS: Record<PlaceName, { lat: number; lon: number }> = {
  'NEGRIL': { lat: 18.268, lon: -78.348 },
  'MONTEGO BAY': { lat: 18.476, lon: -77.893 },
  'OCHO RIOS': { lat: 18.407, lon: -77.103 },
  'KINGSTON': { lat: 17.997, lon: -76.794 },
};

/**
 * Color Palette - Dancehall Premium
 */
export const colors = {
  // Base colors
  bg: '#0B0B0C',
  surface: '#141416',           // Gradient start
  surfaceEnd: '#18181B',        // Gradient end (for cards, rails)
  surfaceLine: 'rgba(255,255,255,0.08)',
  
  // Text
  cream: '#F6EFD9',             // Primary text, board grid lines at 75%
  textMuted: 'rgba(246,239,217,0.65)',
  
  // Jamaican colors
  green: '#009B3A',
  greenDeep: '#006B28',         // Hard poster shadow
  greenBright: '#19C45A',       // Ocho Rios text on black
  gold: '#FED100',              // CTA, wordmark
  goldDeep: '#C9A200',          // CTA gradient end
  red: '#E4202E',
  redText: '#FF3340',           // Red text variant
  silver: '#D9DCE1',            // Negril accent
  
  // Hot pink (limited use: LIVE badge, unread, +6 tag, stickers, capture burst - under 3%)
  hot: '#FF3B7F',
  
  // Place piece colors
  places: {
    montegoGold: '#FED100',     // Montego Bay pieces
    ochoGreen: '#0FAE47',       // Ocho Rios pieces
    kingstonRed: '#E4202E',     // Kingston pieces
    negrilBlack: '#26272B',     // Negril pieces
  },
  
  // Piece gradients (radial, centre 38%/32%, r 75%, stops 0/.45/1)
  pieceGradients: {
    gold: {
      colors: ['#FFF3A0', '#FED100', '#A88400'],
      rim: '#FFF8D0',
      mid: '#FED100', // For base circle
    },
    green: {
      colors: ['#7CF2A4', '#0FAE47', '#005C22'],
      rim: '#D8FFE6',
      mid: '#0FAE47',
    },
    red: {
      colors: ['#FF9AA0', '#E4202E', '#7A0710'],
      rim: '#FFE0E2',
      mid: '#E4202E',
    },
    black: {
      colors: ['#7A7D84', '#26272B', '#050506'],
      rim: '#C9CDD4',
      mid: '#26272B',
    },
  },
  
  // Board colors (for track cells)
  trackGreen: '#009B3A',        // Green track cells
  trackBlack: '#0B0B0C',        // Black track cells
  trackGold: '#FED100',         // Gold track cells
  
  // Home strip colors (solid fills)
  homeStrips: {
    gold: '#FED100',            // Montego Bay home column
    green: '#0FAE47',           // Ocho Rios home column
    red: '#E4202E',             // Kingston home column
    negril: '#232428',          // Negril home column (darker black)
  },
  
  // Yard base and accents
  yardBase: '#0E0E10',
  
  // Centre colors
  centreGreen: '#009B3A',       // Top/bottom triangles
  centreBlack: '#0B0B0C',       // Left/right triangles
  centreGoldStroke: '#FED100',  // X stroke and top band
  centreRed: '#E4202E',         // Bottom band
  centreSilver: '#D9DCE1',      // Left band
  centreGreenBright: '#19C45A', // Right band
  
  // UI elements
  videoBg: '#4a4b50',
  videoBgEnd: '#2a2b2f',
  videoIcon: '#45464c',
  slotEmpty: 'rgba(0,0,0,0.45)', // Empty home slot fill
  
  // Shadows
  shadowBlack: 'rgba(0,0,0,0.55)',
  shadowDark: 'rgba(0,0,0,0.45)',
} as const;

/**
 * Typography - Expo Google Fonts
 */
export const typography = {
  fonts: {
    display: 'Anton_400Regular',          // Display text (uppercase, tracking +0.5 to 2)
    body: 'Inter_400Regular',             // Body text (12-13 at weight 500)
    bodySemiBold: 'Inter_600SemiBold',    // Labels (600-700)
    bodyBold: 'Inter_700Bold',            // Labels (600-700)
    sticker: 'ArchivoBlack_400Regular',   // Stickers, badges, pills (8-13 uppercase, tracking 1-3)
  },
  
  sizes: {
    // Display (Anton)
    displayHero: 168,         // LUDI wordmark
    displayLarge: 64,         // Place names on win card
    displayMedium: 48,
    displaySmall: 36,
    
    // Stickers & badges (Archivo Black)
    stickerLarge: 13,
    stickerMedium: 11,
    stickerSmall: 8,
    
    // Body (Inter)
    bodyLarge: 13,
    bodyMedium: 12,
    bodySmall: 11,
    caption: 10,
  },
  
  // Letter spacing (tracking)
  letterSpacing: {
    displayTight: 0.5,
    displayNormal: 1,
    displayWide: 2,
    stickerNormal: 1,
    stickerWide: 2,
    stickerWidest: 3,
  },
  
  // Display shadow (Anton text)
  displayShadow: {
    color: '#006B28',         // greenDeep
    offset: { width: 2, height: 2 },  // 2-9px based on size
    blur: 0,                  // Hard shadow
  },
  
  // Sticker shadow (Archivo Black)
  stickerShadow: {
    color: '#000000',
    offset: { width: 2, height: 3 },  // Hard offset shadow
    blur: 0,
  },
} as const;

/**
 * Spacing (screen padding 16, gaps 10-12)
 */
export const spacing = {
  screenPadding: 16,
  gapSmall: 10,
  gapMedium: 12,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

/**
 * Border radius
 */
export const radii = {
  card: 18,               // Cards (18-20)
  cardLarge: 20,
  winnerCard: 24,         // Winner card
  button: 14,             // Buttons (14-18)
  buttonLarge: 18,
  pill: 9999,             // Pills (fully round)
  railButton: 24,         // 48pt circles (r=24)
  topBarButton: 21,       // 42pt circles (r=21)
  yardFrame: 9,           // Yard frame corners
  yardInner: 6.5,         // Yard dashed rect
  videoTile: 7,           // Video tile in yard
} as const;

/**
 * Button and icon sizes
 */
export const sizes = {
  railButton: 48,         // Rail icon buttons (circles)
  topBarButton: 42,       // Top bar buttons (circles)
} as const;

/**
 * Shadows
 */
export const shadows = {
  gold: {
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
  },
  dice: {
    shadowColor: 'rgba(0,0,0,0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
} as const;

/**
 * Board geometry (19x19 grid) - DO NOT CHANGE
 */
export const board = {
  gridSize: 19,
  yardSize: 8,        // 8x8 corners
  armWidth: 3,        // 3-wide arms
  armLength: 8,       // 8-long arms (home columns are 7 cells)
  centerSize: 3,      // 3x3 center
  
  // Cell size in viewBox units (380x380 viewBox, cell=20)
  viewBoxSize: 380,
  cellSize: 20,
  
  trackLength: 52,    // Total track cells (unchanged)
  homeColumnLength: 7, // Home stretch cells (r1..7, r11..17, c1..7, c11..17)
  
  // Start cell coordinates (come-out positions - DO NOT CHANGE)
  // These map to engine color indices
  startCells: {
    red: 0,       // Kingston (bottom-right yard)
    green: 13,    // Ocho Rios (top-right yard)
    yellow: 26,   // Montego Bay (top-left yard)
    blue: 39,     // Negril (bottom-left yard)
  },
} as const;

/**
 * Motion & Animation durations (ms)
 */
export const motion = {
  // Piece slide
  slidePerCell: 110,        // 110ms per cell
  slideEase: 'easeOutQuad',
  slideBounce: 1.08,        // Mid-hop bounce scale
  
  // Entry animation
  entryDuration: 260,       // Spring animation
  entryDamping: 14,
  
  // Dice
  diceDurationMin: 600,
  diceDurationMax: 750,
  diceOvershoot: 120,       // ms overshoot after land
  
  // Pulses
  legalMovePulse: 900,      // Gold ring pulse loop
  yardGlowBreath: 1600,     // Current turn yard glow
  
  // Capture
  captureBurst: 350,
  captureArc: 450,
  
  // Win
  winSlam: 280,             // Card slam spring
  winSlamScale: 1.15,       // Initial scale
  winConfetti: 2500,
  winStickerDelay: 200,
  winRaysRotation: 40000,   // 40s per full rotation
  
  // Buttons
  buttonPress: 90,
  buttonScale: 0.97,
  
  // Reduce Motion fallback
  crossFade: 200,           // Cross-fade instead of animations
} as const;

/**
 * Haptics patterns (expo-haptics)
 */
export const haptics = {
  light: 'light',             // Per landing
  medium: 'medium',           // Roll selection, entry track
  heavy: 'heavy',             // Capture
  success: 'success',         // Dice 6, piece home, win
  warning: 'warning',         // Blocked move
} as const;

/**
 * Sticker rotation range (degrees)
 */
export const stickerRotation = {
  min: -7,
  max: 12,
} as const;

/**
 * Texture settings
 */
export const textures = {
  filmGrain: {
    enabled: true,
    opacity: 0.05,
  },
  halftone: {
    enabled: true,
    gridSize: 6,          // 6pt grid
    dotRadius: 1.1,       // 1.1pt dot
  },
} as const;

/**
 * Legacy token aliases for backwards compatibility
 * TODO: Migrate all callsites to use the real tokens above
 */
export const legacyTokens = {
  // Map old names to new tokens
  accent: colors.gold,
  background: colors.bg,
  textPrimary: colors.cream,
  textSecondary: colors.textMuted,
  textTertiary: 'rgba(246,239,217,0.5)',
  textOnAccent: colors.bg,
  surfaceElevated: colors.surfaceEnd,
} as const;

// Merge legacy tokens into colors for compatibility
Object.assign(colors, legacyTokens);

/**
 * Helper functions
 */

export function getPlaceColor(engineColor: EngineColor): string {
  const colorMap: Record<EngineColor, string> = {
    yellow: colors.places.montegoGold,
    green: colors.places.ochoGreen,
    blue: colors.places.negrilBlack,
    red: colors.places.kingstonRed,
  };
  return colorMap[engineColor];
}

export function getPlaceAccent(engineColor: EngineColor): string {
  // Negril gets silver accent, others use place color
  if (engineColor === 'blue') {
    return colors.silver;
  }
  // Montego Bay, Ocho Rios, Kingston use their piece colors as accents
  const accentMap: Record<EngineColor, string> = {
    yellow: colors.gold,
    green: colors.greenBright,
    red: colors.redText,
    blue: colors.silver, // Already handled above
  };
  return accentMap[engineColor];
}

export function getPieceGradient(engineColor: EngineColor) {
  const gradientMap = {
    yellow: colors.pieceGradients.gold,
    green: colors.pieceGradients.green,
    blue: colors.pieceGradients.black,
    red: colors.pieceGradients.red,
  };
  return gradientMap[engineColor];
}

export function getHomeStripColor(engineColor: EngineColor): string {
  const stripMap: Record<EngineColor, string> = {
    yellow: colors.homeStrips.gold,
    green: colors.homeStrips.green,
    blue: colors.homeStrips.negril,
    red: colors.homeStrips.red,
  };
  return stripMap[engineColor];
}

/**
 * Get track cell fill color based on outer index
 * Track fill = [green, black, gold, black][outerIndex % 4]
 */
export function getTrackCellColor(outerIndex: number): string {
  const pattern = [colors.trackGreen, colors.trackBlack, colors.trackGold, colors.trackBlack];
  return pattern[outerIndex % 4];
}
