import type { Color, GameState, TokenState } from '@ludi/rules';
import { PLACES, TURN_ORDER } from '../../theme/tokens';

/** What the game screens tally while a match runs; the engine state does not keep these. */
export interface MatchStats {
  captures: Partial<Record<Color, number>>;
  sixes: Partial<Record<Color, number>>;
  elapsedMs: number;
}

export const EMPTY_STATS: MatchStats = { captures: {}, sixes: {}, elapsedMs: 0 };

export function recordRoll(stats: MatchStats, color: Color, value: number): MatchStats {
  if (value !== 6) return stats;
  return { ...stats, sixes: { ...stats.sixes, [color]: (stats.sixes[color] ?? 0) + 1 } };
}

export function recordCapture(stats: MatchStats, color: Color): MatchStats {
  return { ...stats, captures: { ...stats.captures, [color]: (stats.captures[color] ?? 0) + 1 } };
}

/** 18:42, or 1:02:09 past the hour. */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

export interface WinRow {
  rank: number;
  color: Color;
  name: string;
  /** "4/4 HOME" once all four are in, otherwise "3/4". */
  progress: string;
  place: string;
  winner: boolean;
}

export interface WinStat {
  value: string;
  label: string;
}

export interface WinView {
  kicker: string;
  winner: Color;
  /** Poster town line, e.g. KINGSTON. */
  place: string;
  headline: string;
  detail: string;
  stats: WinStat[];
  rows: WinRow[];
}

export type WinState = Pick<GameState, 'config' | 'tokens' | 'winner' | 'placements'>;

interface Progress {
  home: number;
  column: number;
  track: number;
}

function progressOf(tokens: TokenState[], color: Color): Progress {
  const out = { home: 0, column: 0, track: 0 };
  for (const t of tokens) {
    if (t.color !== color) continue;
    if (t.pos.zone === 'home') out.home += 1;
    else if (t.pos.zone === 'homeColumn') out.column += 1;
    else if (t.pos.zone === 'track') out.track += 1;
  }
  return out;
}

/**
 * Finishing order first (`placements`), then everyone still playing by pieces home,
 * pieces in the home column, pieces on the track, and finally turn order.
 */
export function rankColors(state: WinState): Color[] {
  const seated = TURN_ORDER.filter((c) => state.config.playerColors.includes(c));
  const finished = state.placements.filter((c) => seated.includes(c));
  if (state.winner && !finished.includes(state.winner)) finished.unshift(state.winner);
  const rest = seated
    .filter((c) => !finished.includes(c))
    .map((c) => ({ c, p: progressOf(state.tokens, c) }))
    .sort((a, b) => b.p.home - a.p.home || b.p.column - a.p.column || b.p.track - a.p.track)
    .map(({ c }) => c);
  return [...finished, ...rest];
}

interface WinViewInput {
  state: WinState;
  names: Partial<Record<Color, string>>;
  /** Online room code; null in pass and play. */
  roomCode: string | null;
  stats: MatchStats;
}

export function winView({ state, names, roomCode, stats }: WinViewInput): WinView | null {
  const winner = state.winner;
  if (!winner) return null;
  const nameOf = (c: Color) => names[c]?.trim() || PLACES[c].full;
  const rows = rankColors(state).map((c, i): WinRow => {
    const home = progressOf(state.tokens, c).home;
    return {
      rank: i + 1,
      color: c,
      name: nameOf(c),
      progress: home === 4 ? '4/4 HOME' : `${home}/4`,
      place: PLACES[c].full.toUpperCase(),
      winner: c === winner,
    };
  });
  const time = formatDuration(stats.elapsedMs);
  return {
    kicker: roomCode ? `GAME OVER · ROOM ${roomCode.toUpperCase()}` : 'GAME OVER · PASS & PLAY',
    winner,
    place: PLACES[winner].full.toUpperCase(),
    headline: `${nameOf(winner).toUpperCase()} RUN DI BOARD!`,
    detail: `All 4 pieces home in ${time}`,
    stats: [
      { value: String(stats.captures[winner] ?? 0), label: 'CAPTURES' },
      { value: String(stats.sixes[winner] ?? 0), label: 'SIXES' },
      { value: time, label: 'TIME' },
    ],
    rows,
  };
}

/** Anton 60 with 2pt tracking, measured in Chrome on the bundled font. */
const PLACE_WIDTH_60: Record<string, number> = {
  KINGSTON: 227.4,
  'MONTEGO BAY': 329.8,
  'OCHO RIOS': 247.9,
  NEGRIL: 161.7,
};

/** The town line is 60pt in the mockup; shrink it so the widest name and its 6pt shadow fit `width`. */
export function placeTitleSize(place: string, width: number): number {
  const w60 = PLACE_WIDTH_60[place] ?? place.length * 30;
  return Math.min(60, Math.floor((60 * (width - 6)) / w60));
}

/** Anton 26 averages 11.3pt per character with 0.6pt tracking (DEAN RUN DI BOARD! is 203pt). */
export function headlineSize(headline: string, width: number): number {
  return Math.max(16, Math.min(26, Math.floor((26 * width) / (headline.length * 11.3))));
}
