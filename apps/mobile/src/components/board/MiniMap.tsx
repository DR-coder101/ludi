import React from 'react';
import { Circle, G, Path } from 'react-native-svg';
import { JAMAICA } from './jamaica';
import { color } from '../../theme/tokens';

/** Island drawn into a box with SVG "meet" fitting, without a nested <Svg>. */
export function islandTransform(x: number, y: number, w: number, h: number, vb: [number, number, number, number]): string {
  const [vx, vy, vw, vh] = vb;
  const k = Math.min(w / vw, h / vh);
  const tx = x + (w - vw * k) / 2 - vx * k;
  const ty = y + (h - vh * k) / 2 - vy * k;
  return `translate(${tx} ${ty}) scale(${k})`;
}

interface MiniMapProps {
  pin: keyof typeof JAMAICA.pins;
  x: number;
  y: number;
  w: number;
  pinColor: string;
  /** Ring around the pin, matching the surface the map sits on. */
  pinStroke?: string;
  /** Island fill. */
  base?: string;
}

/** The pack's `jamMap()`: grey island with a town pin and soft halo. */
export function MiniMap({ pin, x, y, w, pinColor, pinStroke = color.yard, base = '#45464c' }: MiniMapProps) {
  const h = (w * JAMAICA.height) / JAMAICA.width;
  const [px, py] = JAMAICA.pins[pin];
  return (
    <G transform={islandTransform(x, y, w, h, [-40, -40, 1080, 474])}>
      <Path d={JAMAICA.path} fill={base} stroke={base} strokeWidth={6} strokeLinejoin="round" />
      <Circle cx={px} cy={py} r={120} fill={pinColor} opacity={0.25} />
      <Circle cx={px} cy={py} r={62} fill={pinColor} stroke={pinStroke} strokeWidth={22} />
    </G>
  );
}
