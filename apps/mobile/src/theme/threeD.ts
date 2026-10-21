export type Button3DTone = 'gold' | 'dark' | 'green';
export type Card3DTone = 'gold' | 'green' | 'carbon';

export interface FaceStop {
  offset: string;
  color: string;
}

export interface Button3DRecipe {
  face: readonly FaceStop[];
  border: string;
  lip: string;
  lipRest: number;
  lipPressed: number;
  pressY: number;
  glow: string;
  glowColor: string;
  glowY: number;
  glowBlur: number;
  glowOpacity: number;
  highlight: string;
  radius: number;
}

export interface Card3DRecipe {
  face: readonly FaceStop[];
  axis: 'br' | 'r';
  border: string;
  borderWidth: number;
  radius: number;
  padding: number;
  lip: string | null;
  lipRest: number;
  glow: string;
  glowColor: string;
  glowY: number;
  glowBlur: number;
  glowOpacity: number;
  highlight: string;
}

export const BUTTON_3D_PRESS_MS = 80;

export const BUTTON_3D: Record<Button3DTone, Button3DRecipe> = {
  gold: {
    face: [
      { offset: '0%', color: '#FEF08A' },
      { offset: '50%', color: '#FCD34D' },
      { offset: '100%', color: '#FBBF24' },
    ],
    border: '#FEF9C3',
    lip: '#B58600',
    lipRest: 6,
    lipPressed: 1,
    pressY: 4,
    glow: '0 10px 20px rgba(255, 208, 0, 0.35)',
    glowColor: '#FFD000',
    glowY: 10,
    glowBlur: 20,
    glowOpacity: 0.35,
    highlight: 'rgba(255, 255, 255, 0.3)',
    radius: 16,
  },
  dark: {
    face: [
      { offset: '0%', color: '#18181B' },
      { offset: '100%', color: '#000000' },
    ],
    border: 'rgba(251, 191, 36, 0.5)',
    lip: '#0B0E11',
    lipRest: 6,
    lipPressed: 1,
    pressY: 4,
    glow: '0 10px 20px rgba(0,0,0,0.6)',
    glowColor: '#000000',
    glowY: 10,
    glowBlur: 20,
    glowOpacity: 0.6,
    highlight: 'rgba(255, 255, 255, 0.3)',
    radius: 16,
  },
  green: {
    face: [
      { offset: '0%', color: '#34D399' },
      { offset: '100%', color: '#047857' },
    ],
    border: 'rgba(167, 243, 208, 0.4)',
    lip: '#006028',
    lipRest: 5,
    lipPressed: 1,
    pressY: 4,
    glow: '0 8px 18px rgba(0, 176, 79, 0.4)',
    glowColor: '#00B04F',
    glowY: 8,
    glowBlur: 18,
    glowOpacity: 0.4,
    highlight: 'rgba(255, 255, 255, 0.3)',
    radius: 16,
  },
};

export const CARD_3D: Record<Card3DTone, Card3DRecipe> = {
  gold: {
    face: [
      { offset: '0%', color: '#FFD000' },
      { offset: '45%', color: '#FACC15' },
      { offset: '100%', color: '#F59E0B' },
    ],
    axis: 'br',
    border: 'rgba(254, 240, 138, 0.9)',
    borderWidth: 2,
    radius: 24,
    padding: 16,
    lip: null,
    lipRest: 0,
    glow: '0 12px 28px rgba(255, 208, 0, 0.35)',
    glowColor: '#FFD000',
    glowY: 12,
    glowBlur: 28,
    glowOpacity: 0.35,
    highlight: 'rgba(255, 255, 255, 0.28)',
  },
  green: {
    face: [
      { offset: '0%', color: '#0d1f14' },
      { offset: '50%', color: '#102419' },
      { offset: '100%', color: '#0a1510' },
    ],
    axis: 'r',
    border: 'rgba(16, 185, 129, 0.8)',
    borderWidth: 2,
    radius: 16,
    padding: 14,
    lip: '#006028',
    lipRest: 5,
    glow: '0 8px 18px rgba(0, 176, 79, 0.4)',
    glowColor: '#00B04F',
    glowY: 8,
    glowBlur: 18,
    glowOpacity: 0.4,
    highlight: 'rgba(255, 255, 255, 0.16)',
  },
  carbon: {
    face: [
      { offset: '0%', color: '#18181B' },
      { offset: '100%', color: '#121214' },
    ],
    axis: 'br',
    border: '#27272A',
    borderWidth: 1,
    radius: 16,
    padding: 12,
    lip: null,
    lipRest: 0,
    glow: '0 10px 20px rgba(0,0,0,0.45)',
    glowColor: '#000000',
    glowY: 10,
    glowBlur: 20,
    glowOpacity: 0.45,
    highlight: 'rgba(255, 255, 255, 0.08)',
  },
};

export function button3DShadow(tone: Button3DTone, pressed: boolean): string {
  const recipe = BUTTON_3D[tone];
  const lip = pressed ? `0 ${recipe.lipPressed}px 0 0 ${recipe.lip}` : `0 ${recipe.lipRest}px 0 0 ${recipe.lip}`;
  if (pressed) return lip;
  return `${lip}, ${recipe.glow}`;
}

export function card3DShadow(tone: Card3DTone): string {
  const recipe = CARD_3D[tone];
  if (recipe.lip) return `0 ${recipe.lipRest}px 0 0 ${recipe.lip}, ${recipe.glow}`;
  return recipe.glow;
}

export function washSpot(width: number, height: number, cxPct: number, cyPct: number, radiusOfWidth: number) {
  return { cx: width * cxPct, cy: height * cyPct, r: width * radiusOfWidth };
}

