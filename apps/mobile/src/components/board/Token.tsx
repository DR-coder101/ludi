import React, { useEffect } from 'react';
import { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import type { Color } from './boardLayout';
import { COLORS } from './boardLayout';

interface TokenProps {
  color: Color;
  x: number;
  y: number;
  cellSize: number;
  isLegal?: boolean;
  onPress?: () => void;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const Token: React.FC<TokenProps> = ({
  color,
  x,
  y,
  cellSize,
  isLegal = false,
  onPress,
}) => {
  const radius = cellSize * 0.35;
  const centerX = x * cellSize + cellSize / 2;
  const centerY = y * cellSize + cellSize / 2;

  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (isLegal) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 200 });
    }
  }, [isLegal]);

  const animatedOuterProps = useAnimatedProps(() => ({
    r: radius * pulseScale.value,
  }));

  const animatedHighlightProps = useAnimatedProps(() => ({
    r: radius * 1.3 * pulseScale.value,
    opacity: isLegal ? 0.3 : 0,
  }));

  return (
    <>
      {isLegal && (
        <AnimatedCircle
          cx={centerX}
          cy={centerY}
          animatedProps={animatedHighlightProps}
          fill={COLORS[color]}
          onPress={onPress}
        />
      )}
      <AnimatedCircle
        cx={centerX}
        cy={centerY}
        animatedProps={animatedOuterProps}
        fill={COLORS[color]}
        stroke="#000"
        strokeWidth={cellSize * 0.03}
        onPress={onPress}
      />
      <Circle
        cx={centerX}
        cy={centerY}
        r={radius * 0.4}
        fill="rgba(255, 255, 255, 0.3)"
        onPress={onPress}
      />
    </>
  );
};
