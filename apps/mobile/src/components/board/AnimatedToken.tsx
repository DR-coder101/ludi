import React, { useEffect } from 'react';
import { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withSpring,
  withSequence,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import type { Color } from './boardLayout';
import { COLORS } from './boardLayout';
import { gameAudio, triggerHaptic } from '../../utils/gameAudio';

interface AnimatedTokenProps {
  color: Color;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  cellSize: number;
  onAnimationComplete?: () => void;
  isCaptured?: boolean;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const AnimatedToken: React.FC<AnimatedTokenProps> = ({
  color,
  startX,
  startY,
  endX,
  endY,
  cellSize,
  onAnimationComplete,
  isCaptured = false,
}) => {
  const radius = cellSize * 0.35;
  
  const x = useSharedValue(startX * cellSize + cellSize / 2);
  const y = useSharedValue(startY * cellSize + cellSize / 2);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (isCaptured) {
      gameAudio.play('capture');
      triggerHaptic.heavy();
      
      scale.value = withSequence(
        withSpring(1.5, { damping: 8 }),
        withTiming(0, { duration: 200 })
      );
      opacity.value = withTiming(0, { duration: 300 }, (finished) => {
        if (finished && onAnimationComplete) {
          runOnJS(onAnimationComplete)();
        }
      });
    } else {
      gameAudio.play('hop');
      triggerHaptic.light();
      
      const targetX = endX * cellSize + cellSize / 2;
      const targetY = endY * cellSize + cellSize / 2;
      
      const distance = Math.sqrt(
        Math.pow(targetX - (startX * cellSize + cellSize / 2), 2) +
        Math.pow(targetY - (startY * cellSize + cellSize / 2), 2)
      );
      
      const duration = Math.min(800, Math.max(300, distance * 1.5));

      x.value = withTiming(targetX, {
        duration,
        easing: Easing.inOut(Easing.ease),
      });
      
      y.value = withSequence(
        withTiming(targetY - cellSize * 0.8, {
          duration: duration / 2,
          easing: Easing.out(Easing.ease),
        }),
        withTiming(targetY, {
          duration: duration / 2,
          easing: Easing.in(Easing.ease),
        }, (finished) => {
          if (finished && onAnimationComplete) {
            runOnJS(onAnimationComplete)();
          }
        })
      );
      
      scale.value = withSequence(
        withSpring(1.15, { damping: 10 }),
        withSpring(1, { damping: 10 })
      );
    }
  }, [startX, startY, endX, endY, cellSize, isCaptured]);

  const animatedProps = useAnimatedProps(() => ({
    cx: x.value,
    cy: y.value,
    r: radius * scale.value,
    opacity: opacity.value,
  }));

  const animatedHighlightProps = useAnimatedProps(() => ({
    cx: x.value,
    cy: y.value,
    r: radius * 0.4 * scale.value,
    opacity: opacity.value,
  }));

  return (
    <>
      <AnimatedCircle
        animatedProps={animatedProps}
        fill={COLORS[color]}
        stroke="#000"
        strokeWidth={cellSize * 0.03}
      />
      <AnimatedCircle
        animatedProps={animatedHighlightProps}
        fill="rgba(255, 255, 255, 0.3)"
      />
    </>
  );
};
