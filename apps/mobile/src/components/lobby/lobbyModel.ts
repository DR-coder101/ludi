/**
 * Maps the server's RoomState onto the lobby mockup: four corner seats, the
 * room-code note and the START GAME button. No React Native imports, so vitest
 * can run it directly.
 */
import type { HouseRules, Player, RoomState } from '@ludi/protocol';
import type { Color as EngineColor } from '@ludi/rules';
import { PLACES, type Corner } from '../../theme/tokens';

/** RoomRegistry.joinRoom rejects a fifth player; the protocol has no maxPlayers field. */
export const MAX_PLAYERS = 4;
/** The server's `room:ready` handler needs at least two players. */
export const MIN_PLAYERS = 2;

const CORNERS: Corner[] = ['TL', 'TR', 'BL', 'BR'];
const ENGINE_COLORS = Object.keys(PLACES) as EngineColor[];

/** Seat grid order, laid out like the island: Montego Bay, Ocho Rios, Negril, Kingston. */
export const SEAT_ORDER: EngineColor[] = CORNERS.map((c) => ENGINE_COLORS.find((k) => PLACES[k].corner === c)!);

export interface LobbySeat {
  color: EngineColor;
  /** Null for an open seat. */
  name: string | null;
  status: string;
  /** Status is drawn in green. */
  ready: boolean;
  you: boolean;
}

export interface RoomNote {
  text: string;
  tone: 'muted' | 'warn';
}

export interface StartCta {
  role: 'host' | 'guest';
  title: string;
  detail: string;
  enabled: boolean;
}

export const OPEN_SEAT: Omit<LobbySeat, 'color'> = { name: null, status: 'Tap to sit', ready: false, you: false };

function playerStatus(p: Player): { status: string; ready: boolean } {
  if (p.status === 'reconnecting') return { status: 'Reconnecting…', ready: false };
  if (p.status === 'ai-substitute') return { status: 'Bot playing', ready: false };
  if (!p.connected || p.status === 'disconnected') return { status: 'Offline', ready: false };
  // There is no per-player ready check: a connected player is ready as soon as the host starts.
  return { status: p.isHost ? 'Host · Ready' : 'Ready', ready: true };
}

export function lobbySeats(room: RoomState, myId: string | null): LobbySeat[] {
  return SEAT_ORDER.map((c) => {
    const p = room.players.find((pl) => pl.color === c);
    if (!p) return { color: c, ...OPEN_SEAT };
    const you = p.id === myId;
    return { color: c, name: you ? `${p.displayName} (You)` : p.displayName, you, ...playerStatus(p) };
  });
}

export function roomNote(count: number, connected: boolean): RoomNote {
  if (!connected) return { text: 'Reconnecting…', tone: 'warn' };
  const open = MAX_PLAYERS - count;
  if (open <= 0) return { text: 'Live · room full', tone: 'muted' };
  return { text: `Live · ${open} seat${open === 1 ? '' : 's'} open`, tone: 'muted' };
}

const players = (n: number) => `· ${n} player${n === 1 ? '' : 's'}`;

export function startCta(count: number, host: boolean): StartCta {
  if (!host) return { role: 'guest', title: 'WAITING FOR HOST', detail: players(count), enabled: false };
  if (count < MIN_PLAYERS) return { role: 'host', title: 'START GAME', detail: `· need ${MIN_PLAYERS} players`, enabled: false };
  return { role: 'host', title: 'START GAME', detail: players(count), enabled: true };
}

const MAX_CONSECUTIVE_SIXES: HouseRules['maxConsecutiveSixes'][] = [2, 3, 'unlimited'];

export function nextMaxConsecutiveSixes(
  current: HouseRules['maxConsecutiveSixes'],
): HouseRules['maxConsecutiveSixes'] {
  const index = MAX_CONSECUTIVE_SIXES.indexOf(current);
  return MAX_CONSECUTIVE_SIXES[(index + 1) % MAX_CONSECUTIVE_SIXES.length];
}

export function maxSixesLabel(value: HouseRules['maxConsecutiveSixes']): string {
  if (value === 'unlimited') return 'Unlimited';
  return String(value);
}
