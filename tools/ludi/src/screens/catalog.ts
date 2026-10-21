import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PHONE = {
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
} as const;

export const PIXEL_THRESHOLD = 0.1;
export const MAX_DIFF_RATIO = 0.005;

export type ScreenId = 'home' | 'lobby' | 'board-start' | 'board-video' | 'win';

export type WaitFor = {
  role: 'button' | 'heading';
  name: string;
};

export type ScreenSpec = {
  id: ScreenId;
  path: string;
  waitFor: WaitFor;
  file: string;
};

export const SCREENS: readonly ScreenSpec[] = [
  {
    id: 'home',
    path: '/dev/home',
    waitFor: {
      role: 'heading',
      name: 'Ludi. Jamaican Rules. Four corners, one board.',
    },
    file: 'home.png',
  },
  {
    id: 'lobby',
    path: '/dev/lobby',
    waitFor: { role: 'heading', name: 'PRIVATE ROOM' },
    file: 'lobby.png',
  },
  {
    id: 'board-start',
    path: '/dev/board?state=start',
    waitFor: { role: 'button', name: 'Roll the dice' },
    file: 'board-start.png',
  },
  {
    id: 'board-video',
    path: '/dev/board?state=video',
    waitFor: { role: 'button', name: 'Mute microphone' },
    file: 'board-video.png',
  },
  {
    id: 'win',
    path: '/dev/win',
    waitFor: { role: 'heading', name: 'DEAN RUN DI BOARD!' },
    file: 'win.png',
  },
];

export const SCREEN_IDS: readonly ScreenId[] = SCREENS.map((s) => s.id);

export function screenById(id: string): ScreenSpec | undefined {
  return SCREENS.find((s) => s.id === id);
}

export function screensToRun(id: string): ScreenSpec[] {
  if (id === 'all') return [...SCREENS];
  const spec = screenById(id);
  return spec ? [spec] : [];
}

export function findRepoRoot(start = dirname(fileURLToPath(import.meta.url))): string {
  let dir = start;
  while (dir !== dirname(dir)) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) return dir;
    dir = dirname(dir);
  }
  throw Object.assign(new Error('Could not find repo root (pnpm-workspace.yaml)'), {
    code: 'PRECONDITION_FAILED',
    hint: 'Run ludi from the ludi monorepo after pnpm install',
  });
}

export function skillDir(root = findRepoRoot()): string {
  return join(root, '.cursor', 'skills', 'verify-ludi');
}

export function webBaselineDir(root = findRepoRoot()): string {
  return join(skillDir(root), 'baselines', 'web');
}

export function emulatorBaselineDir(root = findRepoRoot()): string {
  return join(skillDir(root), 'baselines', 'emulator');
}

export function mobileDir(root = findRepoRoot()): string {
  return join(root, 'apps', 'mobile');
}

export const OVERLAY = {
  width: 1080,
  height: 1920,
  deviceScaleFactor: 1,
} as const;

export const SAFE_ZONE = { x0: 100, x1: 980, y0: 40, y1: 1380 } as const;

export type OverlayScreenId =
  | 'overlay-intro'
  | 'overlay-waiting'
  | 'overlay-game'
  | 'overlay-turn'
  | 'overlay-winner';

export type OverlayScreenSpec = {
  id: OverlayScreenId;
  path: string;
  waitFor: WaitFor;
  file: string;
  wonder: string;
};

export const OVERLAY_SCREENS: readonly OverlayScreenSpec[] = [
  {
    id: 'overlay-intro',
    path: '/?demo=intro&settle=1',
    waitFor: { role: 'heading', name: 'LUDI' },
    file: 'overlay-intro.png',
    wonder: 'intro-screen',
  },
  {
    id: 'overlay-waiting',
    path: '/?demo=waiting&settle=1',
    waitFor: { role: 'heading', name: 'LUDI LIVE' },
    file: 'overlay-waiting.png',
    wonder: 'waiting-screen',
  },
  {
    id: 'overlay-game',
    path: '/?demo=game&settle=1',
    waitFor: { role: 'heading', name: 'LUDI LIVE' },
    file: 'overlay-game.png',
    wonder: 'v4-app-board',
  },
  {
    id: 'overlay-turn',
    path: '/?demo=turn&settle=1',
    waitFor: { role: 'heading', name: 'TURN!' },
    file: 'overlay-turn.png',
    wonder: 'v4-app-board',
  },
  {
    id: 'overlay-winner',
    path: '/?demo=winner&settle=1',
    waitFor: { role: 'heading', name: 'WINNER!' },
    file: 'overlay-winner.png',
    wonder: 'winner-screen',
  },
];

export const OVERLAY_SCREEN_IDS: readonly OverlayScreenId[] = OVERLAY_SCREENS.map((s) => s.id);

export function overlayDir(root = findRepoRoot()): string {
  return join(root, 'apps', 'live-overlay');
}

export function overlayBaselineDir(root = findRepoRoot()): string {
  return join(skillDir(root), 'baselines', 'overlay');
}

export function wonderDir(root = findRepoRoot()): string {
  return join(root, 'docs', 'live', 'wonder');
}

export function overlayById(id: string): OverlayScreenSpec | undefined {
  return OVERLAY_SCREENS.find((s) => s.id === id);
}

export function overlayScreensToRun(id: string): OverlayScreenSpec[] {
  if (id === 'all' || id === 'overlay') return [...OVERLAY_SCREENS];
  const spec = overlayById(id);
  return spec ? [spec] : [];
}

export function isOverlayScreen(id: string): boolean {
  return id === 'overlay' || id.startsWith('overlay-');
}

export type AdminScreenId =
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

export type AdminViewport = { width: number; height: number };

export type AdminScreenSpec = {
  id: AdminScreenId;
  path: string;
  waitFor: WaitFor;
  file: string;
  mockup: string;
  viewport: AdminViewport;
};

const ADMIN_SETUP: AdminViewport = { width: 1024, height: 640 };
const ADMIN_SETTINGS: AdminViewport = { width: 1024, height: 849 };
const ADMIN_DASH: AdminViewport = { width: 1024, height: 667 };
const ADMIN_BANNER: AdminViewport = { width: 1024, height: 738 };

export const ADMIN_SCREENS: readonly AdminScreenSpec[] = [
  {
    id: 'setup',
    path: '/?demo=setup&settle=1',
    waitFor: { role: 'heading', name: 'Get Ludi Live on your stream' },
    file: 'setup.png',
    mockup: 'setup.png',
    viewport: ADMIN_SETUP,
  },
  {
    id: 'setup-tikfinity-not-running',
    path: '/?demo=setup-tikfinity-not-running&settle=1',
    waitFor: { role: 'heading', name: 'Get Ludi Live on your stream' },
    file: 'setup-tikfinity-not-running.png',
    mockup: 'setup-tikfinity-not-running.png',
    viewport: ADMIN_SETUP,
  },
  {
    id: 'setup-connected',
    path: '/?demo=setup-connected&settle=1',
    waitFor: { role: 'heading', name: 'Get Ludi Live on your stream' },
    file: 'setup-connected.png',
    mockup: 'setup-connected.png',
    viewport: ADMIN_SETUP,
  },
  {
    id: 'settings',
    path: '/?demo=settings&settle=1',
    waitFor: { role: 'heading', name: 'Settings' },
    file: 'settings.png',
    mockup: 'settings.png',
    viewport: ADMIN_SETTINGS,
  },
  {
    id: 'dashboard',
    path: '/?demo=dashboard&settle=1',
    waitFor: { role: 'heading', name: 'GAME #24 · WHAT VIEWERS SEE NOW' },
    file: 'dashboard.png',
    mockup: 'live-dashboard.png',
    viewport: ADMIN_DASH,
  },
  {
    id: 'dashboard-reconnecting',
    path: '/?demo=dashboard-reconnecting&settle=1',
    waitFor: { role: 'heading', name: 'GAME #24 · WHAT VIEWERS SEE NOW' },
    file: 'dashboard-reconnecting.png',
    mockup: 'dashboard-reconnecting.png',
    viewport: ADMIN_BANNER,
  },
  {
    id: 'dashboard-disconnected',
    path: '/?demo=dashboard-disconnected&settle=1',
    waitFor: { role: 'heading', name: 'GAME #24 · WHAT VIEWERS SEE NOW' },
    file: 'dashboard-disconnected.png',
    mockup: 'dashboard-disconnected.png',
    viewport: ADMIN_BANNER,
  },
  {
    id: 'kick-confirm',
    path: '/?demo=kick-confirm&settle=1',
    waitFor: { role: 'heading', name: 'Kick @Sarah from the game?' },
    file: 'kick-confirm.png',
    mockup: 'kick-player-confirm.png',
    viewport: ADMIN_DASH,
  },
  {
    id: 'error-tikfinity-closed',
    path: '/?demo=error-tikfinity-closed&settle=1',
    waitFor: { role: 'heading', name: 'TikFinity stopped running' },
    file: 'error-tikfinity-closed.png',
    mockup: 'error-tikfinity-closed.png',
    viewport: ADMIN_SETUP,
  },
  {
    id: 'error-username-not-found',
    path: '/?demo=error-username-not-found&settle=1',
    waitFor: { role: 'heading', name: "We can't find that TikTok username" },
    file: 'error-username-not-found.png',
    mockup: 'error-username-not-found.png',
    viewport: ADMIN_SETUP,
  },
  {
    id: 'error-live-ended',
    path: '/?demo=error-live-ended&settle=1',
    waitFor: { role: 'heading', name: 'Your LIVE has ended' },
    file: 'error-live-ended.png',
    mockup: 'error-live-ended.png',
    viewport: ADMIN_SETUP,
  },
  {
    id: 'error-overlay-not-loaded',
    path: '/?demo=error-overlay-not-loaded&settle=1',
    waitFor: { role: 'heading', name: "Viewers can't see the game yet" },
    file: 'error-overlay-not-loaded.png',
    mockup: 'error-overlay-not-loaded.png',
    viewport: ADMIN_SETUP,
  },
  {
    id: 'error-port-in-use',
    path: '/?demo=error-port-in-use&settle=1',
    waitFor: { role: 'heading', name: "Another app is using Ludi Live's spot" },
    file: 'error-port-in-use.png',
    mockup: 'error-port-in-use.png',
    viewport: ADMIN_SETUP,
  },
];

export const ADMIN_SCREEN_IDS: readonly AdminScreenId[] = ADMIN_SCREENS.map((s) => s.id);

export function adminDir(root = findRepoRoot()): string {
  return join(root, 'apps', 'live-admin');
}

export function adminBaselineDir(root = findRepoRoot()): string {
  return join(skillDir(root), 'baselines', 'admin');
}

export function adminMockupDir(root = findRepoRoot()): string {
  return join(root, 'docs', 'live', 'admin');
}

export function adminById(id: string): AdminScreenSpec | undefined {
  return ADMIN_SCREENS.find((s) => s.id === id);
}

export function adminScreensToRun(id: string): AdminScreenSpec[] {
  if (id === 'all' || id === 'admin') return [...ADMIN_SCREENS];
  const spec = adminById(id);
  return spec ? [spec] : [];
}

export function isAdminScreen(id: string): boolean {
  return id === 'admin' || ADMIN_SCREEN_IDS.includes(id as AdminScreenId);
}
