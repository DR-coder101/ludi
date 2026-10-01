import React from 'react';
import { Circle, Defs, Ellipse, G, LinearGradient, RadialGradient, Stop, Text } from 'react-native-svg';
import { color, font, piece as PIECE, type PieceColor } from '../../theme/tokens';

const PIECES = Object.keys(PIECE) as PieceColor[];

/** Gradients every piece references. Each <Svg> that draws pieces must include these. */
export function PieceDefs() {
  return (
    <Defs>
      {PIECES.map((k) => (
        <RadialGradient key={k} id={`pg-${k}`} cx="38%" cy="32%" r="75%">
          <Stop offset="0" stopColor={PIECE[k].hi} />
          <Stop offset="0.45" stopColor={PIECE[k].mid} />
          <Stop offset="1" stopColor={PIECE[k].lo} />
        </RadialGradient>
      ))}
      <LinearGradient id="spec" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor={color.white} stopOpacity={0.85} />
        <Stop offset="1" stopColor={color.white} stopOpacity={0} />
      </LinearGradient>
    </Defs>
  );
}

interface PieceGlyphProps {
  piece: PieceColor;
  cx: number;
  cy: number;
  r: number;
  /** Count badge for stacked pieces (shown when > 1). */
  stack?: number;
}

/** Stacked glossy disc: drop shadow, darker base, gradient face, groove ring, specular. */
export const PieceGlyph = React.memo(function PieceGlyph({ piece, cx, cy, r, stack }: PieceGlyphProps) {
  const p = PIECE[piece];
  return (
    <G>
      <Ellipse cx={cx} cy={cy + r * 0.62} rx={r * 1.02} ry={r * 0.5} fill="#000" opacity={0.55} />
      <Circle cx={cx} cy={cy + r * 0.28} r={r} fill={p.lo} />
      <Circle
        cx={cx}
        cy={cy}
        r={r}
        fill={`url(#pg-${piece})`}
        stroke={p.rim}
        strokeOpacity={0.9}
        strokeWidth={Math.max(0.8, r * 0.1)}
      />
      <Circle cx={cx} cy={cy} r={r * 0.62} fill="none" stroke={p.lo} strokeOpacity={0.55} strokeWidth={r * 0.12} />
      <Circle cx={cx} cy={cy} r={r * 0.52} fill="none" stroke={color.white} strokeOpacity={0.28} strokeWidth={r * 0.06} />
      <Ellipse cx={cx - r * 0.18} cy={cy - r * 0.42} rx={r * 0.55} ry={r * 0.3} fill="url(#spec)" opacity={0.8} />
      {stack != null && stack > 1 ? (
        <G>
          <Circle cx={cx + r * 0.85} cy={cy - r * 0.85} r={r * 0.52} fill={color.hot} stroke={color.white} strokeWidth={0.9} />
          <Text
            x={cx + r * 0.85}
            y={cy - r * 0.85 + r * 0.2}
            fontFamily={font.sticker}
            fontSize={r * 0.62}
            fill={color.white}
            textAnchor="middle"
          >
            {stack}
          </Text>
        </G>
      ) : null}
    </G>
  );
});
