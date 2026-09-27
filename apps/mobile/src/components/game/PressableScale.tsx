import React from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { motion as M } from '../../theme/tokens';
import { triggerHaptic } from '../../utils/gameAudio';

interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

/** Press feedback from the spec: scale 0.97 over 90 ms and a light impact. */
export function PressableScale({ style, children, onPressIn, onPressOut, onPress, disabled, ...rest }: PressableScaleProps) {
  const pressed = useSharedValue(0);
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - (1 - M.pressScale) * pressed.value }],
  }));
  return (
    <Pressable
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        pressed.value = withTiming(1, { duration: M.pressMs });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.value = withTiming(0, { duration: M.pressMs });
        onPressOut?.(e);
      }}
      onPress={(e) => {
        triggerHaptic.light();
        onPress?.(e);
      }}
    >
      <Animated.View style={[style, animated]}>{children}</Animated.View>
    </Pressable>
  );
}
