import React, { memo, useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { GLYPH_BOX, GLYPH_R, PieceGlyph } from './PieceGlyph';
import type { PieceLayout, PieceMotion } from './boardModel';
import { boardGeometry, motion as M, palette, places } from '../../theme/tokens';
import { triggerHaptic } from '../../utils/gameAudio';

const BASE_R = boardGeometry.yardPieceRadius;
const easeOut = Easing.out(Easing.quad);
const easeIn = Easing.in(Easing.quad);

interface AnimatedPieceProps {
  layout: PieceLayout;
  motion: PieceMotion | null;
  /** viewBox unit → pixels. */
  k: number;
  reducedMotion: boolean;
  legal: boolean;
  onPress?: (tokenIndex: number) => void;
}

function zoneLabel(layout: PieceLayout): string {
  switch (layout.zone) {
    case 'yard':
      return 'in the yard';
    case 'home':
      return 'home';
    case 'homeColumn':
      return 'in the home column';
    default:
      return 'on the track';
  }
}

export const AnimatedPiece = memo(function AnimatedPiece({
  layout,
  motion,
  k,
  reducedMotion,
  legal,
  onPress,
}: AnimatedPieceProps) {
  const x = useSharedValue(layout.x);
  const y = useSharedValue(layout.y);
  const r = useSharedValue(layout.r);
  const lift = useSharedValue(0);
  const liftHeight = useSharedValue<number>(M.hopLift);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const target = layout;
    if (!motion) {
      x.value = target.x;
      y.value = target.y;
      r.value = target.r;
      return;
    }
    const { kind, waypoints, delayMs, arrivesHome } = motion;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => {
      timers.push(setTimeout(fn, ms));
    };

    if (reducedMotion) {
      const half = M.reducedCrossfadeMs / 2;
      opacity.value = withDelay(delayMs, withSequence(withTiming(0, { duration: half }), withTiming(1, { duration: half })));
      x.value = withDelay(delayMs + half, withTiming(target.x, { duration: 0 }));
      y.value = withDelay(delayMs + half, withTiming(target.y, { duration: 0 }));
      r.value = withDelay(delayMs + half, withTiming(target.r, { duration: 0 }));
      if (kind !== 'slide') at(delayMs + M.reducedCrossfadeMs, arrivesHome ? triggerHaptic.success : triggerHaptic.light);
      return () => timers.forEach(clearTimeout);
    }

    if (kind === 'hop') {
      const hop = M.hopMsPerCell;
      const land = (last: boolean) => {
        if (last && arrivesHome) triggerHaptic.success();
        else triggerHaptic.light();
      };
      liftHeight.value = M.hopLift;
      x.value = withSequence(...waypoints.map((w) => withTiming(w.x, { duration: hop, easing: easeOut })));
      y.value = withSequence(...waypoints.map((w) => withTiming(w.y, { duration: hop, easing: easeOut })));
      r.value = withTiming(target.r, { duration: hop * waypoints.length });
      lift.value = withSequence(
        ...waypoints.flatMap((_, i) => [
          withTiming(1, { duration: hop / 2, easing: easeOut }),
          withTiming(0, { duration: hop / 2, easing: easeIn }, (finished) => {
            if (finished) runOnJS(land)(i === waypoints.length - 1);
          }),
        ]),
      );
    } else if (kind === 'enter') {
      triggerHaptic.medium();
      liftHeight.value = M.hopLift * 1.6;
      x.value = withSpring(target.x, M.enterSpring);
      y.value = withSpring(target.y, M.enterSpring);
      r.value = withTiming(target.r, { duration: M.enterMs });
      lift.value = withSequence(
        withTiming(1, { duration: M.enterMs / 2, easing: easeOut }),
        withTiming(0, { duration: M.enterMs / 2, easing: easeIn }),
      );
    } else if (kind === 'capture') {
      const flight = { duration: M.captureFlightMs, easing: Easing.inOut(Easing.quad) };
      at(delayMs, triggerHaptic.heavy);
      at(delayMs + M.captureFlightMs, triggerHaptic.warning);
      liftHeight.value = M.hopLift * 4;
      x.value = withDelay(delayMs, withTiming(target.x, flight));
      y.value = withDelay(delayMs, withTiming(target.y, flight));
      r.value = withDelay(delayMs, withTiming(target.r, flight));
      lift.value = withDelay(
        delayMs,
        withSequence(
          withTiming(1, { duration: M.captureFlightMs / 2, easing: easeOut }),
          withTiming(0, { duration: M.captureFlightMs / 2, easing: easeIn }),
        ),
      );
    } else {
      const slide = { duration: M.slideMs, easing: easeOut };
      x.value = withDelay(delayMs, withTiming(target.x, slide));
      y.value = withDelay(delayMs, withTiming(target.y, slide));
      r.value = withDelay(delayMs, withTiming(target.r, slide));
    }
    return () => timers.forEach(clearTimeout);
  }, [motion, layout.x, layout.y, layout.r, reducedMotion]);

  const box = GLYPH_BOX * (BASE_R / GLYPH_R) * k;
  const baseR = BASE_R * k;

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: x.value * k - box / 2 }, { translateY: y.value * k - box / 2 }],
  }));

  const shadowStyle = useAnimatedStyle(() => {
    const s = (r.value / BASE_R) * (1 - 0.3 * lift.value);
    return {
      opacity: 0.55 * (1 - 0.45 * lift.value),
      transform: [{ translateY: 0.62 * r.value * k }, { scale: s }],
    };
  });

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -lift.value * liftHeight.value * k },
      { scale: (r.value / BASE_R) * (1 + (M.hopScale - 1) * lift.value) },
    ],
  }));

  const tone = places[layout.color].tone;
  const interactive = legal && layout.stackTop && !!onPress;
  const label = `${places[layout.color].full} piece ${zoneLabel(layout)}${layout.stackCount > 1 ? `, stack of ${layout.stackCount}` : ''}`;

  return (
    <Animated.View
      pointerEvents={interactive ? 'box-none' : 'none'}
      style={[styles.container, { width: box, height: box, zIndex: motion ? 3 : layout.stackTop ? 2 : 1 }, containerStyle]}
    >
      <Animated.View
        style={[
          styles.shadow,
          { width: baseR * 2.04, height: baseR, borderRadius: baseR, left: box / 2 - baseR * 1.02, top: box / 2 - baseR / 2 },
          shadowStyle,
        ]}
      />
      <Animated.View style={[StyleSheet.absoluteFill, bodyStyle]}>
        <Pressable
          disabled={!interactive}
          onPress={() => onPress?.(layout.tokenIndex)}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={interactive ? `Move ${label}` : label}
          accessibilityState={{ disabled: !interactive }}
          style={StyleSheet.absoluteFill}
        >
          <PieceGlyph tone={tone} size={box} stackCount={layout.stackTop ? layout.stackCount : 1} />
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  shadow: {
    position: 'absolute',
    backgroundColor: palette.black,
  },
});
