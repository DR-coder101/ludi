import React, { memo, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { motion as M, palette } from '../../theme/tokens';
import { triggerHaptic } from '../../utils/gameAudio';

const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[30, 30], [70, 70]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[30, 30], [70, 30], [30, 70], [70, 70]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[31, 26], [69, 26], [31, 50], [69, 50], [31, 74], [69, 74]],
};

/** A cream die face; `face` null draws an unused die with no pips. */
export const DieFace = memo(function DieFace({ face, size }: { face: number | null; size: number }) {
  const unused = face == null;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="die-body" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFFDF4" />
          <Stop offset="1" stopColor="#E9DFC4" />
        </LinearGradient>
        <RadialGradient id="die-pip" cx="40%" cy="35%" r="50%">
          <Stop offset="0" stopColor="#3A3A3A" />
          <Stop offset="1" stopColor="#050505" />
        </RadialGradient>
      </Defs>
      <Rect x={5} y={9} width={90} height={90} rx={20} fill={palette.black} opacity={0.45} />
      <Rect
        x={4}
        y={4}
        width={92}
        height={92}
        rx={20}
        fill="url(#die-body)"
        stroke={palette.white}
        strokeWidth={2}
        strokeDasharray={unused ? '8 6' : undefined}
      />
      <Path d="M16 10h68a12 12 0 0 1 12 12v4H4v-4a12 12 0 0 1 12-12z" fill={palette.white} opacity={0.5} />
      {unused ? null : PIPS[face].map(([x, y]) => <Circle key={`${x}-${y}`} cx={x} cy={y} r={9.5} fill="url(#die-pip)" />)}
    </Svg>
  );
});

interface DicePairProps {
  /** Engine die value to show (null before the first roll). */
  value: number | null;
  /** Waiting for a roll: the last face is shown tilted and dimmed. */
  idle: boolean;
  /** Second die. The engine rolls one die today, so callers pass null. */
  secondValue?: number | null;
  /** Changes on every new roll; starts the tumble. */
  rollKey: number;
  size?: number;
  onSettled?: () => void;
}

export function DicePair({ value, idle, secondValue = null, rollKey, size = 46, onSettled }: DicePairProps) {
  const reducedMotion = useReducedMotion();
  const [shown, setShown] = useState<number>(value ?? 5);
  const firstRoll = useRef(rollKey);
  const spin = useSharedValue(0);
  const bounce = useSharedValue(0);
  const pop = useSharedValue(1);
  const fade = useSharedValue(1);

  useEffect(() => {
    if (rollKey === firstRoll.current || value == null) {
      if (value != null) setShown(value);
      return;
    }
    const final = value;
    const settle = () => {
      setShown(final);
      triggerHaptic.medium();
      if (final === 6) triggerHaptic.success();
      onSettled?.();
    };

    if (reducedMotion) {
      fade.value = withSequence(
        withTiming(0.2, { duration: M.reducedCrossfadeMs / 2 }),
        withTiming(1, { duration: M.reducedCrossfadeMs / 2 }, (done) => {
          if (done) runOnJS(settle)();
        }),
      );
      return;
    }

    const tumble = M.diceTumbleMs - M.diceOvershootMs;
    const ticker = setInterval(() => {
      setShown(1 + Math.floor(Math.random() * 6));
      triggerHaptic.selection();
    }, M.diceFaceTickMs);
    const stop = setTimeout(() => clearInterval(ticker), tumble - M.diceFaceTickMs);

    spin.value = 0;
    spin.value = withTiming(1, { duration: tumble, easing: Easing.out(Easing.cubic) });
    bounce.value = withSequence(
      withTiming(-16, { duration: tumble * 0.22, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: tumble * 0.24, easing: Easing.in(Easing.quad) }),
      withTiming(-6, { duration: tumble * 0.18, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: tumble * 0.36, easing: Easing.in(Easing.quad) }),
    );
    pop.value = withSequence(
      withTiming(1, { duration: tumble }, (done) => {
        if (done) runOnJS(settle)();
      }),
      withTiming(1.12, { duration: M.diceOvershootMs / 2, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: M.diceOvershootMs / 2, easing: Easing.in(Easing.quad) }),
    );
    return () => {
      clearInterval(ticker);
      clearTimeout(stop);
    };
  }, [rollKey, value, reducedMotion]);

  const tumbleStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [
      { perspective: 400 },
      { translateY: bounce.value },
      { rotateX: `${spin.value * 720}deg` },
      { rotateY: `${spin.value * 540}deg` },
      { scale: pop.value },
    ],
  }));

  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={value == null ? 'Dice not rolled yet' : `Last roll ${value}`}
    >
      <View style={idle ? styles.idle : null}>
        <Animated.View style={tumbleStyle}>
          <DieFace face={shown} size={size} />
        </Animated.View>
      </View>
      <View style={[styles.second, { marginLeft: -size * 0.18 }]}>
        <DieFace face={secondValue} size={size * 0.86} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  idle: { opacity: 0.95, transform: [{ rotate: '-8deg' }] },
  second: { opacity: 0.4, transform: [{ rotate: '10deg' }] },
});
