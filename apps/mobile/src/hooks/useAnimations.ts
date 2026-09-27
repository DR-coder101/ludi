/**
 * Animation hooks using Reanimated for dancehall premium UI
 */

import { useEffect } from 'react';
import { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSpring, Easing } from 'react-native-reanimated';
import { motion } from '../theme/tokens';

/**
 * Pulse animation for current turn yard
 */
export function useYardPulse(isActive: boolean) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isActive) {
      scale.value = withRepeat(
        withTiming(motion.yardPulse.scale, {
          duration: motion.yardPulse.duration,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
    } else {
      scale.value = withTiming(1, { duration: 300 });
    }
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return animatedStyle;
}

/**
 * Pulse ring animation for movable piece
 */
export function useMovablePiecePulse(isMovable: boolean) {
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0);

  useEffect(() => {
    if (isMovable) {
      ringScale.value = withRepeat(
        withTiming(motion.movablePulse.ringScale, {
          duration: motion.movablePulse.duration,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
      ringOpacity.value = withRepeat(
        withTiming(motion.movablePulse.opacity, {
          duration: motion.movablePulse.duration,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
    } else {
      ringScale.value = withTiming(1, { duration: 300 });
      ringOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [isMovable]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  return ringStyle;
}

/**
 * Dice roll animation
 */
export function useDiceRoll(isRolling: boolean) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isRolling) {
      rotation.value = withRepeat(
        withTiming(360 * motion.diceRoll.rotations, {
          duration: motion.diceRoll.duration,
          easing: Easing.out(Easing.cubic),
        }),
        1,
        false
      );
    } else {
      rotation.value = withTiming(0, { duration: 200 });
    }
  }, [isRolling]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rotation.value}deg` }],
  }));

  return animatedStyle;
}

/**
 * Capture burst animation
 */
export function useCaptureBurst(shouldAnimate: boolean) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (shouldAnimate) {
      scale.value = withTiming(motion.captureBurst.scale, {
        duration: motion.captureBurst.duration / 2,
        easing: Easing.out(Easing.cubic),
      });
      opacity.value = withTiming(0, {
        duration: motion.captureBurst.duration,
        easing: Easing.out(Easing.cubic),
      });
      
      // Reset after animation
      setTimeout(() => {
        scale.value = 1;
        opacity.value = 1;
      }, motion.captureBurst.duration);
    }
  }, [shouldAnimate]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return animatedStyle;
}

/**
 * Slide-in animation for entrance
 */
export function useSlideIn(delay = 0) {
  const translateY = useSharedValue(50);
  const opacity = useSharedValue(0);

  useEffect(() => {
    setTimeout(() => {
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 100,
      });
      opacity.value = withTiming(1, { duration: 400 });
    }, delay);
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return animatedStyle;
}
