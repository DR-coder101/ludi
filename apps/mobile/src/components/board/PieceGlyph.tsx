import React from 'react';
import { Circle, Defs, Ellipse, G, LinearGradient, RadialGradient, Stop, Text } from 'react-native-svg';
import { color, font, piece as PIECE, type PieceColor } from '../../theme/tokens';
import { occupancyVisual } from './occupancyVisual';

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
  /** Tokens of this colour on the cell. Two or more draw the blockade pair and xN badge. */
  stack?: number;
}

function Disc({ piece, cx, cy, r }: { piece: PieceColor; cx: number; cy: number; r: number }) {
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
      <Circle cx={cx} cy={cy} r={r * 0.3} fill={p.hi} opacity={0.85} />
      <Circle cx={cx} cy={cy} r={r * 0.62} fill="none" stroke={p.lo} strokeOpacity={0.55} strokeWidth={r * 0.12} />
      <Circle cx={cx} cy={cy} r={r * 0.52} fill="none" stroke={color.white} strokeOpacity={0.28} strokeWidth={r * 0.06} />
      <Ellipse cx={cx - r * 0.18} cy={cy - r * 0.42} rx={r * 0.55} ry={r * 0.3} fill="url(#spec)" opacity={0.8} />
    </G>
  );
}

function CountBadge({ cx, cy, r, label }: { cx: number; cy: number; r: number; label: string }) {
  return (
    <G>
      <Circle cx={cx} cy={cy} r={r * 0.62} fill={color.hot} stroke={color.white} strokeWidth={0.9} />
      <Text
        x={cx}
        y={cy + r * 0.18}
        fontFamily={font.sticker}
        fontSize={r * 0.5}
        fill={color.white}
        textAnchor="middle"
      >
        {label}
      </Text>
    </G>
  );
}

/** Glossy disc. A same-colour stack becomes the offset pair plus xN badge. */
export const PieceGlyph = React.memo(function PieceGlyph({ piece, cx, cy, r, stack }: PieceGlyphProps) {
  const mark = occupancyVisual(stack);
  switch (mark.kind) {
    case 'single':
      return <Disc piece={piece} cx={cx} cy={cy} r={r} />;
    case 'blockade': {
      const discR = r * mark.discScale;
      return (
        <G>
          {mark.pair.map((offset, i) => (
            <Disc
              key={i}
              piece={piece}
              cx={cx + offset.dx * r}
              cy={cy + offset.dy * r}
              r={discR}
            />
          ))}
          <CountBadge
            cx={cx + r * 1.05}
            cy={cy - r * 1.05}
            r={r}
            label={mark.badge}
          />
        </G>
      );
    }
    default: {
      const _never: never = mark;
      return _never;
    }
  }
});
