// Derives the 68-cell track and 7-cell home columns from the approved design
// pack geometry (ludi-design-pack build/lib.js: cellType, STARTS, ENTRIES) and
// renders a numbered diagram for sign-off.
//
// Usage: node apps/mobile/scripts/track-diagram.mjs [out.svg]
// Default output: docs/board/track-68.svg

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const N = 19;

// Verbatim port of lib.js cellType().
function cellType(r, c) {
  const inYard = (r < 8 || r > 10) && (c < 8 || c > 10);
  if (inYard) return 'yard';
  if (r >= 8 && r <= 10 && c >= 8 && c <= 10) return 'centre';
  if (c === 9 && r >= 1 && r <= 7) return 'home-gold';
  if (c === 9 && r >= 11 && r <= 17) return 'home-red';
  if (r === 9 && c >= 1 && c <= 7) return 'home-black';
  if (r === 9 && c >= 11 && c <= 17) return 'home-green';
  return 'track';
}

// lib.js STARTS / ENTRIES as [row, col] (+ arrow direction into the home column).
const STARTS = { gold: [1, 8], green: [8, 17], red: [17, 10], black: [10, 1] };
const ENTRIES = { gold: [0, 9, 'down'], green: [9, 18, 'left'], red: [18, 9, 'up'], black: [9, 0, 'right'] };
const DIR = { down: [1, 0], up: [-1, 0], left: [0, -1], right: [0, 1] };

const PLACES = {
  red: { place: 'KINGSTON', corner: 'BR', engine: 'red', fill: '#E4202E', text: '#FFFFFF' },
  green: { place: 'OCHO RIOS', corner: 'TR', engine: 'green', fill: '#0FAE47', text: '#FFFFFF' },
  gold: { place: 'MONTEGO BAY', corner: 'TL', engine: 'yellow', fill: '#FED100', text: '#0B0B0C' },
  black: { place: 'NEGRIL', corner: 'BL', engine: 'blue', fill: '#26272B', text: '#D9DCE1' },
};
// Engine colour order == movement order around the track.
const ORDER = ['red', 'green', 'gold', 'black'];

const key = (r, c) => `${r},${c}`;
const isTrack = (r, c) => r >= 0 && r < N && c >= 0 && c < N && cellType(r, c) === 'track';

// Ring neighbours: orthogonal track neighbours; a cell with only one orthogonal
// track neighbour sits on an inner corner and links diagonally around the centre.
function ringNeighbours(r, c) {
  const orth = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(([a, b]) => isTrack(a, b));
  if (orth.length >= 2) return orth;
  const diag = [[r - 1, c - 1], [r - 1, c + 1], [r + 1, c - 1], [r + 1, c + 1]].filter(([a, b]) => isTrack(a, b));
  return [...orth, ...diag];
}

function fail(msg) {
  console.error(`track-diagram: ${msg}`);
  process.exit(1);
}

export function deriveTrack() {
  const trackCells = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (isTrack(r, c)) trackCells.push([r, c]);
  for (const [r, c] of trackCells) {
    if (ringNeighbours(r, c).length !== 2) fail(`cell (${r},${c}) has ${ringNeighbours(r, c).length} ring neighbours`);
  }

  // Index 0 = Red start; first move is up the bottom arm, matching the
  // board.html midgame "+6" highlight path (16,10) -> (15,10) ... -> (10,11).
  const track = [STARTS.red];
  let prev = [18, 10];
  let cur = STARTS.red;
  for (;;) {
    const next = ringNeighbours(...cur).find(([a, b]) => key(a, b) !== key(...prev));
    if (key(...next) === key(...STARTS.red)) break;
    track.push(next);
    prev = cur;
    cur = next;
    if (track.length > trackCells.length) fail('walk did not close');
  }
  if (track.length !== trackCells.length) fail(`walk covered ${track.length} of ${trackCells.length} track cells`);

  const indexOf = new Map(track.map(([r, c], i) => [key(r, c), i]));
  const colours = {};
  for (const col of ORDER) {
    const [er, ec, dir] = ENTRIES[col];
    const [dr, dc] = DIR[dir];
    const home = [];
    for (let k = 1; k <= 7; k++) home.push([er + dr * k, ec + dc * k]);
    for (const [r, c] of home) if (cellType(r, c) !== `home-${col}`) fail(`home ${col} cell (${r},${c}) is ${cellType(r, c)}`);
    colours[col] = {
      start: indexOf.get(key(...STARTS[col])),
      entry: indexOf.get(key(er, ec)),
      entryDir: dir,
      home,
    };
  }
  return { track, colours };
}

function renderSvg({ track, colours }) {
  const S = 46;
  const BX = 56;
  const BY = 96;
  const LX = BX + N * S + 44;
  const W = LX + 680;
  const H = BY + N * S + 48;
  const cx = (c) => BX + c * S + S / 2;
  const cy = (r) => BY + r * S + S / 2;
  const indexOf = new Map(track.map(([r, c], i) => [key(r, c), i]));
  const startOf = new Map(ORDER.map((col) => [colours[col].start, col]));
  const entryOf = new Map(ORDER.map((col) => [colours[col].entry, col]));
  const homeOf = new Map();
  for (const col of ORDER) colours[col].home.forEach(([r, c], k) => homeOf.set(key(r, c), [col, k]));

  const star = (x, y, R, fill) => {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? R * 0.45 : R;
      pts.push(`${(x + rr * Math.cos(a)).toFixed(1)},${(y + rr * Math.sin(a)).toFixed(1)}`);
    }
    return `<polygon points="${pts.join(' ')}" fill="${fill}"/>`;
  };

  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="DejaVu Sans, Arial, sans-serif">`;
  s += `<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#FF3B7F"/></marker>`;
  s += `<marker id="ahk" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#0B0B0C"/></marker></defs>`;
  s += `<rect width="${W}" height="${H}" fill="#FFFFFF"/>`;
  s += `<text x="${BX}" y="40" font-size="26" font-weight="700" fill="#0B0B0C">Ludi track mapping — 68 track squares (17 per arm) + 7-square home columns</text>`;
  s += `<text x="${BX}" y="70" font-size="15" fill="#444">19×19 grid, (row, col) 0-indexed from top-left. Derived from design-pack lib.js cellType / STARTS / ENTRIES. DRAFT — awaiting Dean's approval.</text>`;

  for (let i = 0; i < N; i++) {
    s += `<text x="${cx(i)}" y="${BY - 10}" font-size="12" fill="#777" text-anchor="middle">${i}</text>`;
    s += `<text x="${BX - 10}" y="${cy(i) + 4}" font-size="12" fill="#777" text-anchor="end">${i}</text>`;
  }

  const yardRects = { TL: [0, 0], TR: [0, 11], BL: [11, 0], BR: [11, 11] };
  for (const col of ORDER) {
    const p = PLACES[col];
    const [r0, c0] = yardRects[p.corner];
    s += `<rect x="${BX + c0 * S}" y="${BY + r0 * S}" width="${8 * S}" height="${8 * S}" fill="${p.fill}" fill-opacity="${col === 'black' ? 0.85 : 0.22}"/>`;
    const tx = BX + c0 * S + 4 * S;
    const ty = BY + r0 * S + 4 * S;
    const tc = col === 'black' ? '#D9DCE1' : '#0B0B0C';
    s += `<text x="${tx}" y="${ty - 8}" font-size="26" font-weight="700" fill="${tc}" text-anchor="middle">${p.place}</text>`;
    s += `<text x="${tx}" y="${ty + 20}" font-size="15" fill="${tc}" text-anchor="middle">${col} pieces · engine id "${p.engine}"</text>`;
    s += `<text x="${tx}" y="${ty + 42}" font-size="15" fill="${tc}" text-anchor="middle">start ${colours[col].start} · entry ${colours[col].entry}</text>`;
  }

  s += `<polygon points="${BX + 8 * S},${BY + 8 * S} ${BX + 11 * S},${BY + 8 * S} ${BX + 9.5 * S},${BY + 9.5 * S}" fill="#009B3A"/>`;
  s += `<polygon points="${BX + 8 * S},${BY + 11 * S} ${BX + 11 * S},${BY + 11 * S} ${BX + 9.5 * S},${BY + 9.5 * S}" fill="#009B3A"/>`;
  s += `<polygon points="${BX + 8 * S},${BY + 8 * S} ${BX + 8 * S},${BY + 11 * S} ${BX + 9.5 * S},${BY + 9.5 * S}" fill="#0B0B0C"/>`;
  s += `<polygon points="${BX + 11 * S},${BY + 8 * S} ${BX + 11 * S},${BY + 11 * S} ${BX + 9.5 * S},${BY + 9.5 * S}" fill="#0B0B0C"/>`;
  s += `<path d="M${BX + 8 * S} ${BY + 8 * S}L${BX + 11 * S} ${BY + 11 * S}M${BX + 11 * S} ${BY + 8 * S}L${BX + 8 * S} ${BY + 11 * S}" stroke="#FED100" stroke-width="6"/>`;
  s += `<rect x="${cx(9) - 34}" y="${cy(9) - 13}" width="68" height="26" rx="5" fill="#FFFFFF"/>`;
  s += `<text x="${cx(9)}" y="${cy(9) + 6}" font-size="15" font-weight="700" fill="#0B0B0C" text-anchor="middle">HOME</text>`;

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const x = BX + c * S;
      const y = BY + r * S;
      const t = cellType(r, c);
      if (t === 'track') {
        const i = indexOf.get(key(r, c));
        const st = startOf.get(i);
        const en = entryOf.get(i);
        const fill = st ? PLACES[st].fill : '#F6EFD9';
        s += `<rect x="${x}" y="${y}" width="${S}" height="${S}" fill="${fill}" stroke="#0B0B0C" stroke-width="1"/>`;
        if (en) s += `<rect x="${x + 3}" y="${y + 3}" width="${S - 6}" height="${S - 6}" fill="none" stroke="${PLACES[en].fill === '#26272B' ? '#0B0B0C' : PLACES[en].fill}" stroke-width="4"/>`;
        if (st) s += star(x + S - 9, y + 9, 7, PLACES[st].text);
        const tc = st ? PLACES[st].text : '#0B0B0C';
        s += `<text x="${x + S / 2 - (st ? 3 : 0)}" y="${y + S / 2 + (st ? 10 : 7)}" font-size="19" font-weight="700" fill="${tc}" text-anchor="middle">${i}</text>`;
      } else if (t.startsWith('home-')) {
        const [col, k] = homeOf.get(key(r, c));
        const p = PLACES[col];
        s += `<rect x="${x}" y="${y}" width="${S}" height="${S}" fill="${p.fill}" stroke="#0B0B0C" stroke-width="1"/>`;
        s += `<text x="${x + S / 2}" y="${y + S / 2 + 6}" font-size="16" font-weight="700" fill="${p.text}" text-anchor="middle">H${k}</text>`;
      } else if (t === 'yard') {
        s += `<rect x="${x}" y="${y}" width="${S}" height="${S}" fill="none" stroke="#000" stroke-opacity=".06"/>`;
      }
    }
  }

  for (const col of ORDER) {
    const { entry, home } = colours[col];
    const [er, ec] = track[entry];
    const [hr, hc] = home[0];
    const bx = (cx(ec) + cx(hc)) / 2;
    const by = (cy(er) + cy(hr)) / 2;
    const ux = Math.sign(hc - ec);
    const uy = Math.sign(hr - er);
    s += `<line x1="${bx - ux * 9}" y1="${by - uy * 9}" x2="${bx + ux * 12}" y2="${by + uy * 12}" stroke="#0B0B0C" stroke-width="3.5" marker-end="url(#ahk)"/>`;
  }

  const diagonals = [];
  for (let i = 0; i < track.length; i++) {
    const [r1, c1] = track[i];
    const [r2, c2] = track[(i + 1) % track.length];
    if (r1 !== r2 && c1 !== c2) diagonals.push(i);
    const midx = (cx(c1) + cx(c2)) / 2;
    const midy = (cy(r1) + cy(r2)) / 2;
    const ux = Math.sign(c2 - c1);
    const uy = Math.sign(r2 - r1);
    s += `<line x1="${midx - ux * 6}" y1="${midy - uy * 6}" x2="${midx + ux * 6}" y2="${midy + uy * 6}" stroke="#FF3B7F" stroke-width="2.5" marker-end="url(#ah)"/>`;
  }

  let ly = BY + 6;
  const line = (txt, opts = {}) => {
    s += `<text x="${LX}" y="${ly}" font-size="${opts.size || 15}" font-weight="${opts.bold ? 700 : 400}" fill="${opts.fill || '#0B0B0C'}">${txt}</text>`;
    ly += opts.gap || 24;
  };
  line('Constants', { size: 20, bold: true, gap: 30 });
  line('TRACK_SIZE = 68 (4 arms × 17)   HOME_COLUMN_LENGTH = 7');
  line('Starts (17 apart): red 0 · green 17 · yellow 34 · blue 51');
  line('Home entry = start − 2: red 66 · green 15 · yellow 32 · blue 49');
  line('Safe cells = the 4 start stars only: 0, 17, 34, 51');
  line('Journey start → home = 66 track + 7 home column + 1 centre = 74 steps', { bold: true, gap: 36 });

  line('Per colour', { size: 20, bold: true, gap: 30 });
  for (const col of ORDER) {
    const p = PLACES[col];
    const { start, entry, home, entryDir } = colours[col];
    const [sr, sc] = track[start];
    const [er, ec] = track[entry];
    s += `<rect x="${LX}" y="${ly - 15}" width="18" height="18" fill="${p.fill}" stroke="#0B0B0C"/>`;
    s += `<text x="${LX + 26}" y="${ly}" font-size="16" font-weight="700" fill="#0B0B0C">${p.place} (${p.corner}) — ${col} · engine "${p.engine}"</text>`;
    ly += 22;
    line(`  come-out: track ${start} at (${sr},${sc})`, { gap: 20 });
    line(`  home entry: track ${entry} at (${er},${ec}), turns ${entryDir}`, { gap: 20 });
    line(`  home column H0..H6: (${home[0].join(',')}) → (${home[6].join(',')})`, { gap: 20 });
    line(`  path: ${start} → … → ${entry} → H0 … H6 → HOME`, { gap: 30 });
  }

  line('How to read', { size: 20, bold: true, gap: 30 });
  line('• Numbers 0–67 = absolute engine track index (zone "track", cell).', { gap: 22 });
  line('• Pink ticks show movement direction: counter-clockwise as drawn.', { gap: 22 });
  line(`• Corner steps around the centre are diagonal: ${diagonals.map((i) => `${i}→${(i + 1) % track.length}`).join(', ')}.`, { gap: 22 });
  line('• Coloured cell + star = come-out (start). Coloured outline = home entry.', { gap: 22 });
  line('• H0..H6 = engine homeColumn.step 1..7. Step 8 = HOME (centre).', { gap: 22 });
  line('• A piece never stands on start − 1 (e.g. red skips 67): it turns', { gap: 20 });
  line('  into its home column from the entry arrow cell.', { gap: 22 });

  s += `</svg>`;
  return { svg: s, diagonals };
}

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(process.argv[2] || resolve(here, '../../../docs/board/track-68.svg'));
const derived = deriveTrack();
const { svg, diagonals } = renderSvg(derived);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, svg);

console.log(`track cells: ${derived.track.length}`);
derived.track.forEach(([r, c], i) => console.log(`  ${String(i).padStart(2)}: (${r},${c})`));
for (const col of ORDER) {
  const { start, entry, home } = derived.colours[col];
  console.log(`${col}/${PLACES[col].engine}: start ${start}, entry ${entry}, home ${home.map((h) => `(${h})`).join(' ')}`);
}
console.log(`diagonal steps: ${diagonals.map((i) => `${i}->${(i + 1) % derived.track.length}`).join(', ')}`);
console.log(`wrote ${out}`);
