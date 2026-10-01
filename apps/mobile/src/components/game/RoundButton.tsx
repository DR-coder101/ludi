import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { color, font, motion } from '../../theme/tokens';
import { triggerHaptic } from '../../utils/gameAudio';
import { Icon, type IconName } from './Icon';

export type RoundButtonTone = 'dark' | 'gold' | 'voice';

interface RoundButtonProps {
  icon: IconName;
  size: number;
  tone?: RoundButtonTone;
  badge?: number;
  label: string;
  onPress?: () => void;
}

const FACE: Record<'dark' | 'gold', [string, string, string, number]> = {
  dark: ['#2a2a2f', '#141416', '#141416', 0.7],
  gold: [color.goldHot, color.gold, color.goldDeep, 0.6],
};

/** Circle button from the pack's `.cbtn`: radial face, gold hairline, press scale. */
export function RoundButton({ icon, size, tone = 'dark', badge, label, onPress }: RoundButtonProps) {
  const pressed = useSharedValue(0);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: 1 - pressed.value * (1 - motion.pressScale) }] }));
  const face = tone === 'gold' ? 'gold' : 'dark';
  const [c0, c1, c2, mid] = FACE[face];
  const border = tone === 'gold' ? color.goldLight : tone === 'voice' ? 'rgba(25,196,90,0.6)' : 'rgba(254,209,0,0.28)';
  const ink = tone === 'gold' ? color.bg : tone === 'voice' ? color.greenBright : color.cream;
  const iconSize = size >= 48 ? 22 : 20;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !onPress }}
      disabled={!onPress}
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
      <Animated.View
        style={[
          styles.button,
          { width: size, height: size, borderRadius: size / 2, borderColor: border },
          tone === 'gold' ? styles.goldGlow : null,
          style,
        ]}
      >
        <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id={`cb-${face}`} cx="50%" cy="30%" r="70%">
              <Stop offset="0" stopColor={c0} />
              <Stop offset={String(mid)} stopColor={c1} />
              <Stop offset="1" stopColor={c2} />
            </RadialGradient>
          </Defs>
          <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#cb-${face})`} />
          <Circle cx={size / 2} cy={size / 2} r={size / 2 - 1} fill="none" stroke={color.white} strokeOpacity={0.06} />
        </Svg>
        <Icon name={icon} size={iconSize} color={ink} strokeWidth={icon === 'dice' ? 2 : 1.8} />
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 7,
    elevation: 6,
  },
  goldGlow: {
    shadowColor: color.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 9,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 3,
    borderRadius: 9,
    backgroundColor: color.hot,
    borderWidth: 2,
    borderColor: color.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: font.bodyBold,
    fontSize: 10,
    lineHeight: 12,
    color: color.white,
  },
});
