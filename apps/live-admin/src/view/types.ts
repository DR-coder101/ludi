import type { LivePhase, TownId } from '@ludi/live-game';

export const OVERLAY_PORT = 4747;
export const OVERLAY_FALLBACK_PORT = 4748;

export type AdminDemoId =
  | 'setup'
  | 'setup-tikfinity-not-running'
  | 'setup-connected'
  | 'settings'
  | 'dashboard'
  | 'dashboard-reconnecting'
  | 'dashboard-disconnected'
  | 'kick-confirm'
  | 'error-tikfinity-closed'
  | 'error-username-not-found'
  | 'error-live-ended'
  | 'error-overlay-not-loaded'
  | 'error-port-in-use';

export const ADMIN_DEMO_IDS: readonly AdminDemoId[] = [
  'setup',
  'setup-tikfinity-not-running',
  'setup-connected',
  'settings',
  'dashboard',
  'dashboard-reconnecting',
  'dashboard-disconnected',
  'kick-confirm',
  'error-tikfinity-closed',
  'error-username-not-found',
  'error-live-ended',
  'error-overlay-not-loaded',
  'error-port-in-use',
] as const;

export type CanvasSize = { width: number; height: number };

export type PillTone = 'gold' | 'red' | 'green';

export type ChromePill = {
  tone: PillTone;
  title: string;
  subtitle: string;
};

export type NavId = 'dashboard' | 'setup' | 'settings';

export type TikFinityStep = 'not-running' | 'running-no-live' | 'connected';

export type SetupView = {
  username: string;
  usernameFound: boolean;
  tikfinity: TikFinityStep;
  overlayLoaded: boolean;
  overlayUrl: string;
  stepsDone: 1 | 2 | 3;
};

export type CommandWords = {
  join: string;
  roll: string;
  move: string;
  stay: string;
  leave: string;
};

export type GiftEffectRow = {
  giftId: string;
  giftName: string;
  effect: string;
};

export type ThemeId = 'dancehall-night' | 'beach-day' | 'flag-classic';
export type AccentId = 'gold' | 'green' | 'pink' | 'cream';

export type SettingsView = {
  commands: CommandWords;
  theme: ThemeId;
  accent: AccentId;
  backgroundName: string;
  turnMs: number;
  giftEffects: GiftEffectRow[];
};

export type SeatCard = {
  town: TownId;
  label: string;
  hex: string;
  occupant: string | null;
  userId: string | null;
  detail: string | null;
  isTurn: boolean;
};

export type QueueRow = {
  place: number;
  name: string;
  note: string;
};

export type SitOutRow = {
  name: string;
  badge: string;
};

export type ChatRow =
  | { kind: 'command'; time: string; name: string; command: string; result: string }
  | { kind: 'gift'; text: string };

export type DashboardView = {
  gameNumber: number;
  gameClock: string;
  phase: LivePhase;
  seats: [SeatCard, SeatCard, SeatCard, SeatCard];
  playingLabel: string;
  timerLabel: string;
  timerRemain: string;
  timerTotal: string;
  timerRatio: number;
  paused: boolean;
  queue: QueueRow[];
  sitOut: SitOutRow[];
  chat: ChatRow[];
  chatLive: boolean;
};

export type KickTarget = {
  userId: string;
  displayName: string;
  townLabel: string;
  townHex: string;
  nextName: string;
};

export type AdminError =
  | { kind: 'tikfinity-closed' }
  | { kind: 'username-not-found'; username: string }
  | { kind: 'live-ended'; username: string; gameNumber: number }
  | { kind: 'overlay-not-loaded' }
  | { kind: 'port-in-use'; wanted: number; fallback: number };

export type Banner = {
  tone: 'gold' | 'red';
  title: string;
  body: string;
  action: string;
};

export type AdminView = {
  canvas: CanvasSize;
  nav: NavId;
  pill: ChromePill;
  setup: SetupView;
  settings: SettingsView;
  dashboard: DashboardView;
  kick: KickTarget | null;
  error: AdminError | null;
  banner: Banner | null;
  footerHint: string;
  goDashboardEnabled: boolean;
};

export const DEFAULT_COMMANDS: CommandWords = {
  join: '!join',
  roll: '!roll',
  move: '!move',
  stay: '!stay',
  leave: '!leave',
};

export const DEFAULT_GIFT_EFFECTS: GiftEffectRow[] = [
  { giftId: 'rose', giftName: 'Rose', effect: 'Confetti burst' },
  { giftId: 'finger-heart', giftName: 'Finger Heart', effect: 'Sparkle on their name' },
  { giftId: 'doughnut', giftName: 'Doughnut', effect: 'Pop line in the feed' },
  { giftId: 'perfume', giftName: 'Perfume', effect: 'Gold shimmer on the board' },
];

export const DEFAULT_SETTINGS: SettingsView = {
  commands: DEFAULT_COMMANDS,
  theme: 'dancehall-night',
  accent: 'gold',
  backgroundName: 'beach-sunset.jpg',
  turnMs: 20_000,
  giftEffects: DEFAULT_GIFT_EFFECTS,
};

export const TOWN_LABEL: Record<TownId, string> = {
  kingston: 'KINGSTON',
  ochoRios: 'OCHO RIOS',
  montegoBay: 'MONTEGO BAY',
  negril: 'NEGRIL',
};

export const TOWN_HEX: Record<TownId, string> = {
  kingston: '#E4202E',
  ochoRios: '#0FAE47',
  montegoBay: '#FED100',
  negril: '#26272B',
};

export function overlayUrl(port: number): string {
  return `http://localhost:${port}/overlay`;
}

export function isAdminDemoId(value: string | null): value is AdminDemoId {
  return value !== null && (ADMIN_DEMO_IDS as readonly string[]).includes(value);
}
