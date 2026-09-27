/**
 * Haptic feedback utility with Reduce Motion support
 * 
 * APPROVED SPEC haptics patterns:
 * - light: Per landing during piece slide
 * - medium: Roll selection, entry to track
 * - heavy: Capture
 * - success: Dice 6, piece reaching home, win
 * - warning: Blocked move
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
      case 'light':
        // Per landing during piece slide
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        // Roll selection, entry to track
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        // Capture
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'success':
        // Dice 6, piece reaching home, win (x2 for win)
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        // Blocked move
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
    }
  } catch (error) {
    console.warn('Haptic feedback failed:', error);
  }
}

/**
 * Win celebration haptics (success x2)
 */
export async function triggerWinHaptics(): Promise<void> {
  if (isReduceMotionEnabled) return;
  
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 150);
  } catch (error) {
    console.warn('Win haptic feedback failed:', error);
  }
}

/**
 * Check if Reduce Motion is enabled
 */
export function isReduceMotion(): boolean {
  return isReduceMotionEnabled;
}
