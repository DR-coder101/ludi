import type { Color } from '@ludi/rules';
import { TOWN } from '../theme.js';
import type { PieceView } from '../view/types.js';
import {
  ARM_B,
  BOARD_ART,
  BOARD_BEVEL,
  BOARD_VIEW,
  COLOR_TOWN,
  ENTRY,
  HOME_COL,
  START,
  TRACK,
  YARD,
  YARD_TL,
  cellSize,
  gpos,
  minCell,
  posToPoint,
} from './geometry.js';
import { JAMAICA_PATH, JAMAICA_PINS } from './jamaicaPath.js';

const PIECE = {
  gold: { hi: '#FFF3A0', mid: '#FED100', lo: '#A88400', rim: '#FFF8D0' },
  green: { hi: '#7CF2A4', mid: '#0FAE47', lo: '#005C22', rim: '#D8FFE6' },
  red: { hi: '#FF9AA0', mid: '#E4202E', lo: '#7A0710', rim: '#FFE0E2' },
  black: { hi: '#7A7D84', mid: '#26272B', lo: '#050506', rim: '#C9CDD4' },
} as const;

const PLACE: Record<Color, { lines: string[]; piece: keyof typeof PIECE; corner: 'TL' | 'TR' | 'BL' | 'BR'; pin: keyof typeof JAMAICA_PINS; acc: string }> = {
  yellow: { lines: ['MONTEGO', 'BAY'], piece: 'gold', corner: 'TL', pin: 'montego', acc: '#FED100' },
  green: { lines: ['OCHO', 'RIOS'], piece: 'green', corner: 'TR', pin: 'ocho', acc: '#19C45A' },
  blue: { lines: ['NEGRIL'], piece: 'black', corner: 'BL', pin: 'negril', acc: '#D9DCE1' },
  red: { lines: ['KINGSTON'], piece: 'red', corner: 'BR', pin: 'kingston', acc: '#FF3340' },
};

const STRIPE = ['#009B3A', '#0B0B0C', '#FED100', '#0B0B0C'] as const;
const ROT = { right: 0, down: 90, left: 180, up: 270 } as const;
const TURN: Color[] = ['red', 'green', 'yellow', 'blue'];

function outer(r: number, c: number): number {
  if (r < 8) return r;
  if (r > 10) return 18 - r;
  if (c < 8) return c;
  return 18 - c;
}

function dirb(a: readonly [number, number], b: readonly [number, number]): keyof typeof ROT {
  if (b[0] > a[0]) return 'down';
  if (b[0] < a[0]) return 'up';
  return b[1] > a[1] ? 'right' : 'left';
}

function star(x: number, y: number, r: number): string {
  return Array.from({ length: 10 }, (_, i) => {
    const rad = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    return `${x + rr * Math.cos(rad)},${y + rr * Math.sin(rad)}`;
  }).join(' ');
}

function isle(x: number, y: number, w: number, h: number, vb: [number, number, number, number]): string {
  const [vx, vy, vw, vh] = vb;
  const k = Math.min(w / vw, h / vh);
  return `translate(${x + (w - vw * k) / 2 - vx * k} ${y + (h - vh * k) / 2 - vy * k}) scale(${k})`;
}

function cx(c: readonly [number, number]): number {
  return gpos(c[1]) + cellSize(c[1]) / 2;
}
function cy(c: readonly [number, number]): number {
  return gpos(c[0]) + cellSize(c[0]) / 2;
}

type Props = {
  active: Color;
  pieces: readonly PieceView[];
};

export function BoardSvg({ active, pieces }: Props) {
  const p8 = gpos(8);
  const p11 = gpos(11);
  const cw = 3 * ARM_B;
  const mn = minCell();
  let grid = '';
  for (let i = 0; i < 20; i += 1) {
    const p = gpos(i);
    if (i >= 8 && i <= 11) {
      grid += `M${p} 0V${p8}M${p} ${p11}V380M0 ${p}H${p8}M${p11} ${p}H380`;
    }
    if (i <= 8 || i >= 11) {
      grid += `M${p8} ${p}H${p11}M${p} ${p8}V${p11}`;
    }
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`${-BOARD_BEVEL} ${-BOARD_BEVEL} ${BOARD_VIEW} ${BOARD_VIEW}`}
      width="100%"
      height="100%"
      data-safe="board"
    >
      <defs>
        {Object.entries(PIECE).map(([k, p]) => (
          <radialGradient key={k} id={`pg-${k}`} cx="38%" cy="32%" r="75%">
            <stop offset="0" stopColor={p.hi} />
            <stop offset="0.45" stopColor={p.mid} />
            <stop offset="1" stopColor={p.lo} />
          </radialGradient>
        ))}
        <linearGradient id="spec" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.85" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <pattern id="halftone-s" width="3.2" height="3.2" patternUnits="userSpaceOnUse">
          <circle cx="1.6" cy="1.6" r="0.75" fill="#fff" />
        </pattern>
        <linearGradient id="bevel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2a2a2e" />
          <stop offset="0.6" stopColor="#050506" />
          <stop offset="1" stopColor="#1c1c1f" />
        </linearGradient>
      </defs>
      <rect x={-BOARD_BEVEL} y={-BOARD_BEVEL} width={BOARD_VIEW} height={BOARD_VIEW} rx="10" fill="url(#bevel)" />
      <rect
        x={-3.5}
        y={-3.5}
        width={BOARD_VIEW - 1}
        height={BOARD_VIEW - 1}
        rx="9.5"
        fill="none"
        stroke="#FED100"
        strokeOpacity="0.25"
        strokeWidth="1"
      />
      <rect width={BOARD_ART} height={BOARD_ART} fill="#0B0B0C" />
      {TRACK.map(([r, c], i) => {
        const fill = STRIPE[outer(r, c) % 4];
        return (
          <g key={`t-${i}`}>
            <rect x={gpos(c)} y={gpos(r)} width={cellSize(c)} height={cellSize(r)} fill={fill} />
            {fill !== '#0B0B0C' ? (
              <rect
                x={gpos(c)}
                y={gpos(r)}
                width={cellSize(c)}
                height={cellSize(r)}
                fill="url(#halftone-s)"
                opacity="0.1"
              />
            ) : null}
          </g>
        );
      })}
      {TURN.map((e) => {
        const cells = HOME_COL[e];
        const pl = PLACE[e];
        const rows = cells.map((c) => c[0]);
        const cols = cells.map((c) => c[1]);
        const x = gpos(Math.min(...cols));
        const y = gpos(Math.min(...rows));
        const w = gpos(Math.max(...cols) + 1) - x;
        const h = gpos(Math.max(...rows) + 1) - y;
        const rot = ROT[dirb(cells[0]!, cells[1]!)];
        const fill = PIECE[pl.piece].mid;
        return (
          <g key={`home-${e}`}>
            <rect x={x} y={y} width={w} height={h} fill={pl.piece === 'black' ? '#232428' : fill} />
            <rect x={x} y={y} width={w} height={h} fill="url(#halftone-s)" opacity="0.13" />
            {cells.map((c, i) => (
              <path
                key={i}
                transform={`translate(${cx(c)} ${cy(c)}) rotate(${rot})`}
                d="M-3.6 -5.4L2.4 0L-3.6 5.4"
                stroke={pl.piece === 'gold' ? '#0B0B0C' : '#FFFFFF'}
                strokeOpacity="0.55"
                strokeWidth="1.9"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </g>
        );
      })}
      <path d={grid} stroke="#F6EFD9" strokeOpacity="0.75" strokeWidth="0.8" fill="none" />
      <g transform={`translate(${p8} ${p8}) scale(${cw / 60}) translate(-160 -160)`}>
        <polygon points="160,160 220,160 190,190" fill="#009B3A" />
        <polygon points="160,220 220,220 190,190" fill="#009B3A" />
        <polygon points="160,160 160,220 190,190" fill="#0B0B0C" />
        <polygon points="220,160 220,220 190,190" fill="#0B0B0C" />
        <path d="M160 160L220 220M220 160L160 220" stroke="#FED100" strokeWidth="4.5" />
        <g transform={isle(164, 180, 52, 20.5, [0, 0, 1000, 394])}>
          <path d={JAMAICA_PATH} fill="#0B0B0C" stroke="#FED100" strokeWidth="24" strokeLinejoin="round" />
        </g>
      </g>
      {TURN.map((e) => {
        const s = TRACK[START[e]]!;
        const pl = PLACE[e];
        const dark = pl.piece === 'gold';
        return (
          <g key={`start-${e}`}>
            <circle
              cx={cx(s)}
              cy={cy(s)}
              r={mn * 0.47}
              fill={pl.piece === 'black' ? '#2a2b30' : PIECE[pl.piece].mid}
              stroke={dark ? '#0B0B0C' : '#fff'}
              strokeOpacity="0.8"
              strokeWidth="0.9"
            />
            <polygon points={star(cx(s), cy(s) + 0.4, mn * 0.33)} fill={dark ? '#0B0B0C' : '#fff'} />
          </g>
        );
      })}
      {TURN.map((e) => {
        const en = TRACK[ENTRY[e]]!;
        const home0 = HOME_COL[e][0]!;
        const rot = ROT[dirb(en, home0)];
        const a = PLACE[e].acc;
        return (
          <g key={`entry-${e}`} transform={`translate(${cx(en)} ${cy(en)}) rotate(${rot}) scale(${(mn * 0.42) / 7})`}>
            <circle r="7" fill="#0B0B0C" stroke={a} strokeWidth="1" />
            <path
              d="M-3.4 0H3.2M0.6-2.8L3.4 0L0.6 2.8"
              stroke={a}
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        );
      })}
      {TURN.map((e) => {
        const pl = PLACE[e];
        const [r0, c0] = YARD_TL[e];
        const x = c0 * 20;
        const y = r0 * 20;
        const yk = YARD / 160;
        const isActive = e === active;
        const two = pl.lines.length > 1;
        const fs = two ? 30 : pl.lines[0]!.length > 6 ? 31 : 36;
        const ty0 = two ? 40 : 44;
        const mw = two ? 80 : 96;
        const mapY = y + ty0 + (pl.lines.length - 1) * (fs - 1) + 8;
        const pin = JAMAICA_PINS[pl.pin];
        return (
          <g key={`yard-${e}`} transform={`translate(${gpos(c0)} ${gpos(r0)}) scale(${yk}) translate(${-x} ${-y})`}>
            <rect x={x} y={y} width={160} height={160} fill="#0E0E10" />
            {isActive ? (
              <rect
                x={x + 5}
                y={y + 5}
                width={150}
                height={150}
                rx={9}
                fill="none"
                stroke={pl.acc}
                strokeOpacity="0.22"
                strokeWidth="10"
              />
            ) : null}
            <rect
              x={x + 5}
              y={y + 5}
              width={150}
              height={150}
              rx={9}
              fill="none"
              stroke={pl.acc}
              strokeWidth={isActive ? 2.6 : 1.6}
            />
            {pl.lines.map((ln, i) => (
              <text
                key={ln}
                x={x + 14}
                y={y + ty0 + i * (fs - 1)}
                fontFamily="Baloo 2, sans-serif"
                fontWeight={800}
                fontSize={fs}
                fill={pl.acc}
              >
                {ln}
              </text>
            ))}
            <g transform={isle(x + 14, mapY, mw, mw * 0.394, [-40, -40, 1080, 474])}>
              <path d={JAMAICA_PATH} fill="#45464c" stroke="#45464c" strokeWidth="6" strokeLinejoin="round" />
              <circle cx={pin[0]} cy={pin[1]} r="62" fill={pl.acc} stroke="#0E0E10" strokeWidth="22" />
            </g>
          </g>
        );
      })}
      {pieces.map((piece) => {
        const pt = posToPoint(piece.color, piece.pos, piece.tokenIndex);
        if (piece.pos.zone === 'yard') return null;
        const town = COLOR_TOWN[piece.color];
        const p = PIECE[PLACE[piece.color].piece];
        const r = mn * 0.47;
        return (
          <g key={piece.key} data-piece={piece.key} data-town={town}>
            <ellipse cx={pt.x} cy={pt.y + r * 0.62} rx={r * 1.02} ry={r * 0.5} fill="#000" opacity="0.55" />
            <circle cx={pt.x} cy={pt.y} r={r} fill={p.mid} stroke={p.rim} strokeWidth={r * 0.1} />
            <circle cx={pt.x - r * 0.18} cy={pt.y - r * 0.42} r={r * 0.28} fill="#fff" opacity="0.35" />
          </g>
        );
      })}
      {TURN.map((e) => {
        const yardPieces = pieces.filter((p) => p.color === e && p.pos.zone === 'yard');
        return yardPieces.map((piece, i) => {
          const pt = posToPoint(e, { zone: 'yard' }, i);
          const p = PIECE[PLACE[e].piece];
          const r = mn * 0.42;
          return (
            <g key={piece.key} data-piece={piece.key}>
              <circle cx={pt.x} cy={pt.y} r={r} fill={p.mid} stroke={p.rim} strokeWidth="1.1" />
            </g>
          );
        });
      })}
    </svg>
  );
}

export function townGlow(town: keyof typeof TOWN): string {
  return TOWN[town].hex;
}
