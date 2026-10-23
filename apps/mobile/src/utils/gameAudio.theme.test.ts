import { afterEach, describe, expect, it, vi } from 'vitest';
import { themeClips, themeSource } from '../audio/music';
import { GameAudio, type PlaybackInitial, type SoundHandle } from './gameAudio';

vi.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: async () => {},
    Sound: {
      createAsync: async () => ({ sound: {} }),
    },
  },
}));

vi.mock('expo-haptics', () => ({
  impactAsync: async () => {},
  notificationAsync: async () => {},
  selectionAsync: async () => {},
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

type CreateCall = { source: unknown; initial: PlaybackInitial };

function fakeSound(): SoundHandle & { stopped: boolean } {
  const handle = {
    stopped: false,
    playAsync: async () => {},
    pauseAsync: async () => {},
    stopAsync: async () => {
      handle.stopped = true;
    },
    unloadAsync: async () => {},
    replayAsync: async () => {},
    setVolumeAsync: async () => {},
    setOnPlaybackStatusUpdate: () => {},
  };
  return handle;
}

function makeAudio() {
  const created: CreateCall[] = [];
  const sounds: Array<ReturnType<typeof fakeSound>> = [];
  const audio = new GameAudio({
    setMode: async () => {},
    create: async (source, initial) => {
      created.push({ source, initial });
      const sound = fakeSound();
      sounds.push(sound);
      return sound;
    },
  });
  return { audio, created, sounds };
}

describe('GameAudio theme playback', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts a looping lobby from the theme file', async () => {
    vi.useFakeTimers();
    const { audio, created } = makeAudio();
    const play = audio.setSurface('lobby');
    await vi.advanceTimersByTimeAsync(600);
    await play;
    expect(created).toEqual([
      {
        source: themeSource,
        initial: {
          isLooping: true,
          volume: 0,
          shouldPlay: true,
          positionMillis: themeClips.lobby.startMs,
          progressUpdateIntervalMillis: 250,
        },
      },
    ]);
  });

  it('stops lobby music when entering a match', async () => {
    vi.useFakeTimers();
    const { audio, sounds } = makeAudio();
    const start = audio.setSurface('lobby');
    await vi.advanceTimersByTimeAsync(600);
    await start;
    const stop = audio.setSurface('match');
    await vi.advanceTimersByTimeAsync(600);
    await stop;
    expect(sounds[0]?.stopped).toBe(true);
  });

  it('pauses lobby music when the app backgrounds', async () => {
    vi.useFakeTimers();
    const { audio, sounds } = makeAudio();
    const start = audio.setSurface('lobby');
    await vi.advanceTimersByTimeAsync(600);
    await start;
    const sound = sounds[0];
    expect(sound).toBeTruthy();
    const pauseSpy = vi.spyOn(sound!, 'pauseAsync');
    const background = audio.setPresence('background');
    await vi.advanceTimersByTimeAsync(600);
    await background;
    expect(pauseSpy).toHaveBeenCalledTimes(1);
  });

  it('plays the win sting from the same theme offsets and skips it when muted', async () => {
    const { audio, created } = makeAudio();
    await audio.play('win');
    expect(created).toEqual([
      {
        source: themeSource,
        initial: {
          isLooping: false,
          volume: themeClips.sting.volume,
          shouldPlay: true,
          positionMillis: themeClips.sting.startMs,
          progressUpdateIntervalMillis: 100,
        },
      },
    ]);

    const muted = makeAudio();
    muted.audio.setEnabled(false);
    await muted.audio.play('win');
    expect(muted.created).toEqual([]);
  });
});
