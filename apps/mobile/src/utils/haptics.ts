/**
 * Haptic feedback utility with Reduce Motion support
 */

import * as Haptics from 'expo-haptics';
import { AccessibilityInfo } from 'react-native';
import { haptics } from '../theme/tokens';

let isReduceMotionEnabled = false;

// Check Reduce Motion preference
AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
  isReduceMotionEnabled = enabled;
});

AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
  isReduceMotionEnabled = enabled;
});

/**
 * Trigger haptic feedback if Reduce Motion is not enabled
 */
export async function triggerHaptic(type: keyof typeof haptics): Promise<void> {
  if (isReduceMotionEnabled) {
    return; // Skip haptics when Reduce Motion is enabled
  }

  try {
    switch (type) {
      case 'roll':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'move':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'capture':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'blocked':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'win':
        // Multi-pulse celebration for win
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 100);
        setTimeout(() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 200);
        break;
    }
  } catch (error) {
    console.warn('Haptic feedback failed:', error);
  }
}

/**
 * Check if Reduce Motion is enabled
 */
export function isReduceMotion(): boolean {
  return isReduceMotionEnabled;
}
