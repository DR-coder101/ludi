import React, { useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { triggerHaptic } from '../../utils/gameAudio';
import { DIE_ROLL_BEATS, DIE_ROLL_MS, dieFace } from './dieFace';
import { DIE_SHADOW_SOURCE, dieFaceSource } from './dieSprites';

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const EASE_MOVE = Easing.bezier(0.77, 0, 0.175, 1);

interface DiceFaceProps {
  value: number;
  size: number;
  rollKey: number;
  idle: boolean;
  spin?: 1 | -1;
  buzz?: boolean;
}

export function DiceFace({ value, size, rollKey, idle, spin: dir = 1, buzz }: DiceFaceProps) {
  const reduce = useReducedMotion();
  const [face, setFace] = useState(() => dieFace(value));
  const drop = useSharedValue(0);
  const tumble = useSharedValue(0);
  const squash = useSharedValue(1);
  const shadow = useSharedValue(1);
  const firstKey = useRef(rollKey);

  useEffect(() => {
    setFace(dieFace(value));
    if (rollKey === firstKey.current || reduce) {
      drop.value = 0;
      tumble.value = 0;
      squash.value = 1;
      shadow.value = 1;
      return;
    }
    const { drop: dropMs, bounce: bounceMs, settle: settleMs } = DIE_ROLL_BEATS;
    drop.value = -0.42 * size;
    tumble.value = 0;
    squash.value = 1;
    shadow.value = 0.42;
    drop.value = withSequence(
      withTiming(0, { duration: dropMs, easing: EASE_MOVE }),
      withTiming(-0.16 * size, { duration: bounceMs * 0.45, easing: EASE_OUT }),
      withTiming(0, { duration: bounceMs * 0.55 + settleMs, easing: EASE_OUT }),
    );
    tumble.value = withSequence(
      withTiming(0.7, { duration: dropMs, easing: EASE_MOVE }),
      withTiming(0.88, { duration: bounceMs, easing: EASE_MOVE }),
      withTiming(1, { duration: settleMs, easing: EASE_OUT }),
    );
    squash.value = withSequence(
      withTiming(1.04, { duration: dropMs * 0.85, easing: EASE_MOVE }),
      withTiming(0.96, { duration: dropMs * 0.15 }),
      withTiming(1, { duration: bounceMs + settleMs, easing: EASE_OUT }),
    );
    shadow.value = withSequence(
      withTiming(0.5, { duration: dropMs * 0.72 }),
      withTiming(1, { duration: dropMs * 0.28, easing: EASE_OUT }),
      withTiming(1, { duration: bounceMs + settleMs }),
    );
    const settle = setTimeout(() => {
      if (buzz ?? value === 6) triggerHaptic.success();
    }, DIE_ROLL_MS);
    return () => clearTimeout(settle);
  }, [rollKey, value, reduce, drop, tumble, squash, shadow, buzz, size]);

  const dieStyle = useAnimatedStyle(() => ({
    opacity: idle ? 0.95 : 1,
    transform: [
      { translateY: drop.value },
      { rotate: `${tumble.value * 220 * dir}deg` },
      { scale: squash.value },
    ],
  }));

  const shadowStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + shadow.value * 0.45,
    transform: [{ translateY: size * 0.22 }, { scaleX: 0.72 + shadow.value * 0.4 }, { scaleY: 0.55 + shadow.value * 0.3 }],
  }));

  return (
    <View style={{ width: size, height: size }} pointerEvents="none">
      <Animated.Image
        source={DIE_SHADOW_SOURCE}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
        style={[StyleSheet.absoluteFill, shadowStyle]}
      />
      <Animated.View style={[StyleSheet.absoluteFill, dieStyle]} pointerEvents="none">
        <Image
          source={dieFaceSource(face)}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
          style={{ width: size, height: size }}
        />
      </Animated.View>
    </View>
  );
}
