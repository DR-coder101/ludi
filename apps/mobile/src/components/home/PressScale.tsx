import React, { type ReactNode } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { motion } from '../../theme/tokens';
import { triggerHaptic } from '../../utils/gameAudio';

interface PressScaleProps {
  label: string;
  hint?: string;
  onPress?: () => void;
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Layout style for the pressable itself (flex in a row). */
  containerStyle?: StyleProp<ViewStyle>;
  /** Receives the 0→1 press progress, for pressed-state overlays. */
  children: (pressed: SharedValue<number>) => ReactNode;
}

/** Button press from tokens.md: scale 0.97 over 90 ms with a light haptic. */
export function PressScale({ label, hint, onPress, busy, style, containerStyle, children }: PressScaleProps) {
  const pressed = useSharedValue(0);
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 - pressed.value * (1 - motion.pressScale) }] }));
  const disabled = !onPress || busy;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled: !!disabled, busy: !!busy }}
      disabled={disabled}
      style={containerStyle}
      onPressIn={() => {
        pressed.value = withTiming(1, { duration: motion.pressMs });
      }}
      onPressOut={() => {
        pressed.value = withTiming(0, { duration: motion.pressMs });
      }}
      onPress={() => {
        triggerHaptic.light();
        onPress?.();
      }}
    >
      <Animated.View style={[style, scaleStyle]}>{children(pressed)}</Animated.View>
    </Pressable>
  );
}
