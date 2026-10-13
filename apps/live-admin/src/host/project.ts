import type { LiveGameState, Seat, TownId } from '@ludi/live-game';
import type {
  AdminError,
  AdminView,
  ChromePill,
  DashboardView,
  KickTarget,
  SeatCard,
  SettingsView,
  SetupView,
} from '../view/types.js';
import { overlayUrl, OVERLAY_PORT, TOWN_HEX, TOWN_LABEL } from '../view/types.js';
import type { Classified } from './classify.js';

export type ProjectInput = {
  live: LiveGameState;
  settings: SettingsView;
  username: string;
  overlayUrl: string;
  overlayHits: number;
  classified: Classified;
  error: AdminError | null;
  kickUserId: string | null;
  viewers: number;
  gameNumber: number;
  startedAt: number;
  now: number;
  reconnectAttempt: number;
  overlayPort: number;
};

function clockLabel(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function pieceDetail(live: LiveGameState, town: TownId): string | null {
  const seat = live.seats.find((s) => s.town === town);
  if (!seat?.occupant || !live.game) return null;
  const color = seat.color;
  const tokens = live.game.tokens.filter((t) => t.color === color);
  const out = tokens.filter((t) => t.pos.zone === 'track' || t.pos.zone === 'homeColumn').length;
  const home = tokens.filter((t) => t.pos.zone === 'home').length;
  return `${out} out · ${home} home`;
}

function seatCard(live: LiveGameState, seat: Seat): SeatCard {
  const turnColor = live.game?.turn;
  return {
    town: seat.town,
    label: TOWN_LABEL[seat.town],
    hex: seat.hex,
    occupant: seat.occupant ? `@${seat.occupant.displayName}` : null,
    userId: seat.occupant?.userId ?? null,
    detail: pieceDetail(live, seat.town),
    isTurn: Boolean(seat.occupant && turnColor && seat.color === turnColor),
  };
}

function pillOf(input: ProjectInput): ChromePill {
  if (input.error?.kind === 'tikfinity-closed') {
    return { tone: 'red', title: 'Needs your help', subtitle: 'Game paused and saved' };
  }
  if (input.error?.kind === 'username-not-found') {
    return { tone: 'red', title: 'Needs your help', subtitle: "Setup isn't finished" };
  }
  if (input.error?.kind === 'live-ended') {
    return { tone: 'red', title: 'Needs your help', subtitle: "Your LIVE isn't on" };
  }
  if (input.error?.kind === 'overlay-not-loaded') {
    return { tone: 'red', title: 'Needs your help', subtitle: 'Overlay not showing' };
  }
  if (input.error?.kind === 'port-in-use') {
    return { tone: 'red', title: 'Needs your help', subtitle: "Overlay can't start" };
  }
  if (input.classified.reconnecting) {
    return {
      tone: 'gold',
      title: 'Reconnecting...',
      subtitle: `Try ${Math.max(1, input.reconnectAttempt)} of 5 · game paused`,
    };
  }
  if (input.classified.disconnected) {
    return { tone: 'red', title: 'Disconnected', subtitle: "Chat moves aren't coming in" };
  }
  if (input.classified.tikfinity === 'connected') {
    const handle = input.username ? `@${input.username}` : '@streamer';
    return {
      tone: 'green',
      title: 'Connected to your LIVE',
      subtitle: `${handle} · ${input.viewers} watching`,
    };
  }
  if (input.classified.tikfinity === 'running-no-live') {
    return { tone: 'gold', title: 'Almost ready', subtitle: 'Waiting for your LIVE to start' };
  }
  return { tone: 'red', title: 'Not connected', subtitle: "TikFinity isn't open" };
}

function kickOf(input: ProjectInput): KickTarget | null {
  if (!input.kickUserId) return null;
  const seat = input.live.seats.find((s) => s.occupant?.userId === input.kickUserId);
  if (!seat?.occupant) return null;
  const next = input.live.queue[0]?.displayName;
  return {
    userId: seat.occupant.userId,
    displayName: `@${seat.occupant.displayName}`,
    townLabel: `${TOWN_LABEL[seat.town]} SEAT`,
    townHex: seat.hex || TOWN_HEX[seat.town],
    nextName: next ? `@${next}` : 'the next viewer',
  };
}

function setupOf(input: ProjectInput): SetupView {
  const overlayLoaded = input.overlayHits > 0;
  const tikfinity = input.classified.tikfinity;
  const usernameDone = input.username.length > 0;
  let stepsDone: 1 | 2 | 3 = usernameDone ? 1 : 1;
  if (tikfinity === 'connected' && overlayLoaded) stepsDone = 3;
  else if (tikfinity === 'connected' || overlayLoaded) stepsDone = 2;
  return {
    username: input.username,
    usernameFound: usernameDone,
    tikfinity,
    overlayLoaded,
    overlayUrl: input.overlayUrl || overlayUrl(input.overlayPort || OVERLAY_PORT),
    stepsDone,
  };
}

function dashboardOf(input: ProjectInput): DashboardView {
  const remainMs = input.live.turnEndsAt ? Math.max(0, input.live.turnEndsAt - input.now) : 0;
  const totalMs = input.settings.turnMs;
  const remainS = Math.ceil(remainMs / 1000);
  const turnSeat = input.live.seats.find((s) => s.color === input.live.game?.turn);
  const mm = String(Math.floor(remainS / 60)).padStart(2, '0');
  const ss = String(remainS % 60).padStart(2, '0');
  const seated = input.live.seats.filter((s) => s.occupant).length;
  return {
    gameNumber: input.gameNumber,
    gameClock: clockLabel(input.now - input.startedAt),
    phase: input.live.phase,
    seats: [
      seatCard(input.live, input.live.seats[0]!),
      seatCard(input.live, input.live.seats[1]!),
      seatCard(input.live, input.live.seats[2]!),
      seatCard(input.live, input.live.seats[3]!),
    ],
    playingLabel: `${seated}/4 PLAYING`,
    timerLabel: turnSeat?.occupant ? `@${turnSeat.occupant.displayName} has to roll` : 'Waiting',
    timerRemain: `${mm}:${ss}`,
    timerTotal: `${Math.round(totalMs / 1000)}s`,
    timerRatio: totalMs === 0 ? 0 : Math.min(1, remainMs / totalMs),
    paused: input.live.paused,
    queue: input.live.queue.map((q, i) => ({
      place: i + 1,
      name: `@${q.displayName}`,
      note: i === 0 ? 'Plays the winner next' : 'In the join queue',
    })),
    sitOut: input.live.sitOut.map((id) => ({
      name: `@${id}`,
      badge: 'SITTING OUT · BACK NEXT GAME',
    })),
    chat: [],
    chatLive: input.classified.tikfinity === 'connected',
  };
}

export function projectRuntime(input: ProjectInput): AdminView {
  const setup = setupOf(input);
  const error = input.error;
  const reconnecting = input.classified.reconnecting;
  const disconnected = input.classified.disconnected;
  const nav = error ? 'dashboard' : 'setup';
  const canvas = reconnecting || disconnected
    ? { width: 1024, height: 738 }
    : error
      ? { width: 1024, height: 640 }
      : { width: 1024, height: 667 };
  return {
    canvas,
    nav,
    pill: pillOf(input),
    setup,
    settings: input.settings,
    dashboard: dashboardOf(input),
    kick: kickOf(input),
    error,
    banner: reconnecting
      ? {
          tone: 'gold',
          title: 'Lost the link to your LIVE for a moment',
          body: "We're reconnecting by ourselves and the game is paused. If it takes over 30 seconds, check your internet.",
          action: 'Try now',
        }
      : disconnected
        ? {
            tone: 'red',
            title: 'Ludi Live is disconnected from your LIVE',
            body: "The game is paused and saved. Open TikFinity, check you're still LIVE on TikTok, then press Reconnect.",
            action: 'Reconnect',
          }
        : null,
    footerHint: '',
    goDashboardEnabled: setup.stepsDone === 3,
  };
}
