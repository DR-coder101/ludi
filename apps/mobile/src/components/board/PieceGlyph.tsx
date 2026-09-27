import React, { memo } from 'react';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  RadialGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { fontFamily, palette, pieceGradient, type PieceTone } from '../../theme/tokens';

/** Local drawing radius; the glyph is scaled to its real size by the caller. */
export const GLYPH_R = 10;
/** Glyph box: room for the base disc below and the stack badge above-right. */
export const GLYPH_BOX = 34;

export function starPoints(cx: number, cy: number, R: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? R * 0.45 : R;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
}

interface PieceGlyphProps {
  tone: PieceTone;
  /** Rendered pixel size of the GLYPH_BOX square. */
  size: number;
  stackCount?: number;
}

/**
 * Glossy stacked piece: darker base disc offset +0.28r, radial body, inner
 * groove at 0.62r, specular ellipse, optional hot-pink stack badge.
 * The drop shadow is drawn by the caller so it can react to hops.
 */
export const PieceGlyph = memo(function PieceGlyph({ tone, size, stackCount = 1 }: PieceGlyphProps) {
  const p = pieceGradient[tone];
  const r = GLYPH_R;
  const half = GLYPH_BOX / 2;
  const badge = stackCount > 1;
  return (
    <Svg width={size} height={size} viewBox={`${-half} ${-half} ${GLYPH_BOX} ${GLYPH_BOX}`}>
      <Defs>
        <RadialGradient id={`pg-${tone}`} cx="38%" cy="32%" r="75%">
          <Stop offset="0" stopColor={p.hi} />
          <Stop offset="0.45" stopColor={p.mid} />
          <Stop offset="1" stopColor={p.lo} />
        </RadialGradient>
        <LinearGradient id="spec" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={palette.white} stopOpacity={0.85} />
          <Stop offset="1" stopColor={palette.white} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Circle cx={0} cy={r * 0.28} r={r} fill={p.lo} />
      <Circle cx={0} cy={0} r={r} fill={`url(#pg-${tone})`} stroke={p.rim} strokeOpacity={0.9} strokeWidth={r * 0.1} />
      <Circle cx={0} cy={0} r={r * 0.62} fill="none" stroke={p.lo} strokeOpacity={0.55} strokeWidth={r * 0.12} />
      <Circle cx={0} cy={0} r={r * 0.52} fill="none" stroke={palette.white} strokeOpacity={0.28} strokeWidth={r * 0.06} />
      <Ellipse cx={-r * 0.18} cy={-r * 0.42} rx={r * 0.55} ry={r * 0.3} fill="url(#spec)" opacity={0.8} />
      {badge ? (
        <>
          <Circle cx={r * 0.85} cy={-r * 0.85} r={r * 0.56} fill={palette.hot} stroke={palette.white} strokeWidth={1.1} />
          <SvgText
            x={r * 0.85}
            y={-r * 0.85 + r * 0.24}
            fontFamily={fontFamily.badge}
            fontSize={r * 0.68}
            fill={palette.white}
            textAnchor="middle"
          >
            {String(stackCount)}
          </SvgText>
        </>
      ) : null}
    </Svg>
  );
});
