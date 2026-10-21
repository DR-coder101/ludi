import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  lobbyCommand,
  lobbyWanted,
  stingCommand,
  themeClips,
  type AppPresence,
  type LobbyWanted,
  type MusicSurface,
} from '../audio/music';

export type SoundType = 'roll' | 'hop' | 'capture' | 'win';

export type PlaybackInitial = {
  isLooping?: boolean;
  volume?: number;
  shouldPlay?: boolean;
  positionMillis?: number;
  progressUpdateIntervalMillis?: number;
};

export type SoundHandle = {
  playAsync(): Promise<unknown>;
  pauseAsync(): Promise<unknown>;
  stopAsync(): Promise<unknown>;
  unloadAsync(): Promise<unknown>;
  replayAsync(): Promise<unknown>;
  setVolumeAsync(volume: number): Promise<unknown>;
  setOnPlaybackStatusUpdate(
    cb:
      | ((status: { isLoaded: boolean; positionMillis?: number; didJustFinish?: boolean }) => void)
      | null,
  ): void;
};

export type AudioBackend = {
  setMode(): Promise<void>;
  create(source: unknown, initial: PlaybackInitial): Promise<SoundHandle>;
};

const expoBackend: AudioBackend = {
  async setMode() {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });
  },
  async create(source, initial) {
    const { sound } = await Audio.Sound.createAsync(
      source as Parameters<typeof Audio.Sound.createAsync>[0],
      initial,
    );
    return sound;
  },
};

export class GameAudio {
  private sounds: Map<SoundType, SoundHandle> = new Map();
  private isEnabled = true;
  private surface: MusicSurface = 'lobby';
  private presence: AppPresence = 'active';
  private lobbyState: LobbyWanted | 'idle' = 'idle';
  private lobbySound: SoundHandle | null = null;
  private stingSound: SoundHandle | null = null;
  private fadeTimer: ReturnType<typeof setInterval> | null = null;
  private fadeGen = 0;
  private fadeVolume = 0;

  constructor(private readonly backend: AudioBackend = expoBackend) {}

  async initialize() {
    try {
      await this.backend.setMode();
    } catch (error) {
      console.warn('Audio initialization failed:', error);
    }
  }

  async loadSounds() {
    const soundDefinitions: Record<SoundType, number> = {
      roll: require('../../assets/sounds/roll.mp3'),
      hop: require('../../assets/sounds/hop.mp3'),
      capture: require('../../assets/sounds/capture.mp3'),
      win: require('../../assets/sounds/win.mp3'),
    };

    try {
      for (const [type, source] of Object.entries(soundDefinitions)) {
        const sound = await this.backend.create(source, {});
        this.sounds.set(type as SoundType, sound);
      }
    } catch (error) {
      console.warn('Failed to load sounds:', error);
    }
  }

  async play(type: SoundType) {
    if (!this.isEnabled) return;

    try {
      const sound = this.sounds.get(type);
      if (sound) {
        await sound.replayAsync();
      }
    } catch (error) {
      console.warn(`Failed to play sound: ${type}`, error);
    }

    if (type === 'win') {
      await this.playSting();
    }
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled) {
      void this.stopSting();
    }
    void this.syncLobby();
  }

  async setSurface(surface: MusicSurface) {
    this.surface = surface;
    await this.syncLobby();
  }

  async setPresence(presence: AppPresence) {
    this.presence = presence;
    await this.syncLobby();
  }

  async cleanup() {
    for (const sound of this.sounds.values()) {
      await sound.unloadAsync();
    }
    this.sounds.clear();
  }

  private async syncLobby() {
    const wanted = lobbyWanted({
      surface: this.surface,
      presence: this.presence,
      enabled: this.isEnabled,
    });
    let command = lobbyCommand(wanted, this.lobbyState);
    if (command.type === 'resume-lobby' && !this.lobbySound) {
      command = { type: 'start-lobby', clip: command.clip };
    }
    if (command.type === 'noop') return;
    this.lobbyState = wanted;
    try {
      if (command.type === 'start-lobby') {
        await this.stopSting();
        await this.stopLobbySound();
        this.lobbySound = await this.backend.create(command.clip.source, {
          isLooping: command.clip.loop,
          volume: 0,
          shouldPlay: true,
          positionMillis: command.clip.startMs,
          progressUpdateIntervalMillis: 250,
        });
        this.fadeVolume = 0;
        await this.fade(this.lobbySound, command.clip.volume, command.clip.fadeMs);
        return;
      }
      if (command.type === 'resume-lobby') {
        if (!this.lobbySound) return;
        await this.lobbySound.setVolumeAsync(0);
        this.fadeVolume = 0;
        await this.lobbySound.playAsync();
        await this.fade(this.lobbySound, command.clip.volume, command.clip.fadeMs);
        return;
      }
      if (command.type === 'pause-lobby') {
        if (!this.lobbySound) return;
        await this.fade(this.lobbySound, 0, themeClips.lobby.fadeMs);
        await this.lobbySound.pauseAsync();
        return;
      }
      await this.fadeOutAndStopLobby();
    } catch (error) {
      console.warn('Theme music failed:', error);
      this.lobbyState = 'stop';
    }
  }

  private async playSting() {
    const command = stingCommand(this.isEnabled);
    if (command.type === 'noop') return;
    try {
      await this.stopSting();
      const clip = command.clip;
      const sound = await this.backend.create(clip.source, {
        isLooping: clip.loop,
        volume: clip.volume,
        shouldPlay: true,
        positionMillis: clip.startMs,
        progressUpdateIntervalMillis: 100,
      });
      this.stingSound = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        if ((status.positionMillis ?? 0) >= clip.endMs || status.didJustFinish) {
          void this.stopSting();
        }
      });
    } catch (error) {
      console.warn('Failed to play win sting:', error);
    }
  }

  private async fade(sound: SoundHandle, to: number, ms: number) {
    const gen = ++this.fadeGen;
    if (this.fadeTimer) {
      clearInterval(this.fadeTimer);
      this.fadeTimer = null;
    }
    if (ms <= 0) {
      this.fadeVolume = to;
      await sound.setVolumeAsync(to);
      return;
    }
    const from = this.fadeVolume;
    const steps = Math.max(1, Math.round(ms / 50));
    await new Promise<void>((resolve) => {
      let step = 0;
      this.fadeTimer = setInterval(() => {
        if (gen !== this.fadeGen) {
          resolve();
          return;
        }
        step += 1;
        const volume = from + ((to - from) * step) / steps;
        this.fadeVolume = volume;
        void sound.setVolumeAsync(volume);
        if (step >= steps) {
          if (this.fadeTimer) clearInterval(this.fadeTimer);
          this.fadeTimer = null;
          resolve();
        }
      }, 50);
    });
  }

  private async fadeOutAndStopLobby() {
    if (this.lobbySound) {
      await this.fade(this.lobbySound, 0, themeClips.lobby.fadeMs);
    }
    await this.stopLobbySound();
  }

  private async stopLobbySound() {
    if (!this.lobbySound) return;
    const sound = this.lobbySound;
    this.lobbySound = null;
    try {
      await sound.stopAsync();
      await sound.unloadAsync();
    } catch {
      return;
    }
  }

  private async stopSting() {
    if (!this.stingSound) return;
    const sound = this.stingSound;
    this.stingSound = null;
    sound.setOnPlaybackStatusUpdate(null);
    try {
      await sound.stopAsync();
      await sound.unloadAsync();
    } catch {
      return;
    }
  }
}

export const gameAudio = new GameAudio();

/** expo-haptics rejects on web; there is no vibration motor to drive there anyway. */
const haptic = (fire: () => Promise<void>) => () => {
  if (Platform.OS === 'web') return;
  fire().catch(() => {});
};

export const triggerHaptic = {
  light: haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  medium: haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  heavy: haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
  success: haptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: haptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  error: haptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
  selection: haptic(() => Haptics.selectionAsync()),
};
