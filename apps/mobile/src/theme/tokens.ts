/**
 * Dancehall Premium Design Tokens
 * 
 * Jamaican-inspired color palette with place names:
 * - MONTEGO BAY: Gold (top-left corner)
 * - OCHO RIOS: Green (top-right corner)
 * - NEGRIL: Black with silver accent (bottom-left corner)
 * - KINGSTON: Red (bottom-right corner)
 */

export type PlaceName = 'MONTEGO BAY' | 'OCHO RIOS' | 'NEGRIL' | 'KINGSTON';
export type EngineColor = 'red' | 'green' | 'yellow' | 'blue';

/**
 * Place-to-corner mapping (board geometry):
 * Top-left (yellow in engine) → MONTEGO BAY (gold)
 * Top-right (green in engine) → OCHO RIOS (green)
 * Bottom-left (blue in engine) → NEGRIL (black/silver)
 * Bottom-right (red in engine) → KINGSTON (red)
 */
export const PLACE_NAMES: Record<EngineColor, PlaceName> = {
  yellow: 'MONTEGO BAY',   // Top-left yard
  green: 'OCHO RIOS',       // Top-right yard
  blue: 'NEGRIL',           // Bottom-left yard
  red: 'KINGSTON',          // Bottom-right yard
};

/**
 * Color Palette - Dancehall vibrant aesthetic
 */
export const colors = {
  // Primary colors - Jamaican places
  montegoGold: '#FFD700',      // Montego Bay - bright gold
  ochoGreen: '#00FF00',        // Ocho Rios - vibrant green
  negrilBlack: '#0A0A0A',      // Negril - deep black
  negrilSilver: '#C0C0C0',     // Negril accent - silver
  kingstonRed: '#FF0000',      // Kingston - bright red
  
  // Piece colors (matches engine colors for clarity)
  pieces: {
    yellow: '#FFD700',         // Montego Bay pieces (gold)
    green: '#00FF00',          // Ocho Rios pieces (green)
    blue: '#0A0A0A',           // Negril pieces (black)
    red: '#FF0000',            // Kingston pieces (red)
  },
  
  // Board colors
  boardBg: '#1A0F0A',          // Dark brown (plywood texture base)
  trackCell: '#2A1810',        // Track cell brown
  safeCell: '#FFD700',         // Gold safe cells
  startCell: '#FF6B00',        // Orange start cells (come-out)
  homeStretch: '#8B4513',      // Saddle brown home columns
  centerBg: '#000000',         // Black center
  
  // UI colors
  background: '#0D0D0D',       // App background (near black)
  surface: '#1A1A1A',          // Card surfaces
  surfaceElevated: '#252525',  // Elevated surfaces
  
  // Accent & semantic
  accent: '#FFD700',           // Gold accent
  accentSecondary: '#00FF00',  // Green accent
  success: '#00FF00',          // Green
  error: '#FF0000',            // Red
  warning: '#FFD700',          // Gold
  info: '#00BFFF',             // Deep sky blue
  
  // Text
  textPrimary: '#FFFFFF',      // White
  textSecondary: '#B3B3B3',    // Light gray
  textTertiary: '#737373',     // Medium gray
  textOnAccent: '#000000',     // Black text on gold
  
  // Borders & dividers
  border: '#333333',           // Dark gray
  borderLight: '#4D4D4D',      // Medium dark gray
  divider: '#262626',          // Very dark gray
  
  // Overlay & shadows
  overlay: 'rgba(0, 0, 0, 0.7)',
  shadowDark: 'rgba(0, 0, 0, 0.5)',
  shadowGold: 'rgba(255, 215, 0, 0.3)',
  
  // Video & live
  liveRed: '#FF0000',          // LIVE badge
  videoOverlay: 'rgba(0, 0, 0, 0.6)',
} as const;

/**
 * Typography - Anton (display), Archivo Black (headings), Inter (body)
 */
export const typography = {
  fonts: {
    display: 'Anton_400Regular',          // Big bold headers
    heading: 'ArchivoBlack_400Regular',   // Section headers
    body: 'Inter_400Regular',             // Body text
    bodySemiBold: 'Inter_600SemiBold',    // Emphasized body
    bodyBold: 'Inter_700Bold',            // Strong emphasis
  },
  
  sizes: {
    displayLarge: 64,      // Hero text
    displayMedium: 48,     // Main title
    displaySmall: 36,      // Section title
    
    headingLarge: 32,      // Large heading
    headingMedium: 24,     // Medium heading
    headingSmall: 20,      // Small heading
    
    bodyLarge: 18,         // Large body
    bodyMedium: 16,        // Medium body
    bodySmall: 14,         // Small body
    caption: 12,           // Caption text
    tiny: 10,              // Tiny labels
  },
  
  lineHeights: {
    tight: 1.1,
    normal: 1.5,
    relaxed: 1.75,
  },
  
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
    widest: 2,
  },
} as const;

/**
 * Spacing scale (8px base unit)
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
} as const;

/**
 * Border radius
 */
export const radii = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

/**
 * Shadows
 */
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  gold: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
} as const;

/**
 * Board geometry (19x19 grid)
 */
export const board = {
  gridSize: 19,
  yardSize: 8,        // 8x8 corners
  armWidth: 3,        // 3-wide arms
  armLength: 8,       // 8-long arms
  centerSize: 3,      // 3x3 center
  
  trackLength: 52,    // Total track cells
  homeColumnLength: 6, // Home stretch cells
  
  // Start cell indices
  startCells: {
    red: 0,
    green: 13,
    yellow: 26,
    blue: 39,
  },
  
  // Safe cell indices
  safeCells: [0, 8, 13, 21, 26, 34, 39, 47],
} as const;

/**
 * Motion & Animation
 */
export const motion = {
  // Durations (ms)
  instant: 0,
  fast: 150,
  normal: 300,
  slow: 500,
  slower: 700,
  slowest: 1000,
  
  // Easing curves
  easing: {
    linear: [0, 0, 1, 1],
    easeIn: [0.4, 0, 1, 1],
    easeOut: [0, 0, 0.2, 1],
    easeInOut: [0.4, 0, 0.2, 1],
    bounce: [0.68, -0.55, 0.265, 1.55],
  },
  
  // Animation config
  pieceSlide: {
    duration: 400,
    stagger: 80,  // Delay between path segments
  },
  
  diceRoll: {
    duration: 600,
    rotations: 3,
  },
  
  captureBurst: {
    duration: 500,
    scale: 1.5,
  },
  
  yardPulse: {
    duration: 1000,
    scale: 1.05,
    repeat: true,
  },
  
  movablePulse: {
    duration: 1200,
    ringScale: 1.3,
    opacity: 0.6,
    repeat: true,
  },
  
  winCelebration: {
    duration: 2000,
    confettiCount: 50,
  },
} as const;

/**
 * Haptics patterns
 */
export const haptics = {
  roll: 'impactMedium',           // Dice roll
  move: 'impactLight',            // Token move
  capture: 'notificationSuccess', // Capture opponent
  blocked: 'notificationWarning', // Illegal move
  win: 'notificationSuccess',     // Win game
} as const;

/**
 * Texture & effects
 */
export const textures = {
  plywood: {
    // SVG pattern or image for plywood board texture
    enabled: true,
    opacity: 0.15,
  },
  
  grain: {
    // Noise grain for dancehall aesthetic
    enabled: true,
    opacity: 0.05,
  },
  
  gradient: {
    // Radial gradient from center
    enabled: true,
    colors: ['rgba(255, 215, 0, 0.1)', 'transparent'],
  },
} as const;

/**
 * Helper function to get place color
 */
export function getPlaceColor(engineColor: EngineColor): string {
  const colorMap: Record<EngineColor, string> = {
    yellow: colors.montegoGold,
    green: colors.ochoGreen,
    blue: colors.negrilBlack,
    red: colors.kingstonRed,
  };
  return colorMap[engineColor];
}

/**
 * Helper function to get place accent (for borders, highlights)
 */
export function getPlaceAccent(engineColor: EngineColor): string {
  // Negril gets silver accent, others use same color
  if (engineColor === 'blue') {
    return colors.negrilSilver;
  }
  return getPlaceColor(engineColor);
}
