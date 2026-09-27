/**
 * Animation hooks using Reanimated for dancehall premium UI
 * 
 * APPROVED SPEC motion:
 * - Piece slide: 110ms per cell, ease-out-quad, 1.08 bounce
 * - Entry: 260ms spring (damping 14)
 * - Dice: 600-750ms 3D tumble, 120ms overshoot
 * - Legal move: 900ms pulse loop
 * - Yard glow: 1.6s breath
 * - Capture: 350ms burst, 450ms arc
 * - Win: 280ms slam spring, 40s rays, 2.5s confetti
 * - Buttons: 90ms press to 0.97
 * - Reduce Motion: 200ms cross-fade
 */

import { useEffect } from 'react';
import { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSpring, Easing, withSequence } from 'react-native-reanimated';
import { motion } from '../theme/tokens';
import { isReduceMotion } from '../utils/haptics';

/**
 * Pulse animation for current turn yard (1.6s breath)
 */
export function useYardPulse(isActive: boolean) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isActive) {
      if (isReduceMotion()) {
        // No pulse animation
        scale.value = 1;
      } else {
        scale.value = withRepeat(
          withSequence(
            withTiming(1.05, {
              duration: motion.yardGlowBreath / 2,
              easing: Easing.inOut(Easing.ease),
            }),
            withTiming(1, {
              duration: motion.yardGlowBreath / 2,
              easing: Easing.inOut(Easing.ease),
            })
          ),
          -1,
          false
        );
      }
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
 * Pulse ring animation for legal move (900ms gold ring)
 */
export function useMovablePiecePulse(isMovable: boolean) {
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0);

  useEffect(() => {
    if (isMovable) {
      if (isReduceMotion()) {
        // Static highlight
        ringScale.value = 1.15;
        ringOpacity.value = 0.4;
      } else {
        ringScale.value = withRepeat(
          withTiming(1.15, {
            duration: motion.legalMovePulse,
            easing: Easing.inOut(Easing.ease),
          }),
          -1,
          true
        );
        ringOpacity.value = withRepeat(
          withTiming(0.4, {
            duration: motion.legalMovePulse,
            easing: Easing.inOut(Easing.ease),
          }),
          -1,
          true
        );
      }
    } else {
      ringScale.value = withTiming(1, { duration: motion.crossFade });
      ringOpacity.value = withTiming(0, { duration: motion.crossFade });
    }
  }, [isMovable]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  return ringStyle;
}

/**
 * Dice roll animation (600-750ms with overshoot)
 */
export function useDiceRoll(isRolling: boolean) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isRolling) {
      if (isReduceMotion()) {
        // No animation, just cross-fade
        rotation.value = 0;
        scale.value = withSequence(
          withTiming(0, { duration: motion.crossFade / 2 }),
          withTiming(1, { duration: motion.crossFade / 2 })
        );
      } else {
        // 3D tumble
        rotation.value = withTiming(360 * 3, {
          duration: 680, // Mid-range of 600-750
          easing: Easing.out(Easing.cubic),
        });
        // Overshoot bounce
        scale.value = withSequence(
          withTiming(1.1, { duration: 560 }),
          withTiming(0.95, { duration: motion.diceOvershoot / 2 }),
          withTiming(1, { duration: motion.diceOvershoot / 2 })
        );
      }
    } else {
      rotation.value = withTiming(0, { duration: motion.crossFade });
      scale.value = withTiming(1, { duration: motion.crossFade });
    }
  }, [isRolling]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotateZ: `${rotation.value}deg` },
      { rotateX: `${rotation.value * 0.5}deg` },
      { scale: scale.value },
    ],
  }));

  return animatedStyle;
}

/**
 * Capture burst animation (350ms burst + 450ms arc)
 */
export function useCaptureBurst(shouldAnimate: boolean) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (shouldAnimate) {
      if (isReduceMotion()) {
        // Cross-fade out
        opacity.value = withTiming(0, { duration: motion.crossFade });
      } else {
        // Burst scale
        scale.value = withTiming(1.5, {
          duration: motion.captureBurst,
          easing: Easing.out(Easing.cubic),
        });
        opacity.value = withTiming(0, {
          duration: motion.captureBurst,
          easing: Easing.out(Easing.cubic),
        });
      }
      
      // Reset after animation
      setTimeout(() => {
        scale.value = 1;
        opacity.value = 1;
      }, motion.captureBurst);
    }
  }, [shouldAnimate]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return animatedStyle;
}

/**
 * Slide-in animation for entrance (spring)
 */
export function useSlideIn(delay = 0) {
  const translateY = useSharedValue(50);
  const opacity = useSharedValue(0);

  useEffect(() => {
    setTimeout(() => {
      if (isReduceMotion()) {
        // Just fade in
        translateY.value = 0;
        opacity.value = withTiming(1, { duration: motion.crossFade });
      } else {
        translateY.value = withSpring(0, {
          damping: 15,
          stiffness: 100,
        });
        opacity.value = withTiming(1, { duration: 400 });
      }
    }, delay);
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return animatedStyle;
}

/**
 * Button press animation (90ms to 0.97 scale)
 */
export function useButtonPress(isPressed: boolean) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isReduceMotion()) {
      scale.value = 1; // No press animation
    } else {
      scale.value = withTiming(isPressed ? motion.buttonScale : 1, {
        duration: motion.buttonPress,
        easing: Easing.out(Easing.ease),
      });
    }
  }, [isPressed]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return animatedStyle;
}

/**
 * Win card slam animation (280ms spring, scale 1.15 to 1)
 */
export function useWinSlam() {
  const scale = useSharedValue(motion.winSlamScale);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isReduceMotion()) {
      scale.value = 1;
      opacity.value = withTiming(1, { duration: motion.crossFade });
    } else {
      scale.value = withSpring(1, {
        damping: 12,
        stiffness: 150,
        mass: 1,
      });
      opacity.value = withTiming(1, { duration: motion.winSlam });
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return animatedStyle;
}
