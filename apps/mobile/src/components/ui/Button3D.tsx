import React, { type ReactNode, useId, useState } from 'react';
import { Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { BUTTON_3D, BUTTON_3D_PRESS_MS, button3DShadow, type Button3DTone } from '../../theme/threeD';
import { cssShadow } from '../home/cssShadow';
import { triggerHaptic } from '../../utils/gameAudio';
import { FaceFill } from './FaceFill';

export function Button3D({
  tone,
  label,
  hint,
  onPress,
  busy,
  compact,
  style,
  children,
}: {
  tone: Button3DTone;
  label: string;
  hint?: string;
  onPress?: () => void;
  busy?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const recipe = BUTTON_3D[tone];
  const pressed = useSharedValue(0);
  const [down, setDown] = useState(false);
  const disabled = !onPress || busy;
  const gid = useId().replace(/:/g, '');
  const radius = compact ? 12 : recipe.radius;
  const lip = down || disabled ? recipe.lipPressed : recipe.lipRest;
  const motionStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pressed.value * recipe.pressY }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled: !!disabled, busy: !!busy }}
      disabled={disabled}
      style={[{ marginBottom: recipe.lipRest }, style]}
      onPressIn={() => {
        setDown(true);
        pressed.value = withTiming(1, { duration: BUTTON_3D_PRESS_MS });
      }}
      onPressOut={() => {
        setDown(false);
        pressed.value = withTiming(0, { duration: BUTTON_3D_PRESS_MS });
      }}
      onPress={() => {
        triggerHaptic.light();
        onPress?.();
      }}
    >
      <Animated.View style={motionStyle}>
        {Platform.OS === 'web' ? null : (
          <View
            pointerEvents="none"
            style={[
              styles.lip,
              {
                backgroundColor: recipe.lip,
                borderRadius: radius,
                bottom: -lip,
              },
            ]}
          />
        )}
        <View
          style={[
            styles.face,
            {
              borderRadius: radius,
              borderColor: recipe.border,
              backgroundColor: recipe.face[recipe.face.length - 1]?.color,
              paddingVertical: compact ? 8 : 13,
              paddingHorizontal: compact ? 12 : 2,
              opacity: disabled ? 0.7 : 1,
            },
            Platform.OS === 'web'
              ? ({ boxShadow: button3DShadow(tone, down || !!disabled) } as ViewStyle)
              : cssShadow(0, recipe.glowY, recipe.glowBlur, recipe.glowColor, down ? 0.12 : recipe.glowOpacity, down ? 2 : 8),
          ]}
        >
          <FaceFill id={`btn3d-${tone}-${gid}`} stops={recipe.face} axis="b" />
          <View pointerEvents="none" style={[styles.highlight, { backgroundColor: recipe.highlight, borderRadius: radius }]} />
          <View style={styles.row}>{children}</View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  lip: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 4,
  },
  face: {
    overflow: 'hidden',
    borderWidth: 1,
  },
  highlight: {
    position: 'absolute',
    left: 1,
    right: 1,
    top: 1,
    height: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    zIndex: 1,
  },
});
