import React, { memo } from 'react';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Mask,
  Path,
  Pattern,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import type { Color } from '@ludi/rules';
import { HOME_STRIPS, cellKind, startCell, stripeIndex, yardOrigin, type Direction } from './boardModel';
import { JAMAICA } from './jamaica';
import { starPoints } from './PieceGlyph';
import { boardGeometry, ENGINE_COLORS, fontFamily, palette, places, type Place } from '../../theme/tokens';
import type { Seats } from '../game/types';

const C = boardGeometry.cell;
const N = boardGeometry.grid;
const V = boardGeometry.viewBox;
const YARD = 8 * C;

const ROTATION: Record<Direction, number> = { right: 0, down: 90, left: 180, up: 270 };

function gridPath(): string {
  let d = '';
  for (let i = 0; i <= N; i++) {
    const p = i * C;
    if (i >= 8 && i <= 11) d += `M${p} 0V160M${p} 220V380M0 ${p}H160M220 ${p}H380`;
    if (i <= 8 || i >= 11) d += `M160 ${p}H220M${p} 160V220`;
  }
  return d;
}
const GRID_PATH = gridPath();

const TRACK_RECTS = (() => {
  const out: { key: string; x: number; y: number; fill: string; tint: boolean }[] = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (cellKind(r, c) !== 'track') continue;
      const fill = boardGeometry.stripes[stripeIndex(r, c) % 4];
      out.push({ key: `${r}-${c}`, x: c * C, y: r * C, fill, tint: fill !== palette.bg });
    }
  }
  return out;
})();

function Island({ x, y, width, strokeScale = 1, fill, outline }: {
  x: number;
  y: number;
  width: number;
  strokeScale?: number;
  fill: string;
  outline?: string;
}) {
  const s = width / JAMAICA.width;
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      {outline ? (
        <Path d={JAMAICA.path} fill="none" stroke={outline} strokeWidth={34 * strokeScale} strokeLinejoin="round" />
      ) : null}
      <Path d={JAMAICA.path} fill={fill} stroke={fill} strokeWidth={outline ? 10 : 6} strokeLinejoin="round" />
    </G>
  );
}

function MiniMap({ place, x, y }: { place: Place; x: number; y: number }) {
  const width = 62;
  const s = width / JAMAICA.width;
  const [px, py] = JAMAICA.pins[place.pin];
  return (
    <G>
      <Island x={x} y={y} width={width} fill="#45464C" />
      <Circle cx={x + px * s} cy={y + py * s} r={120 * s} fill={place.accent} opacity={0.25} />
      <Circle cx={x + px * s} cy={y + py * s} r={62 * s} fill={place.accent} stroke={palette.yardBase} strokeWidth={22 * s} />
    </G>
  );
}

function MicGlyph({ x, y, muted }: { x: number; y: number; muted: boolean }) {
  return (
    <Path
      transform={`translate(${x} ${y})`}
      d="M4 1.2a1.6 1.6 0 0 1 1.6 1.6v3a1.6 1.6 0 0 1-3.2 0v-3A1.6 1.6 0 0 1 4 1.2zM1.4 5.6a2.6 2.6 0 0 0 5.2 0M4 8.4v1.2"
      stroke={muted ? '#FF6B6B' : palette.white}
      strokeWidth={0.9}
      fill="none"
      strokeLinecap="round"
    />
  );
}

function VideoTile({ color, x, y, active, live, seats }: {
  color: Color;
  x: number;
  y: number;
  active: boolean;
  live: boolean;
  seats: Seats;
}) {
  const place = places[color];
  const seat = seats[color];
  const w = 57;
  const h = 70;
  const cx = x + w / 2;
  const label = seat ? `${seat.name}${seat.isYou ? ' · You' : ''}` : 'Open seat';
  return (
    <G opacity={seat ? 1 : 0.55}>
      <Rect x={x} y={y} width={w} height={h} rx={7} fill="url(#vid)" />
      <ClipPath id={`vclip-${color}`}>
        <Rect x={x} y={y} width={w} height={h} rx={7} />
      </ClipPath>
      <G clipPath={`url(#vclip-${color})`}>
        {seat ? (
          <>
            <Circle cx={cx} cy={y + h * 0.4} r={w * 0.19} fill="#7B7D83" />
            <Ellipse cx={cx} cy={y + h * 0.98} rx={w * 0.4} ry={h * 0.3} fill="#7B7D83" />
          </>
        ) : null}
        <Rect x={x} y={y + h - 15} width={w} height={15} fill={palette.black} opacity={0.55} />
      </G>
      <Rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={7}
        fill="none"
        stroke={place.accent}
        strokeWidth={active ? 2.2 : 1.3}
        strokeDasharray={seat ? undefined : '3 2.5'}
      />
      <SvgText x={x + 5} y={y + h - 4.5} fontFamily={fontFamily.bodyBold} fontSize={7.6} fill={palette.white}>
        {label}
      </SvgText>
      {seat ? <MicGlyph x={x + w - 11} y={y + h - 12.5} muted={!!seat.muted} /> : null}
      {live && active && seat ? (
        <G>
          <Rect x={x + 4} y={y + 4} width={20} height={9} rx={4.5} fill={palette.hot} />
          <SvgText x={x + 14} y={y + 10.6} fontFamily={fontFamily.badge} fontSize={5.6} fill={palette.white} textAnchor="middle">
            LIVE
          </SvgText>
        </G>
      ) : null}
    </G>
  );
}

function outerCorner(color: Color): { x: number; y: number } {
  const o = yardOrigin(color);
  const corner = places[color].corner;
  return { x: corner.endsWith('R') ? o.x + YARD : o.x, y: corner.startsWith('B') ? o.y + YARD : o.y };
}

function Yard({ color, active, live, seats }: { color: Color; active: boolean; live: boolean; seats: Seats }) {
  const place = places[color];
  const { x, y } = yardOrigin(color);
  const oc = outerCorner(color);
  const a = place.accent;
  const lines = place.lines;
  const fs = lines.length > 1 ? 19.5 : lines[0].length > 6 ? 20 : 24;
  const mapY = y + 33 + (lines.length - 1) * (fs - 1) + 7;
  const faint = [1, 2, 3, 4, 5, 6, 7];
  return (
    <G>
      <Defs>
        <RadialGradient id={`hg-${color}`} gradientUnits="userSpaceOnUse" cx={oc.x} cy={oc.y} r={190} fx={oc.x} fy={oc.y}>
          <Stop offset="0" stopColor={palette.white} stopOpacity={0.9} />
          <Stop offset="1" stopColor={palette.white} stopOpacity={0} />
        </RadialGradient>
        <Mask id={`hm-${color}`} maskUnits="userSpaceOnUse" x={x} y={y} width={YARD} height={YARD}>
          <Rect x={x} y={y} width={YARD} height={YARD} fill={`url(#hg-${color})`} />
        </Mask>
        <Pattern id={`ht-${color}`} width={5} height={5} patternUnits="userSpaceOnUse">
          <Circle cx={2.5} cy={2.5} r={1.05} fill={a} />
        </Pattern>
        <ClipPath id={`yc-${color}`}>
          <Rect x={x} y={y} width={YARD} height={YARD} />
        </ClipPath>
      </Defs>
      <Rect x={x} y={y} width={YARD} height={YARD} fill={palette.yardBase} />
      {faint.map((i) => (
        <G key={i}>
          <Line x1={x + i * C} y1={y} x2={x + i * C} y2={y + YARD} stroke={palette.white} strokeOpacity={0.05} strokeWidth={0.6} />
          <Line x1={x} y1={y + i * C} x2={x + YARD} y2={y + i * C} stroke={palette.white} strokeOpacity={0.05} strokeWidth={0.6} />
        </G>
      ))}
      <Rect
        x={x}
        y={y}
        width={YARD}
        height={YARD}
        fill={`url(#ht-${color})`}
        mask={`url(#hm-${color})`}
        opacity={place.tone === 'black' ? 0.2 : 0.3}
      />
      <G clipPath={`url(#yc-${color})`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Circle key={i} cx={oc.x} cy={oc.y} r={i * 14} fill="none" stroke={a} strokeOpacity={0.16 - i * 0.02} strokeWidth={1} />
        ))}
      </G>
      <Rect x={x + 5} y={y + 5} width={150} height={150} rx={9} fill="none" stroke={a} strokeWidth={active ? 2.6 : 1.6} />
      <Rect
        x={x + 8.5}
        y={y + 8.5}
        width={143}
        height={143}
        rx={6.5}
        fill="none"
        stroke={a}
        strokeOpacity={0.35}
        strokeWidth={0.7}
        strokeDasharray="1.5 2.5"
      />
      {lines.map((ln, i) => (
        <SvgText
          key={ln}
          x={x + 14}
          y={y + 33 + i * (fs - 1)}
          fontFamily={fontFamily.display}
          fontSize={fs}
          fill={a}
          letterSpacing={0.3}
        >
          {ln}
        </SvgText>
      ))}
      <MiniMap place={place} x={x + 14} y={mapY} />
      <VideoTile color={color} x={x + 90} y={y + 13} active={active} live={live} seats={seats} />
      {[0, 1, 2, 3].map((i) => {
        const cx = x + 29 + i * 34;
        const cy = y + 124;
        return (
          <G key={i}>
            <Circle cx={cx} cy={cy} r={12.5} fill={palette.black} fillOpacity={0.45} stroke={a} strokeOpacity={0.55} strokeWidth={1} />
            <Polygon points={starPoints(cx, cy, 5)} fill={a} opacity={0.35} />
          </G>
        );
      })}
    </G>
  );
}

function HomeStripArt({ color }: { color: Color }) {
  const strip = HOME_STRIPS[color];
  const place = places[color];
  const rows = strip.cells.map((c) => c.row);
  const cols = strip.cells.map((c) => c.col);
  const x = Math.min(...cols) * C;
  const y = Math.min(...rows) * C;
  const w = (Math.max(...cols) - Math.min(...cols) + 1) * C;
  const h = (Math.max(...rows) - Math.min(...rows) + 1) * C;
  const rot = ROTATION[strip.direction];
  return (
    <G>
      <Rect x={x} y={y} width={w} height={h} fill={place.homeFill} />
      <Rect x={x} y={y} width={w} height={h} fill="url(#halftone-s)" opacity={0.13} />
      <Rect
        x={x + 1.6}
        y={y + 1.6}
        width={w - 3.2}
        height={h - 3.2}
        fill="none"
        stroke={place.tone === 'gold' ? palette.bg : palette.cream}
        strokeOpacity={0.55}
        strokeWidth={1}
      />
      {strip.cells.map((c) => (
        <Path
          key={`${c.row}-${c.col}`}
          transform={`translate(${c.col * C + C / 2} ${c.row * C + C / 2}) rotate(${rot})`}
          d="M-3 -4.5L2 0L-3 4.5"
          stroke={place.chevron}
          strokeOpacity={0.55}
          strokeWidth={1.6}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </G>
  );
}

function CentreFlag() {
  const bands = ENGINE_COLORS.map((color) => {
    const band = places[color].band;
    const d = HOME_STRIPS[color].direction;
    if (d === 'down') return <Rect key={color} x={160} y={160} width={60} height={2.6} fill={band} />;
    if (d === 'up') return <Rect key={color} x={160} y={217.4} width={60} height={2.6} fill={band} />;
    if (d === 'right') return <Rect key={color} x={160} y={160} width={2.6} height={60} fill={band} />;
    return <Rect key={color} x={217.4} y={160} width={2.6} height={60} fill={band} />;
  });
  return (
    <G>
      <Polygon points="160,160 220,160 190,190" fill={palette.green} />
      <Polygon points="160,220 220,220 190,190" fill={palette.green} />
      <Polygon points="160,160 160,220 190,190" fill={palette.bg} />
      <Polygon points="220,160 220,220 190,190" fill={palette.bg} />
      <Path d="M160 160L220 220M220 160L160 220" stroke={palette.gold} strokeWidth={4.5} />
      <Rect x={160} y={160} width={60} height={60} fill="url(#halftone-s)" opacity={0.08} />
      {bands}
      <Path d="M160 160H220V220H160Z" fill="none" stroke={palette.cream} strokeWidth={0.8} />
      <Island x={164} y={180} width={52} fill={palette.bg} outline={palette.gold} />
    </G>
  );
}

function StartStar({ color }: { color: Color }) {
  const place = places[color];
  const cell = startCell(color);
  const cx = cell.col * C + C / 2;
  const cy = cell.row * C + C / 2;
  return (
    <G>
      <Circle cx={cx} cy={cy} r={8} fill={place.startDisc} stroke={place.startMark} strokeOpacity={0.8} strokeWidth={0.9} />
      <Polygon points={starPoints(cx, cy + 0.4, 5.6)} fill={place.startMark} />
    </G>
  );
}

function EntryArrow({ color }: { color: Color }) {
  const strip = HOME_STRIPS[color];
  const accent = places[color].accent;
  const cx = strip.entry.col * C + C / 2;
  const cy = strip.entry.row * C + C / 2;
  return (
    <G transform={`translate(${cx} ${cy}) rotate(${ROTATION[strip.direction]})`}>
      <Circle r={7} fill={palette.bg} stroke={accent} strokeWidth={1} />
      <Path
        d="M-3.4 0H3.2M0.6-2.8L3.4 0L0.6 2.8"
        stroke={accent}
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </G>
  );
}

export interface BoardArtProps {
  size: number;
  activeColor: Color | null;
  seats: Seats;
  live: boolean;
}

/** Everything on the board that does not move. */
export const BoardArt = memo(function BoardArt({ size, activeColor, seats, live }: BoardArtProps) {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${V} ${V}`}>
      <Defs>
        <Pattern id="halftone-s" width={3.2} height={3.2} patternUnits="userSpaceOnUse">
          <Circle cx={1.6} cy={1.6} r={0.75} fill={palette.white} />
        </Pattern>
        <LinearGradient id="vid" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#4A4B50" />
          <Stop offset="1" stopColor="#2A2B2F" />
        </LinearGradient>
      </Defs>
      <Rect width={V} height={V} fill={palette.bg} />
      {TRACK_RECTS.map((t) => (
        <G key={t.key}>
          <Rect x={t.x} y={t.y} width={C} height={C} fill={t.fill} />
          {t.tint ? <Rect x={t.x} y={t.y} width={C} height={C} fill="url(#halftone-s)" opacity={0.1} /> : null}
        </G>
      ))}
      {ENGINE_COLORS.map((color) => (
        <HomeStripArt key={color} color={color} />
      ))}
      <Path d={GRID_PATH} stroke={palette.cream} strokeOpacity={0.75} strokeWidth={0.8} fill="none" />
      <CentreFlag />
      {ENGINE_COLORS.map((color) => (
        <StartStar key={color} color={color} />
      ))}
      {ENGINE_COLORS.map((color) => (
        <EntryArrow key={color} color={color} />
      ))}
      {ENGINE_COLORS.map((color) => (
        <Yard key={color} color={color} active={activeColor === color} live={live} seats={seats} />
      ))}
      <Path
        d="M160 0V160H0M220 0V160H380M160 380V220H0M220 380V220H380"
        stroke={palette.cream}
        strokeOpacity={0.75}
        strokeWidth={0.8}
        fill="none"
      />
    </Svg>
  );
});
