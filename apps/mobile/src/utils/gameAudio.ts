import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

export type SoundType = 'roll' | 'hop' | 'capture' | 'win';

class GameAudio {
  private sounds: Map<SoundType, Audio.Sound> = new Map();
  private isEnabled = true;

  async initialize() {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
    } catch (error) {
      console.warn('Audio initialization failed:', error);
    }
  }

  async loadSounds() {
    const soundDefinitions: Record<SoundType, any> = {
      roll: require('../../assets/sounds/roll.mp3'),
      hop: require('../../assets/sounds/hop.mp3'),
      capture: require('../../assets/sounds/capture.mp3'),
      win: require('../../assets/sounds/win.mp3'),
    };

    try {
      for (const [type, source] of Object.entries(soundDefinitions)) {
        const { sound } = await Audio.Sound.createAsync(source);
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
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  async cleanup() {
    for (const sound of this.sounds.values()) {
      await sound.unloadAsync();
    }
    this.sounds.clear();
  }
}

export const gameAudio = new GameAudio();

export const triggerHaptic = {
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  selection: () => Haptics.selectionAsync(),
};
