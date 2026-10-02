import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  FeGaussianBlur,
  Filter,
  G,
  Mask,
  Path,
  Pattern,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { PieceDefs, PieceGlyph } from '../board/PieceGlyph';
import { color, font, motion, type PieceColor } from '../../theme/tokens';
import { WORDMARK_PATH } from './wordmarkPath';

/** The pack's `.hero` box: 390 wide, from the status bar down to the first CTA card. */
export const HERO = { width: 390, height: 436 } as const;

const CONE = 380;
const C = CONE / 2;
const RAD = Math.PI / 180;
const RAYS = Array.from({ length: 18 }, (_, i) => {
  const a = i * 20;
  const p = (deg: number) => `${C + 260 * Math.cos(deg * RAD)} ${C + 260 * Math.sin(deg * RAD)}`;
  return { d: `M${C} ${C}L${p(a - 5)}L${p(a + 5)}Z`, fill: i % 2 ? color.green : color.gold };
});
const RINGS = Array.from({ length: 9 }, (_, i) => ({ r: 92 + i * 10, opacity: 0.05 + (i % 3 === 0 ? 0.05 : 0) }));
const BOLTS = [45, 135, 225, 315].map((a) => ({ cx: C + 160 * Math.cos(a * RAD), cy: C + 160 * Math.sin(a * RAD) }));
const PIECES: PieceColor[] = ['gold', 'green', 'black', 'red'];

/** Sunburst rays and the gold halftone halo behind the speaker. */
function ConeBackdrop() {
  return (
    <Svg width={CONE} height={CONE} style={styles.cone}>
      <Defs>
        <Pattern id="hh-dots" width={6} height={6} patternUnits="userSpaceOnUse">
          <Circle cx={3} cy={3} r={1.1} fill={color.gold} />
        </Pattern>
        <RadialGradient id="hh-halo" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <Stop offset="0.55" stopColor="#fff" stopOpacity={0} />
          <Stop offset="0.8" stopColor="#fff" stopOpacity={0.5} />
          <Stop offset="1" stopColor="#fff" stopOpacity={0} />
        </RadialGradient>
        <Mask id="hh-mask">
          <Rect width={CONE} height={CONE} fill="url(#hh-halo)" />
        </Mask>
      </Defs>
      {RAYS.map((ray) => (
        <Path key={ray.d} d={ray.d} fill={ray.fill} opacity={0.07} />
      ))}
      <Rect width={CONE} height={CONE} fill="url(#hh-dots)" mask="url(#hh-mask)" opacity={0.35} />
    </Svg>
  );
}

function VinylRing() {
  return (
    <Svg width={CONE} height={CONE}>
      <Circle cx={C} cy={C} r={178} fill="none" stroke={color.gold} strokeOpacity={0.25} strokeWidth={1.5} strokeDasharray="2 5" />
    </Svg>
  );
}

function SpeakerCone() {
  return (
    <Svg width={CONE} height={CONE}>
      <Defs>
        <RadialGradient id="hh-cone" cx="50%" cy="45%" r="55%" fx="50%" fy="45%">
          <Stop offset="0" stopColor="#2b2b30" />
          <Stop offset="0.55" stopColor="#121214" />
          <Stop offset="0.86" stopColor="#050506" />
          <Stop offset="0.9" stopColor="#2d2d31" />
          <Stop offset="0.95" stopColor="#101012" />
          <Stop offset="1" stopColor="#1b1b1e" />
        </RadialGradient>
        <RadialGradient id="hh-cap" cx="40%" cy="35%" r="50%" fx="40%" fy="35%">
          <Stop offset="0" stopColor="#4a4b50" />
          <Stop offset="1" stopColor="#0c0c0e" />
        </RadialGradient>
      </Defs>
      <Circle cx={C} cy={C} r={170} fill="url(#hh-cone)" />
      {RINGS.map((ring) => (
        <Circle key={ring.r} cx={C} cy={C} r={ring.r} fill="none" stroke="#fff" strokeOpacity={ring.opacity} strokeWidth={1} />
      ))}
      <Circle cx={C} cy={C} r={170} fill="none" stroke="#000" strokeWidth={3} />
      {BOLTS.map((b) => (
        <Circle key={`${b.cx}-${b.cy}`} cx={b.cx} cy={b.cy} r={4} fill="#3a3a3f" stroke="#000" strokeWidth={1} />
      ))}
      <Circle cx={C} cy={C} r={48} fill="url(#hh-cap)" stroke="#000" strokeWidth={2} />
      <Ellipse cx={176} cy={172} rx={22} ry={12} fill="#fff" opacity={0.08} />
    </Svg>
  );
}

/**
 * `.word`: gold fill with a 2px black stroke over hard offsets (black 5/5, green 9/9)
 * and a soft 10/12 drop shadow blurred 24px.
 */
function Wordmark() {
  const glyph = (dx: number, dy: number, fill: string) => (
    <G transform={`translate(${dx} ${dy})`}>
      <Path d={WORDMARK_PATH} fill={fill} stroke={fill} strokeWidth={2} strokeLinejoin="round" />
    </G>
  );
  return (
    <Svg width={HERO.width} height={HERO.height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <Filter id="hh-soft" x="0" y="0" width={HERO.width} height={HERO.height} filterUnits="userSpaceOnUse">
          <FeGaussianBlur stdDeviation={12} />
        </Filter>
      </Defs>
      <G filter="url(#hh-soft)" opacity={0.7}>
        {glyph(10, 12, '#000')}
      </G>
      {glyph(9, 9, color.green)}
      {glyph(5, 5, color.bg)}
      <Path d={WORDMARK_PATH} fill={color.gold} stroke={color.bg} strokeWidth={2} />
    </Svg>
  );
}

/** Speaker kick: the cone thumps outward on a half-time dancehall pulse; the vinyl ring turns slowly. */
function useSpeakerMotion() {
  const reduceMotion = useReducedMotion();
  const kick = useSharedValue(0);
  const spin = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    kick.value = withRepeat(
      withSequence(
        withTiming(1, { duration: motion.kickMs, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: motion.kickDecayMs, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: motion.kickRestMs }),
      ),
      -1,
    );
    spin.value = withRepeat(withTiming(1, { duration: motion.vinylTurnMs, easing: Easing.linear }), -1);
  }, [reduceMotion, kick, spin]);

  const coneStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + kick.value * motion.kickScale }] }));
  const ringStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 360}deg` }] }));
  return { coneStyle, ringStyle };
}

export function HomeHero() {
  const { coneStyle, ringStyle } = useSpeakerMotion();
  return (
    <View style={styles.hero} accessibilityRole="header" accessibilityLabel="Ludi. Jamaican Ludo, Negril to Kingston. Four corners, one board.">
      <ConeBackdrop />
      <Animated.View style={[styles.cone, ringStyle]}>
        <VinylRing />
      </Animated.View>
      <Animated.View style={[styles.cone, coneStyle]}>
        <SpeakerCone />
      </Animated.View>
      <Wordmark />
      <View style={[styles.sticker, styles.ribbon]}>
        <View style={styles.ribbonShadow} />
        <View style={styles.ribbonFace}>
          <Text style={styles.ribbonText}>JAMAICAN LUDO</Text>
        </View>
      </View>
      <View style={[styles.sticker, styles.plate]}>
        <Text style={styles.plateText}>NEGRIL TO KINGSTON</Text>
      </View>
      <Text style={styles.tagline}>
        FOUR CORNERS <Text style={styles.taglineDot}>·</Text> ONE BOARD
      </Text>
      <Svg width={190} height={40} style={styles.pieces}>
        <PieceDefs />
        {PIECES.map((p, i) => (
          <PieceGlyph key={p} piece={p} cx={26 + i * 46} cy={17} r={13} />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    width: HERO.width,
    height: HERO.height,
  },
  cone: {
    position: 'absolute',
    left: (HERO.width - CONE) / 2,
    top: 18,
    width: CONE,
    height: CONE,
  },
  sticker: {
    position: 'absolute',
    borderRadius: 3,
  },
  ribbon: {
    left: 52,
    top: 112,
    transform: [{ rotate: '-7deg' }],
  },
  ribbonShadow: {
    position: 'absolute',
    left: 3,
    top: 3,
    right: -3,
    bottom: -3,
    borderRadius: 3,
    backgroundColor: color.bg,
  },
  ribbonFace: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 3,
    backgroundColor: color.hot,
  },
  ribbonText: {
    fontFamily: font.sticker,
    fontSize: 13,
    lineHeight: 14,
    letterSpacing: 1.5,
    color: color.white,
  },
  plate: {
    right: 40,
    top: 300,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderWidth: 1.5,
    borderColor: color.gold,
    backgroundColor: color.bg,
    transform: [{ rotate: '5deg' }],
  },
  plateText: {
    fontFamily: font.sticker,
    fontSize: 10,
    lineHeight: 11,
    letterSpacing: 1.4,
    color: color.gold,
  },
  tagline: {
    position: 'absolute',
    top: 350,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: font.sticker,
    fontSize: 12,
    lineHeight: 13,
    letterSpacing: 3.2,
    color: color.cream,
  },
  taglineDot: {
    color: color.greenBright,
  },
  pieces: {
    position: 'absolute',
    top: 376,
    left: (HERO.width - 190) / 2,
  },
});
