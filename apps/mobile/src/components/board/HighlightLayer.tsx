import React, { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, G, Rect, Text as SvgText } from 'react-native-svg';
import type { Color } from '@ludi/rules';
import type { MoveHighlight, Point } from './boardModel';
import { yardOrigin } from './boardModel';
import { boardGeometry, fontFamily, motion as M, palette, pieceGradient, places } from '../../theme/tokens';

const C = boardGeometry.cell;
const V = boardGeometry.viewBox;

/** 0→1→0 on a loop; frozen at 0 when motion is reduced. */
function useLoop(periodMs: number, reducedMotion: boolean): SharedValue<number> {
  const t = useSharedValue(0);
  useEffect(() => {
    if (reducedMotion) {
      cancelAnimation(t);
      t.value = 0;
      return;
    }
    t.value = withRepeat(withTiming(1, { duration: periodMs / 2, easing: Easing.inOut(Easing.quad) }), -1, true);
    return () => cancelAnimation(t);
  }, [periodMs, reducedMotion, t]);
  return t;
}

function PulseRing({ at, k, dashed, pulse }: { at: Point; k: number; dashed: boolean; pulse: SharedValue<number> }) {
  const R = dashed ? 14.8 : 11.5;
  const box = (R + 5) * 2;
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [1, M.highlightMinOpacity]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, M.highlightScale]) }],
  }));
  return (
    <Animated.View
      style={[styles.abs, { left: (at.x - box / 2) * k, top: (at.y - box / 2) * k, width: box * k, height: box * k }, style]}
    >
      <Svg width={box * k} height={box * k} viewBox={`${-box / 2} ${-box / 2} ${box} ${box}`}>
        {dashed ? (
          <Circle r={R} fill="none" stroke={palette.gold} strokeWidth={1.6} strokeDasharray="3 2.2" />
        ) : (
          <>
            <Circle r={R + 1.5} fill="none" stroke={palette.gold} strokeOpacity={0.25} strokeWidth={3} />
            <Circle r={R} fill="none" stroke={palette.gold} strokeWidth={1.8} />
            <Circle r={14} fill="none" stroke={palette.gold} strokeOpacity={0.35} strokeWidth={1} />
          </>
        )}
      </Svg>
    </Animated.View>
  );
}

function PathDot({ at, index, k, progress }: { at: Point; index: number; k: number; progress: SharedValue<number> }) {
  const d = 5.2 * k;
  const final = Math.min(1, 0.55 + index * 0.09);
  const style = useAnimatedStyle(() => {
    const local = (progress.value - index * M.pathStaggerMs) / M.pathFadeMs;
    return { opacity: final * Math.max(0, Math.min(1, local)) };
  });
  return (
    <Animated.View
      style={[
        styles.abs,
        styles.dot,
        { left: at.x * k - d / 2, top: (at.y + 1) * k - d / 2, width: d, height: d, borderRadius: d / 2, borderWidth: 1.1 * k },
        style,
      ]}
    />
  );
}

function Destination({ h, color, k, pulse }: { h: MoveHighlight; color: Color; k: number; pulse: SharedValue<number> }) {
  const tone = places[color].tone;
  const col = Math.floor(h.to.x / C);
  const row = Math.floor(h.to.y / C);
  const box = 44;
  const ox = col * C + C / 2 - box / 2;
  const oy = row * C + C / 2 - box / 2;
  const glow = useAnimatedStyle(() => ({ opacity: interpolate(pulse.value, [0, 1], [1, 0.72]) }));
  return (
    <Animated.View style={[styles.abs, { left: ox * k, top: oy * k, width: box * k, height: box * k }, glow]}>
      <Svg width={box * k} height={box * k} viewBox={`${ox} ${oy} ${box} ${box}`}>
        <Rect x={col * C - 4} y={row * C - 4} width={28} height={28} rx={7} fill={palette.gold} opacity={0.14} />
        <Rect x={col * C - 1} y={row * C - 1} width={22} height={22} rx={5} fill={palette.gold} fillOpacity={0.92} stroke={palette.goldSoft} strokeWidth={1.6} />
        <Rect x={col * C - 4} y={row * C - 4} width={28} height={28} rx={7} fill="none" stroke={palette.gold} strokeOpacity={0.45} strokeWidth={1} />
        <Circle cx={h.to.x} cy={h.to.y + 1} r={6.5} fill="none" stroke={pieceGradient[tone].lo} strokeWidth={1.6} strokeDasharray="2.5 2" />
        {h.steps > 0 ? (
          <G>
            <Rect x={col * C + 13} y={row * C - 9} width={15} height={11} rx={5.5} fill={palette.hot} stroke={palette.white} strokeWidth={0.8} />
            <SvgText x={col * C + 20.5} y={row * C - 1} fontFamily={fontFamily.badge} fontSize={7} fill={palette.white} textAnchor="middle">
              {`+${h.steps}`}
            </SvgText>
          </G>
        ) : null}
      </Svg>
    </Animated.View>
  );
}

function MoveTrail({ h, color, k, pulse, reducedMotion }: {
  h: MoveHighlight;
  color: Color;
  k: number;
  pulse: SharedValue<number>;
  reducedMotion: boolean;
}) {
  const total = h.path.length * M.pathStaggerMs + M.pathFadeMs;
  const progress = useSharedValue(reducedMotion ? total : 0);
  useEffect(() => {
    if (reducedMotion) {
      progress.value = total;
      return;
    }
    progress.value = 0;
    progress.value = withTiming(total, { duration: total, easing: Easing.linear });
  }, [h, total, reducedMotion, progress]);
  return (
    <>
      <Destination h={h} color={color} k={k} pulse={pulse} />
      {h.path.map((p, i) => (
        <PathDot key={`${p.x},${p.y}`} at={p} index={i} k={k} progress={progress} />
      ))}
    </>
  );
}

interface HighlightLayerProps {
  highlights: MoveHighlight[];
  colors: Color[];
  k: number;
  reducedMotion: boolean;
}

export const HighlightLayer = memo(function HighlightLayer({ highlights, colors, k, reducedMotion }: HighlightLayerProps) {
  const pulse = useLoop(M.highlightLoopMs, reducedMotion);
  return (
    <View pointerEvents="none" style={[styles.abs, { left: 0, top: 0, width: V * k, height: V * k }]}>
      {highlights.map((h, i) =>
        h.fromYard ? null : (
          <MoveTrail key={`trail-${h.tokenIndex}`} h={h} color={colors[i]} k={k} pulse={pulse} reducedMotion={reducedMotion} />
        ),
      )}
      {highlights.map((h) => (
        <PulseRing key={`ring-${h.tokenIndex}`} at={{ x: h.from.x, y: h.from.y }} k={k} dashed={h.fromYard} pulse={pulse} />
      ))}
    </View>
  );
});

/** Current-turn yard frame glow, breathing on a 1.6 s loop. */
export const TurnGlow = memo(function TurnGlow({ color, k, reducedMotion }: { color: Color; k: number; reducedMotion: boolean }) {
  const breathe = useLoop(M.turnGlowLoopMs, reducedMotion);
  const o = yardOrigin(color);
  const accent = places[color].accent;
  const size = 8 * C;
  const style = useAnimatedStyle(() => ({ opacity: interpolate(breathe.value, [0, 1], [1, 0.35]) }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.abs, { left: o.x * k, top: o.y * k, width: size * k, height: size * k }, style]}
    >
      <Svg width={size * k} height={size * k} viewBox={`${o.x} ${o.y} ${size} ${size}`}>
        <Rect x={o.x + 5} y={o.y + 5} width={150} height={150} rx={9} fill="none" stroke={accent} strokeOpacity={0.16} strokeWidth={9} />
        <Rect x={o.x + 5} y={o.y + 5} width={150} height={150} rx={9} fill="none" stroke={accent} strokeOpacity={0.3} strokeWidth={5} />
      </Svg>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  dot: { backgroundColor: palette.white, borderColor: palette.bg },
});
