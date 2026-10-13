import type { AdminDemoId, AdminView, DashboardView, SettingsView, SetupView } from './types.js';
import {
  DEFAULT_SETTINGS,
  overlayUrl,
  OVERLAY_FALLBACK_PORT,
  OVERLAY_PORT,
  TOWN_HEX,
} from './types.js';

const SETUP_SIZE = { width: 1024, height: 640 } as const;
const SETTINGS_SIZE = { width: 1024, height: 849 } as const;
const DASH_SIZE = { width: 1024, height: 667 } as const;
const DASH_BANNER_SIZE = { width: 1024, height: 738 } as const;

const settings: SettingsView = DEFAULT_SETTINGS;

const setupBase: SetupView = {
  username: 'deanplays',
  usernameFound: true,
  tikfinity: 'running-no-live',
  overlayLoaded: false,
  overlayUrl: overlayUrl(OVERLAY_PORT),
  stepsDone: 1,
};

const dashboardPlaying: DashboardView = {
  gameNumber: 24,
  gameClock: '06:42',
  phase: 'PLAYING',
  seats: [
    {
      town: 'kingston',
      label: 'KINGSTON',
      hex: TOWN_HEX.kingston,
      occupant: '@Dave',
      userId: 'dave',
      detail: null,
      isTurn: true,
    },
    {
      town: 'ochoRios',
      label: 'OCHO RIOS',
      hex: TOWN_HEX.ochoRios,
      occupant: '@Mike',
      userId: 'mike',
      detail: '2 out · 1 home',
      isTurn: false,
    },
    {
      town: 'montegoBay',
      label: 'MONTEGO BAY',
      hex: TOWN_HEX.montegoBay,
      occupant: '@Sarah',
      userId: 'sarah',
      detail: '2 out · 0 home',
      isTurn: false,
    },
    {
      town: 'negril',
      label: 'NEGRIL',
      hex: TOWN_HEX.negril,
      occupant: '@John',
      userId: 'john',
      detail: '3 out · 0 home',
      isTurn: false,
    },
  ],
  playingLabel: '4/4 PLAYING',
  timerLabel: '@Dave has to roll',
  timerRemain: '00:12',
  timerTotal: '20s',
  timerRatio: 12 / 20,
  paused: false,
  queue: [
    { place: 1, name: '@Tom', note: 'Plays the winner next' },
    { place: 2, name: '@Lucy', note: 'Joined 2 min ago' },
    { place: 3, name: '@Kemar', note: 'Joined just now' },
  ],
  sitOut: [
    { name: '@Andre', badge: 'SITTING OUT · BACK NEXT GAME' },
    { name: '@Keisha', badge: 'SITTING OUT · BACK NEXT GAME' },
    { name: '@Rasheed', badge: 'SITTING OUT · BACK NEXT GAME' },
  ],
  chat: [
    { kind: 'command', time: '21:04', name: '@Dave', command: '!roll', result: 'Rolled a 5' },
    { kind: 'command', time: '21:04', name: '@Mike', command: '!move 2', result: 'Piece 2 moved 4' },
    { kind: 'command', time: '21:03', name: '@Kemar', command: '!join', result: 'Added to queue (3rd)' },
    { kind: 'command', time: '21:03', name: '@Ray', command: '!roll', result: 'Ignored, not their turn' },
    { kind: 'command', time: '21:02', name: '@Sarah', command: '!move 1', result: 'Piece 1 moved 6' },
    { kind: 'gift', text: '@Lucy sent Rose x6 · confetti only, no game boost' },
  ],
  chatLive: true,
};

function base(partial: Partial<AdminView> & Pick<AdminView, 'canvas' | 'nav' | 'pill'>): AdminView {
  return {
    setup: setupBase,
    settings,
    dashboard: dashboardPlaying,
    kick: null,
    error: null,
    banner: null,
    footerHint: '',
    goDashboardEnabled: false,
    ...partial,
  };
}

export function demoFrame(id: AdminDemoId): AdminView {
  switch (id) {
    case 'setup':
      return base({
        canvas: SETUP_SIZE,
        nav: 'setup',
        pill: { tone: 'gold', title: 'Almost ready', subtitle: 'Waiting for your LIVE to start' },
        setup: { ...setupBase, tikfinity: 'running-no-live', stepsDone: 1 },
        footerHint: 'You can do step 3 now. The board appears as soon as your LIVE connects.',
      });
    case 'setup-tikfinity-not-running':
      return base({
        canvas: SETUP_SIZE,
        nav: 'setup',
        pill: { tone: 'red', title: 'Not connected', subtitle: "TikFinity isn't open" },
        setup: { ...setupBase, tikfinity: 'not-running', stepsDone: 1 },
        footerHint: 'Start TikFinity first. You can still copy the overlay URL in step 3 now.',
      });
    case 'setup-connected':
      return base({
        canvas: SETUP_SIZE,
        nav: 'setup',
        pill: { tone: 'green', title: 'Connected to your LIVE', subtitle: '@deanplays · 312 watching' },
        setup: {
          ...setupBase,
          tikfinity: 'connected',
          overlayLoaded: true,
          stepsDone: 3,
        },
        footerHint: "You're all set. Viewers can type !join to grab a seat.",
        goDashboardEnabled: true,
      });
    case 'settings':
      return base({
        canvas: SETTINGS_SIZE,
        nav: 'settings',
        pill: { tone: 'green', title: 'Connected to your LIVE', subtitle: '@deanplays · 312 watching' },
        setup: { ...setupBase, tikfinity: 'connected', overlayLoaded: true, stepsDone: 3 },
        goDashboardEnabled: true,
      });
    case 'dashboard':
      return base({
        canvas: DASH_SIZE,
        nav: 'dashboard',
        pill: { tone: 'green', title: 'Connected to your LIVE', subtitle: '@deanplays · 312 watching' },
        setup: { ...setupBase, tikfinity: 'connected', overlayLoaded: true, stepsDone: 3 },
        goDashboardEnabled: true,
      });
    case 'dashboard-reconnecting':
      return base({
        canvas: DASH_BANNER_SIZE,
        nav: 'dashboard',
        pill: { tone: 'gold', title: 'Reconnecting...', subtitle: 'Try 2 of 5 · game paused' },
        dashboard: { ...dashboardPlaying, paused: true },
        banner: {
          tone: 'gold',
          title: 'Lost the link to your LIVE for a moment',
          body: "We're reconnecting by ourselves and the game is paused. If it takes over 30 seconds, check your internet.",
          action: 'Try now',
        },
        setup: { ...setupBase, tikfinity: 'running-no-live', overlayLoaded: true, stepsDone: 2 },
        goDashboardEnabled: true,
      });
    case 'dashboard-disconnected':
      return base({
        canvas: DASH_BANNER_SIZE,
        nav: 'dashboard',
        pill: { tone: 'red', title: 'Disconnected', subtitle: "Chat moves aren't coming in" },
        dashboard: { ...dashboardPlaying, paused: true },
        banner: {
          tone: 'red',
          title: 'Ludi Live is disconnected from your LIVE',
          body: "The game is paused and saved. Open TikFinity, check you're still LIVE on TikTok, then press Reconnect.",
          action: 'Reconnect',
        },
        setup: { ...setupBase, tikfinity: 'running-no-live', overlayLoaded: true, stepsDone: 2 },
        goDashboardEnabled: true,
      });
    case 'kick-confirm':
      return base({
        canvas: DASH_SIZE,
        nav: 'dashboard',
        pill: { tone: 'green', title: 'Connected to your LIVE', subtitle: '@deanplays · 312 watching' },
        kick: {
          userId: 'sarah',
          displayName: '@Sarah',
          townLabel: 'MONTEGO BAY SEAT',
          townHex: TOWN_HEX.montegoBay,
          nextName: '@Tom',
        },
        setup: { ...setupBase, tikfinity: 'connected', overlayLoaded: true, stepsDone: 3 },
        goDashboardEnabled: true,
      });
    case 'error-tikfinity-closed':
      return base({
        canvas: SETUP_SIZE,
        nav: 'dashboard',
        pill: { tone: 'red', title: 'Needs your help', subtitle: 'Game paused and saved' },
        error: { kind: 'tikfinity-closed' },
        setup: { ...setupBase, tikfinity: 'not-running', overlayLoaded: true, stepsDone: 1 },
      });
    case 'error-username-not-found':
      return base({
        canvas: SETUP_SIZE,
        nav: 'dashboard',
        pill: { tone: 'red', title: 'Needs your help', subtitle: "Setup isn't finished" },
        error: { kind: 'username-not-found', username: 'deanplayz' },
      });
    case 'error-live-ended':
      return base({
        canvas: SETUP_SIZE,
        nav: 'dashboard',
        pill: { tone: 'red', title: 'Needs your help', subtitle: "Your LIVE isn't on" },
        error: { kind: 'live-ended', username: 'deanplays', gameNumber: 24 },
        setup: { ...setupBase, tikfinity: 'running-no-live', overlayLoaded: true, stepsDone: 2 },
      });
    case 'error-overlay-not-loaded':
      return base({
        canvas: SETUP_SIZE,
        nav: 'dashboard',
        pill: { tone: 'red', title: 'Needs your help', subtitle: 'Overlay not showing' },
        error: { kind: 'overlay-not-loaded' },
        setup: { ...setupBase, tikfinity: 'connected', overlayLoaded: false, stepsDone: 2 },
      });
    case 'error-port-in-use':
      return base({
        canvas: SETUP_SIZE,
        nav: 'dashboard',
        pill: { tone: 'red', title: 'Needs your help', subtitle: "Overlay can't start" },
        error: { kind: 'port-in-use', wanted: OVERLAY_PORT, fallback: OVERLAY_FALLBACK_PORT },
      });
    default: {
      const _n: never = id;
      return _n;
    }
  }
}
