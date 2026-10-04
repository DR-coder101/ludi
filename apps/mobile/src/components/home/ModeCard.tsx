import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Mask, Path, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { color, font } from '../../theme/tokens';
import { antonBold } from '../../theme/antonBold';
import { Icon, type IconName } from '../game/Icon';
import { PressScale } from './PressScale';
import { cssShadow, topHighlightPath } from './cssShadow';

export type ModeCardTone = 'gold' | 'green';

interface ModeCardProps {
  tone: ModeCardTone;
  icon: IconName;
  title: string;
  sub: string;
  width: number;
  hint?: string;
  busy?: boolean;
  onPress?: () => void;
}

export const MODE_CARD_HEIGHT = 80;
const RADIUS = 18;
const BORDER = 1.5;

const TONE = {
  gold: { ink: color.bg, sub: color.bg, dots: 'rgba(0,0,0,0.14)', chevron: color.bg, glyph: color.gold },
  green: { ink: color.cream, sub: 'rgba(246,239,217,0.7)', dots: 'rgba(0,155,58,0.22)', chevron: color.greenBright, glyph: color.greenBright },
} as const;

/** `.c1` / `.c2`: gradient face, halftone fading out from the top-right corner, inset top highlight. */
function CardFace({ tone, w, h }: { tone: ModeCardTone; w: number; h: number }) {
  const id = `mc-${tone}`;
  // CSS `linear-gradient(135deg, …)`: the gradient line runs corner to corner through the centre.
  const half = ((w + h) * Math.SQRT1_2) / 2;
  const d = half * Math.SQRT1_2;
  const ht = { x: w - 150, y: -20, width: 170, height: 130 };

  return (
    <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
      <Defs>
        {tone === 'gold' ? (
          <LinearGradient id={`${id}-bg`} gradientUnits="userSpaceOnUse" x1={w / 2 - d} y1={h / 2 - d} x2={w / 2 + d} y2={h / 2 + d}>
            <Stop offset="0" stopColor={color.goldHot} />
            <Stop offset="0.45" stopColor={color.gold} />
            <Stop offset="1" stopColor={color.goldCta} />
          </LinearGradient>
        ) : (
          <LinearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#17181a" />
            <Stop offset="1" stopColor="#0f0f11" />
          </LinearGradient>
        )}
        <Pattern id={`${id}-dots`} x={ht.x} y={ht.y} width={6} height={6} patternUnits="userSpaceOnUse">
          <Circle cx={3} cy={3} r={1.2} fill={TONE[tone].dots} />
        </Pattern>
        <RadialGradient id={`${id}-fade`} cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <Stop offset="0" stopColor="#fff" stopOpacity={1} />
          <Stop offset="1" stopColor="#fff" stopOpacity={0} />
        </RadialGradient>
        <Mask id={`${id}-mask`}>
          <Rect {...ht} fill={`url(#${id}-fade)`} />
        </Mask>
      </Defs>
      <Rect width={w} height={h} fill={`url(#${id}-bg)`} />
      <Rect {...ht} fill={`url(#${id}-dots)`} mask={`url(#${id}-mask)`} />
      {tone === 'gold' ? (
        <Path d={topHighlightPath(w, h, RADIUS)} fill={color.white} fillOpacity={0.6} fillRule="evenodd" />
      ) : null}
    </Svg>
  );
}

export function ModeCard({ tone, icon, title, sub, width, hint, busy, onPress }: ModeCardProps) {
  const t = TONE[tone];
  const inner = tone === 'green' ? { w: width - BORDER * 2, h: MODE_CARD_HEIGHT - BORDER * 2 } : { w: width, h: MODE_CARD_HEIGHT };

  return (
    <PressScale label={`${title}. ${sub}`} hint={hint} busy={busy} onPress={onPress} style={[styles.shadow, tone === 'gold' ? styles.goldShadow : styles.darkShadow]}>
      {(pressed) => (
        <View style={[styles.card, { width }, tone === 'green' ? styles.greenBorder : null]}>
          <CardFace tone={tone} w={inner.w} h={inner.h} />
          {tone === 'gold' ? <PressDim pressed={pressed} /> : null}
          <View style={[styles.icon, tone === 'gold' ? styles.iconGold : styles.iconGreen]}>
            <Icon name={icon} size={26} color={t.glyph} />
          </View>
          <View style={styles.copy}>
            <Text style={[styles.title, { color: t.ink }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {title}
            </Text>
            <Text style={[styles.sub, { color: t.sub }]} numberOfLines={1}>
              {sub}
            </Text>
          </View>
          <View style={styles.go}>
            {busy ? <ActivityIndicator size="small" color={t.chevron} /> : <Icon name="chevron" size={22} color={t.chevron} strokeWidth={2.4} />}
          </View>
        </View>
      )}
    </PressScale>
  );
}

/** Pressed gold CTA darkens toward goldDeep. */
function PressDim({ pressed }: { pressed: { value: number } }) {
  const style = useAnimatedStyle(() => ({ opacity: pressed.value * 0.45 }));
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.dim, style]} />;
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: RADIUS,
  },
  goldShadow: cssShadow(0, 12, 30, color.gold, 0.22, 8),
  darkShadow: cssShadow(0, 10, 26, '#000', 0.6, 8),
  card: {
    height: MODE_CARD_HEIGHT,
    borderRadius: RADIUS,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 18,
    gap: 14,
  },
  greenBorder: {
    borderWidth: BORDER,
    borderColor: color.green,
  },
  dim: {
    backgroundColor: color.goldDeep,
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGold: {
    backgroundColor: color.bg,
  },
  iconGreen: {
    backgroundColor: 'rgba(0,155,58,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(25,196,90,0.4)',
  },
  copy: {
    flex: 1,
  },
  title: {
    fontFamily: font.display,
    // Mockup <h3> asks Anton for bold; antonBold synthesises on web/Android and keeps Anton on iOS.
    ...antonBold,
    fontSize: 25,
    lineHeight: 25,
    letterSpacing: 0.6,
  },
  sub: {
    marginTop: 5,
    fontFamily: font.body,
    fontSize: 12.5,
    lineHeight: 15,
  },
  go: {
    width: 22,
    alignItems: 'center',
    // The pack's chevron is an inline SVG on a text baseline, 2pt above the card's centre line.
    marginTop: -4,
  },
});
