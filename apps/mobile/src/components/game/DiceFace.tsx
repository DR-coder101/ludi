import React, { useEffect, useRef, useState } from 'react';
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { motion } from '../../theme/tokens';
import { triggerHaptic } from '../../utils/gameAudio';

const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[30, 30], [70, 70]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[30, 30], [70, 30], [30, 70], [70, 70]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[31, 26], [69, 26], [31, 50], [69, 50], [31, 74], [69, 74]],
};

/** The pack's ivory die (`lib.js dice()`), 100-unit viewBox. */
export function DieSvg({ n, size }: { n: number; size: number }) {
  const pips = PIPS[n] ?? PIPS[5];
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id={`dg${n}`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFFDF4" />
          <Stop offset="1" stopColor="#E9DFC4" />
        </LinearGradient>
        <RadialGradient id={`pip${n}`} cx="40%" cy="35%" r="50%">
          <Stop offset="0" stopColor="#3a3a3a" />
          <Stop offset="1" stopColor="#050505" />
        </RadialGradient>
      </Defs>
      <Rect x={5} y={9} width={90} height={90} rx={20} fill="#000" opacity={0.45} />
      <Rect x={4} y={4} width={92} height={92} rx={20} fill={`url(#dg${n})`} stroke="#fff" strokeWidth={2} />
      <Path d="M16 10h68a12 12 0 0 1 12 12v4H4v-4a12 12 0 0 1 12-12z" fill="#fff" opacity={0.5} />
      {pips.map(([x, y]) => (
        <Circle key={`${x}-${y}`} cx={x} cy={y} r={9.5} fill={`url(#pip${n})`} />
      ))}
    </Svg>
  );
}

interface DiceFaceProps {
  /** Face to show once settled. */
  value: number;
  size: number;
  /** Bumped once per roll; each bump plays the tumble. */
  rollKey: number;
  /** Waiting for a roll: tilted like the start mockup. */
  idle: boolean;
  /** Tumble direction, so a pair of dice spin against each other. */
  spin?: 1 | -1;
  /** Buzz when this die settles; defaults to settling on a 6. */
  buzz?: boolean;
}

export function DiceFace({ value, size, rollKey, idle, spin: dir = 1, buzz }: DiceFaceProps) {
  const reduce = useReducedMotion();
  const [face, setFace] = useState(value);
  const spin = useSharedValue(0);
  const pop = useSharedValue(1);
  const firstKey = useRef(rollKey);

  useEffect(() => {
    if (rollKey === firstKey.current || reduce) {
      setFace(value);
      return;
    }
    const tick = setInterval(() => setFace(1 + Math.floor(Math.random() * 6)), 80);
    spin.value = 0;
    spin.value = withTiming(1, { duration: motion.diceRollMs, easing: Easing.out(Easing.cubic) });
    pop.value = withSequence(
      withTiming(1.12, { duration: motion.diceRollMs * 0.4 }),
      withTiming(1, { duration: motion.diceRollMs * 0.6, easing: Easing.out(Easing.back(2)) }),
    );
    const settle = setTimeout(() => {
      clearInterval(tick);
      setFace(value);
      if (buzz ?? value === 6) triggerHaptic.success();
    }, motion.diceRollMs);
    return () => {
      clearInterval(tick);
      clearTimeout(settle);
    };
  }, [rollKey, value, reduce, spin, pop, buzz]);

  const tilt = idle ? -8 * dir : 0;
  const style = useAnimatedStyle(() => ({
    opacity: idle ? 0.95 : 1,
    transform: [{ rotate: `${tilt + spin.value * 720 * dir}deg` }, { scale: pop.value }],
  }));

  return (
    <Animated.View style={[{ width: size, height: size }, style]}>
      <DieSvg n={face} size={size} />
    </Animated.View>
  );
}
