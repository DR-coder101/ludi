import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  lobbyCommand,
  lobbyWanted,
  stingCommand,
  surfaceFromPath,
  themeClips,
  themeSource,
} from './music';

describe('theme clips', () => {
  it('plays and loops the lobby from the one theme file', () => {
    const command = lobbyCommand('play', 'idle');
    expect(command).toEqual({ type: 'start-lobby', clip: themeClips.lobby });
    expect(command.type === 'start-lobby' ? command.clip : null).toEqual({
      id: 'lobby',
      source: themeSource,
      startMs: 0,
      endMs: themeClips.lobby.endMs,
      loop: true,
      volume: 0.35,
      fadeMs: 600,
    });
  });

  it('cuts the win sting from the same theme file by start and end offsets', () => {
    const command = stingCommand(true);
    expect(command.type).toBe('play-sting');
    if (command.type !== 'play-sting') return;
    expect(command.clip.source).toBe(themeSource);
    expect(command.clip.source).toBe(themeClips.lobby.source);
    expect(command.clip.loop).toBe(false);
    expect(command.clip.endMs - command.clip.startMs).toBe(3_000);
    expect(command.clip.startMs).toBeGreaterThanOrEqual(0);
    expect(command.clip.endMs).toBeLessThanOrEqual(themeClips.lobby.endMs);
  });

  it('keeps the only theme require in music.ts so swapping theme.mp3 needs no code change', () => {
    const mobileRoot = join(__dirname, '../..');
    const hits: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name === 'dist') continue;
        const path = join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(path);
          continue;
        }
        if (!/\.(ts|tsx|js|jsx)$/.test(entry.name) || entry.name.includes('.test.')) continue;
        if (readFileSync(path, 'utf8').includes('assets/audio/theme.mp3')) {
          hits.push(path.slice(mobileRoot.length));
        }
      }
    };
    walk(join(mobileRoot, 'src'));
    walk(join(mobileRoot, 'app'));
    expect(hits).toEqual(['/src/audio/music.ts']);
    expect(themeClips.lobby.source).toBe(themeSource);
    expect(themeClips.sting.source).toBe(themeSource);
  });
});

describe('lobbyWanted', () => {
  it('stops theme music on a match board', () => {
    expect(
      lobbyWanted({ surface: 'match', presence: 'active', enabled: true }),
    ).toBe('stop');
    expect(lobbyCommand('stop', 'play')).toEqual({ type: 'stop-lobby' });
    expect(surfaceFromPath('/game')).toBe('match');
    expect(surfaceFromPath('/game/7X8K9')).toBe('match');
    expect(surfaceFromPath('/dev/board')).toBe('match');
  });

  it('pauses theme music when the app backgrounds on a lobby screen', () => {
    expect(
      lobbyWanted({ surface: 'lobby', presence: 'background', enabled: true }),
    ).toBe('pause');
    expect(lobbyCommand('pause', 'play')).toEqual({ type: 'pause-lobby' });
    expect(surfaceFromPath('/')).toBe('lobby');
    expect(surfaceFromPath('/lobby/7X8K9')).toBe('lobby');
  });

  it('respects mute for the lobby loop and the win sting', () => {
    expect(
      lobbyWanted({ surface: 'lobby', presence: 'active', enabled: false }),
    ).toBe('stop');
    expect(lobbyCommand('stop', 'play')).toEqual({ type: 'stop-lobby' });
    expect(stingCommand(false)).toEqual({ type: 'noop' });
  });
});
