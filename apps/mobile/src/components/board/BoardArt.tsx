/**
 * The 19×19 board as drawn in the design pack (build/lib.js boardSVG), in a
 * 380×380 unit space (20 units per cell). Cell positions come from boardLayout.
 */
import React from 'react';
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
  Text,
} from 'react-native-svg';
import type { Color } from '@ludi/rules';
import {
  HOME_COLUMNS,
  HOME_COLUMN_ENTRY,
  START_CELLS,
  TRACK_CELLS,
  YARDS,
  type CellPosition,
} from './boardLayout';
import type { BoardModel, YardView } from './boardModel';
import { PieceDefs, PieceGlyph } from './PieceGlyph';
import { JAMAICA } from './jamaica';
import { accent, color, font, PLACES, piece as PIECE, TURN_ORDER, type Corner, type PieceColor } from '../../theme/tokens';

export const C = 20;
export const UNITS = 380;
const YARD = 8 * C;

export const TRACK_PIECE_R = 7.4;
export const YARD_PIECE_R = 9.6;

type Dir = 'right' | 'down' | 'left' | 'up';
const ROT: Record<Dir, number> = { right: 0, down: 90, left: 180, up: 270 };

function dirBetween(a: CellPosition, b: CellPosition): Dir {
  if (b.row > a.row) return 'down';
  if (b.row < a.row) return 'up';
  return b.col > a.col ? 'right' : 'left';
}

const cx = (c: CellPosition) => c.col * C + C / 2;
const cy = (c: CellPosition) => c.row * C + C / 2;

/** Distance from the board edge along an arm; drives the green/black/gold/black stripes. */
function outerIndex(r: number, c: number): number {
  if (r < 8) return r;
  if (r > 10) return 18 - r;
  if (c < 8) return c;
  return 18 - c;
}
const STRIPE = [color.green, color.bg, color.gold, color.bg];

const STRIP_FILL: Record<PieceColor, string> = { gold: PIECE.gold.mid, red: PIECE.red.mid, green: PIECE.green.mid, black: '#232428' };
const STRIP_CHEVRON: Record<PieceColor, string> = { gold: color.bg, red: color.white, green: color.white, black: color.silver };
const CENTRE_BAND: Record<PieceColor, string> = { gold: color.gold, red: PIECE.red.mid, green: color.greenBright, black: color.silver };
const START_FILL: Record<PieceColor, string> = { gold: PIECE.gold.mid, red: PIECE.red.mid, green: PIECE.green.mid, black: '#2a2b30' };
const LANDING_RING: Record<PieceColor, string> = { gold: PIECE.gold.lo, red: color.redDeep, green: PIECE.green.lo, black: PIECE.black.hi };

function starPoints(x: number, y: number, R: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? R * 0.45 : R;
    pts.push(`${(x + rr * Math.cos(a)).toFixed(2)},${(y + rr * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
}

/** Island drawn into a box with SVG "meet" fitting, without a nested <Svg>. */
function islandTransform(x: number, y: number, w: number, h: number, vb: [number, number, number, number]): string {
  const [vx, vy, vw, vh] = vb;
  const k = Math.min(w / vw, h / vh);
  const tx = x + (w - vw * k) / 2 - vx * k;
  const ty = y + (h - vh * k) / 2 - vy * k;
  return `translate(${tx} ${ty}) scale(${k})`;
}

function BoardDefs() {
  return (
    <Defs>
      <Pattern id="halftone-s" width={3.2} height={3.2} patternUnits="userSpaceOnUse">
        <Circle cx={1.6} cy={1.6} r={0.75} fill={color.white} />
      </Pattern>
      <LinearGradient id="vid" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#4a4b50" />
        <Stop offset="1" stopColor="#2a2b2f" />
      </LinearGradient>
    </Defs>
  );
}

const TrackCells = React.memo(function TrackCells() {
  return (
    <G>
      {TRACK_CELLS.map(({ row, col }) => {
        const fill = STRIPE[outerIndex(row, col) % 4];
        return (
          <G key={`t${row}-${col}`}>
            <Rect x={col * C} y={row * C} width={C} height={C} fill={fill} />
            {fill !== color.bg ? (
              <Rect x={col * C} y={row * C} width={C} height={C} fill="url(#halftone-s)" opacity={0.1} />
            ) : null}
          </G>
        );
      })}
    </G>
  );
});

const HomeStrips = React.memo(function HomeStrips() {
  return (
    <G>
      {TURN_ORDER.map((engine) => {
        const cells = HOME_COLUMNS[engine].cells;
        const p = PLACES[engine].piece;
        const rows = cells.map((c) => c.row);
        const cols = cells.map((c) => c.col);
        const x = Math.min(...cols) * C;
        const y = Math.min(...rows) * C;
        const w = (Math.max(...cols) - Math.min(...cols) + 1) * C;
        const h = (Math.max(...rows) - Math.min(...rows) + 1) * C;
        const rot = ROT[dirBetween(cells[0], cells[1])];
        return (
          <G key={engine}>
            <Rect x={x} y={y} width={w} height={h} fill={STRIP_FILL[p]} />
            <Rect x={x} y={y} width={w} height={h} fill="url(#halftone-s)" opacity={0.13} />
            <Rect
              x={x + 1.6}
              y={y + 1.6}
              width={w - 3.2}
              height={h - 3.2}
              fill="none"
              stroke={p === 'gold' ? color.bg : color.cream}
              strokeOpacity={0.55}
              strokeWidth={1}
            />
            {cells.map((c) => (
              <Path
                key={`${c.row}-${c.col}`}
                transform={`translate(${cx(c)} ${cy(c)}) rotate(${rot})`}
                d="M-3 -4.5L2 0L-3 4.5"
                stroke={STRIP_CHEVRON[p]}
                strokeOpacity={0.55}
                strokeWidth={1.6}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </G>
        );
      })}
    </G>
  );
});

function gridPath(): string {
  let d = '';
  for (let i = 0; i <= 19; i++) {
    const p = i * C;
    if (i >= 8 && i <= 11) d += `M${p} 0V160M${p} 220V380M0 ${p}H160M220 ${p}H380`;
    if (i <= 8 || i >= 11) d += `M160 ${p}H220M${p} 160V220`;
  }
  return d;
}
const GRID = gridPath();

const Centre = React.memo(function Centre() {
  const bands = TURN_ORDER.map((engine) => {
    const last = HOME_COLUMNS[engine].cells[6];
    const band = CENTRE_BAND[PLACES[engine].piece];
    if (last.row === 7) return <Rect key={engine} x={160} y={160} width={60} height={2.6} fill={band} />;
    if (last.row === 11) return <Rect key={engine} x={160} y={217.4} width={60} height={2.6} fill={band} />;
    if (last.col === 7) return <Rect key={engine} x={160} y={160} width={2.6} height={60} fill={band} />;
    return <Rect key={engine} x={217.4} y={160} width={2.6} height={60} fill={band} />;
  });
  const isle = islandTransform(164, 180, 52, 20.5, [0, 0, 1000, 394]);
  return (
    <G>
      <Polygon points="160,160 220,160 190,190" fill={color.green} />
      <Polygon points="160,220 220,220 190,190" fill={color.green} />
      <Polygon points="160,160 160,220 190,190" fill={color.bg} />
      <Polygon points="220,160 220,220 190,190" fill={color.bg} />
      <Path d="M160 160L220 220M220 160L160 220" stroke={color.gold} strokeWidth={4.5} />
      <Rect x={160} y={160} width={60} height={60} fill="url(#halftone-s)" opacity={0.08} />
      {bands}
      <Path d="M160 160H220V220H160Z" fill="none" stroke={color.cream} strokeWidth={0.8} />
      <G transform={isle}>
        <Path d={JAMAICA.path} fill="none" stroke={color.gold} strokeWidth={34} strokeLinejoin="round" />
        <Path d={JAMAICA.path} fill={color.bg} stroke={color.bg} strokeWidth={10} strokeLinejoin="round" />
      </G>
    </G>
  );
});

const StartsAndEntries = React.memo(function StartsAndEntries() {
  return (
    <G>
      {TURN_ORDER.map((engine) => {
        const p = PLACES[engine].piece;
        const s = TRACK_CELLS[START_CELLS[engine]];
        const dark = p === 'gold';
        return (
          <G key={`s-${engine}`}>
            <Circle
              cx={cx(s)}
              cy={cy(s)}
              r={8}
              fill={START_FILL[p]}
              stroke={dark ? color.bg : color.white}
              strokeOpacity={0.8}
              strokeWidth={0.9}
            />
            <Polygon points={starPoints(cx(s), cy(s) + 0.4, 5.6)} fill={dark ? color.bg : color.white} />
          </G>
        );
      })}
      {TURN_ORDER.map((engine) => {
        const a = accent[PLACES[engine].piece];
        const e = TRACK_CELLS[HOME_COLUMN_ENTRY[engine]];
        const rot = ROT[dirBetween(e, HOME_COLUMNS[engine].cells[0])];
        return (
          <G key={`e-${engine}`} transform={`translate(${cx(e)} ${cy(e)}) rotate(${rot})`}>
            <Circle r={7} fill={color.bg} stroke={a} strokeWidth={1} />
            <Path
              d="M-3.4 0H3.2M0.6-2.8L3.4 0L0.6 2.8"
              stroke={a}
              strokeWidth={1.5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </G>
        );
      })}
    </G>
  );
});

function outerCorner(corner: Corner, x: number, y: number): [number, number] {
  return {
    TL: [x, y] as [number, number],
    TR: [x + YARD, y] as [number, number],
    BL: [x, y + YARD] as [number, number],
    BR: [x + YARD, y + YARD] as [number, number],
  }[corner];
}

function MiniMap({ pin, x, y, w, pinColor }: { pin: keyof typeof JAMAICA.pins; x: number; y: number; w: number; pinColor: string }) {
  const h = (w * JAMAICA.height) / JAMAICA.width;
  const [px, py] = JAMAICA.pins[pin];
  const base = '#45464c';
  return (
    <G transform={islandTransform(x, y, w, h, [-40, -40, 1080, 474])}>
      <Path d={JAMAICA.path} fill={base} stroke={base} strokeWidth={6} strokeLinejoin="round" />
      <Circle cx={px} cy={py} r={120} fill={pinColor} opacity={0.25} />
      <Circle cx={px} cy={py} r={62} fill={pinColor} stroke={color.yard} strokeWidth={22} />
    </G>
  );
}

function MicGlyph({ x, y, muted }: { x: number; y: number; muted: boolean }) {
  return (
    <Path
      transform={`translate(${x} ${y})`}
      d="M4 1.2a1.6 1.6 0 0 1 1.6 1.6v3a1.6 1.6 0 0 1-3.2 0v-3A1.6 1.6 0 0 1 4 1.2zM1.4 5.6a2.6 2.6 0 0 0 5.2 0M4 8.4v1.2"
      stroke={muted ? '#ff6b6b' : color.white}
      strokeWidth={0.9}
      fill="none"
      strokeLinecap="round"
    />
  );
}

/** Player video tile placeholder: silhouette, name bar, and with video on, mic state and a LIVE badge on the active player. */
function VideoTile({ id, x, y, name, tint, active, muted, video }: { id: string; x: number; y: number; name: string; tint: string; active: boolean; muted: boolean; video: boolean }) {
  const w = 57;
  const h = 70;
  const mid = x + w / 2;
  return (
    <G>
      <Defs>
        <ClipPath id={`clip-${id}`}>
          <Rect x={x} y={y} width={w} height={h} rx={7} />
        </ClipPath>
      </Defs>
      <Rect x={x} y={y} width={w} height={h} rx={7} fill="url(#vid)" />
      <G clipPath={`url(#clip-${id})`} fill="#7b7d83">
        <Circle cx={mid} cy={y + h * 0.4} r={w * 0.19} />
        <Ellipse cx={mid} cy={y + h * 0.98} rx={w * 0.4} ry={h * 0.3} />
        <Rect x={x} y={y + h - 15} width={w} height={15} fill="#000" opacity={0.55} />
      </G>
      <Rect x={x} y={y} width={w} height={h} rx={7} fill="none" stroke={tint} strokeWidth={active ? 2.2 : 1.3} />
      <Text x={x + 5} y={y + h - 4.5} fontFamily={font.bodyBold} fontSize={7.6} fill={color.white}>
        {name}
      </Text>
      {video ? <MicGlyph x={x + w - 11} y={y + h - 12.5} muted={muted} /> : null}
      {video && active ? (
        <G>
          <Rect x={x + 4} y={y + 4} width={20} height={9} rx={4.5} fill={color.hot} />
          <Text x={x + 14} y={y + 10.6} fontFamily={font.sticker} fontSize={5.6} fill={color.white} textAnchor="middle">
            LIVE
          </Text>
        </G>
      ) : null}
    </G>
  );
}

export interface YardLabels {
  names: Partial<Record<Color, string>>;
  me: Color | null;
  muted: Partial<Record<Color, boolean>>;
  /** A voice/video call is running (online rooms); pass-and-play has none. */
  video: boolean;
}

/** Centre of yard slot `i` (0..3) for a colour, in board units. */
export function yardSlot(engine: Color, i: number): { x: number; y: number } {
  const tl = YARDS[engine].topLeft;
  return { x: tl.col * C + 29 + i * 34, y: tl.row * C + 124 };
}

function Yard({ view, labels }: { view: YardView; labels: YardLabels }) {
  const engine = view.color;
  const place = PLACES[engine];
  const p = place.piece;
  const a = accent[p];
  const tl = YARDS[engine].topLeft;
  const x = tl.col * C;
  const y = tl.row * C;
  const [ox, oy] = outerCorner(place.corner, x, y);
  const id = place.pin;
  const fs = place.lines.length > 1 ? 19.5 : place.lines[0].length > 6 ? 20 : 24;
  const mapY = y + 33 + (place.lines.length - 1) * (fs - 1) + 7;
  const name = labels.names[engine];
  const gridLines = [1, 2, 3, 4, 5, 6, 7];

  return (
    <G opacity={view.seated ? 1 : 0.5}>
      <Defs>
        <RadialGradient id={`hg-${id}`} gradientUnits="userSpaceOnUse" cx={ox} cy={oy} r={190} fx={ox} fy={oy}>
          <Stop offset="0" stopColor={color.white} stopOpacity={0.9} />
          <Stop offset="1" stopColor={color.white} stopOpacity={0} />
        </RadialGradient>
        <Mask id={`hm-${id}`} x={x} y={y} width={YARD} height={YARD} maskUnits="userSpaceOnUse">
          <Rect x={x} y={y} width={YARD} height={YARD} fill={`url(#hg-${id})`} />
        </Mask>
        <Pattern id={`ht-${id}`} width={5} height={5} patternUnits="userSpaceOnUse">
          <Circle cx={2.5} cy={2.5} r={1.05} fill={a} />
        </Pattern>
        <ClipPath id={`yc-${id}`}>
          <Rect x={x} y={y} width={YARD} height={YARD} />
        </ClipPath>
      </Defs>
      <Rect x={x} y={y} width={YARD} height={YARD} fill={color.yard} />
      {gridLines.map((i) => (
        <G key={i}>
          <Line x1={x + i * C} y1={y} x2={x + i * C} y2={y + YARD} stroke={color.white} strokeOpacity={0.05} strokeWidth={0.6} />
          <Line x1={x} y1={y + i * C} x2={x + YARD} y2={y + i * C} stroke={color.white} strokeOpacity={0.05} strokeWidth={0.6} />
        </G>
      ))}
      <Rect
        x={x}
        y={y}
        width={YARD}
        height={YARD}
        fill={`url(#ht-${id})`}
        mask={`url(#hm-${id})`}
        opacity={p === 'black' ? 0.2 : 0.3}
      />
      <G clipPath={`url(#yc-${id})`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Circle key={i} cx={ox} cy={oy} r={i * 14} fill="none" stroke={a} strokeOpacity={0.16 - i * 0.02} strokeWidth={1} />
        ))}
      </G>
      {view.active ? (
        <G>
          <Rect x={x + 5} y={y + 5} width={150} height={150} rx={9} fill="none" stroke={a} strokeOpacity={0.12} strokeWidth={10} />
          <Rect x={x + 5} y={y + 5} width={150} height={150} rx={9} fill="none" stroke={a} strokeOpacity={0.22} strokeWidth={6} />
        </G>
      ) : null}
      <Rect x={x + 5} y={y + 5} width={150} height={150} rx={9} fill="none" stroke={a} strokeWidth={view.active ? 2.6 : 1.6} />
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
      {place.lines.map((ln, i) => (
        <Text key={ln} x={x + 14} y={y + 33 + i * (fs - 1)} fontFamily={font.display} fontSize={fs} fill={a} letterSpacing={0.3}>
          {ln}
        </Text>
      ))}
      <MiniMap pin={place.pin} x={x + 14} y={mapY} w={62} pinColor={a} />
      {view.seated ? (
        <VideoTile
          id={id}
          x={x + 90}
          y={y + 13}
          name={`${name ?? place.full}${labels.me === engine ? ' · You' : ''}`}
          tint={a}
          active={view.active}
          muted={labels.muted[engine] ?? false}
          video={labels.video}
        />
      ) : null}
      {[0, 1, 2, 3].map((i) => {
        const s = yardSlot(engine, i);
        const tokenIndex = view.tokens[i];
        const has = tokenIndex !== undefined;
        return (
          <G key={i}>
            <Circle cx={s.x} cy={s.y} r={12.5} fill="#000" fillOpacity={0.45} stroke={a} strokeOpacity={0.55} strokeWidth={1} />
            {has && view.legal.includes(tokenIndex) ? (
              <Circle cx={s.x} cy={s.y} r={14.8} fill="none" stroke={color.gold} strokeWidth={1.6} strokeDasharray="3 2.2" />
            ) : null}
            {has ? (
              <PieceGlyph piece={p} cx={s.x} cy={s.y - 1} r={YARD_PIECE_R} />
            ) : view.seated ? (
              <Polygon points={starPoints(s.x, s.y, 5)} fill={a} opacity={0.35} />
            ) : null}
          </G>
        );
      })}
    </G>
  );
}

function Highlight({ model }: { model: BoardModel }) {
  const h = model.highlight;
  if (!h) return null;
  const tx = h.to.col * C;
  const ty = h.to.row * C;
  return (
    <G>
      {h.path.map((c, i) => (
        <Circle key={`${c.row}-${c.col}`} cx={cx(c)} cy={cy(c)} r={2.6} fill={color.white} stroke={color.bg} strokeWidth={1.1} opacity={0.55 + i * 0.09} />
      ))}
      <Rect x={tx - 3} y={ty - 3} width={26} height={26} rx={6} fill={color.gold} opacity={0.18} />
      <Rect x={tx - 1} y={ty - 1} width={22} height={22} rx={5} fill={color.gold} fillOpacity={0.92} stroke={color.goldLight} strokeWidth={1.6} />
      <Rect x={tx - 4} y={ty - 4} width={28} height={28} rx={7} fill="none" stroke={color.gold} strokeOpacity={0.45} strokeWidth={1} />
      <Rect x={tx + 13} y={ty - 9} width={15} height={11} rx={5.5} fill={color.hot} stroke={color.white} strokeWidth={0.8} />
      <Text x={tx + 20.5} y={ty - 1} fontFamily={font.sticker} fontSize={7} fill={color.white} textAnchor="middle">
        {`+${h.steps}`}
      </Text>
      <Circle cx={cx(h.to)} cy={cy(h.to)} r={6.5} fill="none" stroke={LANDING_RING[h.piece]} strokeWidth={1.6} strokeDasharray="2.5 2" />
      <Circle cx={cx(h.from)} cy={cy(h.from)} r={11.5} fill="none" stroke={color.gold} strokeOpacity={0.3} strokeWidth={5} />
      <Circle cx={cx(h.from)} cy={cy(h.from)} r={11.5} fill="none" stroke={color.gold} strokeWidth={1.8} />
      <Circle cx={cx(h.from)} cy={cy(h.from)} r={14} fill="none" stroke={color.gold} strokeOpacity={0.35} strokeWidth={1} />
    </G>
  );
}

/** Board-unit centre of a placed piece (lib.js draws track pieces 1 unit above cell centre). */
export function pieceCentre(row: number, col: number, dx = 0): { x: number; y: number } {
  return { x: (col + dx) * C + C / 2, y: row * C + C / 2 - 1 };
}

interface BoardArtProps {
  size: number;
  model: BoardModel;
  labels: YardLabels;
}

export function BoardArt({ size, model, labels }: BoardArtProps) {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${UNITS} ${UNITS}`}>
      <PieceDefs />
      <BoardDefs />
      <Rect width={UNITS} height={UNITS} fill={color.bg} />
      <TrackCells />
      <HomeStrips />
      <Path d={GRID} stroke={color.cream} strokeOpacity={0.75} strokeWidth={0.8} fill="none" />
      <Centre />
      <StartsAndEntries />
      {TURN_ORDER.map((engine) => (
        <Yard key={engine} view={model.yards[engine]} labels={labels} />
      ))}
      <Path
        d="M160 0V160H0M220 0V160H380M160 380V220H0M220 380V220H380"
        stroke={color.cream}
        strokeOpacity={0.75}
        strokeWidth={0.8}
        fill="none"
      />
      <Highlight model={model} />
      {model.finished.map((f) => {
        const c = pieceCentre(f.row, f.col);
        return <PieceGlyph key={`home-${f.color}`} piece={f.piece} cx={c.x} cy={c.y} r={6.2} stack={f.count} />;
      })}
      {model.pieces.map((p) => {
        const c = pieceCentre(p.row, p.col, p.dx);
        return <PieceGlyph key={p.key} piece={p.piece} cx={c.x} cy={c.y} r={TRACK_PIECE_R} stack={p.count} />;
      })}
    </Svg>
  );
}
