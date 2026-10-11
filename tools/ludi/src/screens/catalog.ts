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
      name: 'Ludi. Jamaican Ludo, Negril to Kingston. Four corners, one board.',
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
    waitFor: { role: 'button', name: 'Leave video call' },
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
