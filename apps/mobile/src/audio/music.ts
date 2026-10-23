import themeAsset from '../../assets/audio/theme.mp3';

export const themeSource = themeAsset;

export type ThemeClipId = 'lobby' | 'sting';

export type ThemeClip = {
  id: ThemeClipId;
  source: typeof themeSource;
  startMs: number;
  endMs: number;
  loop: boolean;
  volume: number;
  fadeMs: number;
};

export const THEME_DURATION_MS = 122_440;

export const themeClips: Record<ThemeClipId, ThemeClip> = {
  lobby: {
    id: 'lobby',
    source: themeSource,
    startMs: 0,
    endMs: THEME_DURATION_MS,
    loop: true,
    volume: 0.35,
    fadeMs: 600,
  },
  sting: {
    id: 'sting',
    source: themeSource,
    startMs: 105_000,
    endMs: 108_000,
    loop: false,
    volume: 0.5,
    fadeMs: 80,
  },
};

export type MusicSurface = 'lobby' | 'match';
export type AppPresence = 'active' | 'background';
export type LobbyWanted = 'play' | 'pause' | 'stop';

export function surfaceFromPath(pathname: string): MusicSurface {
  const path = pathname.split('?')[0].replace(/\/+$/, '') || '/';
  if (path === '/game' || path.startsWith('/game/') || path === '/dev/board') {
    return 'match';
  }
  return 'lobby';
}

export function lobbyWanted(input: {
  surface: MusicSurface;
  presence: AppPresence;
  enabled: boolean;
}): LobbyWanted {
  if (!input.enabled || input.surface === 'match') return 'stop';
  if (input.presence !== 'active') return 'pause';
  return 'play';
}

export type LobbyCommand =
  | { type: 'start-lobby'; clip: ThemeClip }
  | { type: 'resume-lobby'; clip: ThemeClip }
  | { type: 'pause-lobby' }
  | { type: 'stop-lobby' }
  | { type: 'noop' };

export type StingCommand = { type: 'play-sting'; clip: ThemeClip } | { type: 'noop' };

export function lobbyCommand(wanted: LobbyWanted, current: LobbyWanted | 'idle'): LobbyCommand {
  if (wanted === current) return { type: 'noop' };
  if (wanted === 'play') {
    if (current === 'pause') return { type: 'resume-lobby', clip: themeClips.lobby };
    return { type: 'start-lobby', clip: themeClips.lobby };
  }
  if (wanted === 'pause') {
    if (current === 'play') return { type: 'pause-lobby' };
    return { type: 'noop' };
  }
  if (current === 'idle' || current === 'stop') return { type: 'noop' };
  return { type: 'stop-lobby' };
}

export function stingCommand(enabled: boolean): StingCommand {
  if (!enabled) return { type: 'noop' };
  return { type: 'play-sting', clip: themeClips.sting };
}
