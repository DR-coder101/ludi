import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';
import { elevation, fontFamily, motion as M, palette } from '../../theme/tokens';

interface RoundButtonProps {
  icon: IconName;
  size?: number;
  label: string;
  onPress?: () => void;
  /** Gold, pulsing call to action (Roll Dice while it is your roll). */
  hot?: boolean;
  iconColor?: string;
  borderColor?: string;
  badge?: number;
}

export function RoundButton({ icon, size = 48, label, onPress, hot = false, iconColor, borderColor, badge }: RoundButtonProps) {
  const reducedMotion = useReducedMotion();
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (!hot || reducedMotion) {
      cancelAnimation(pulse);
      pulse.value = 0;
      return;
    }
    pulse.value = withRepeat(withTiming(1, { duration: M.highlightLoopMs / 2, easing: Easing.inOut(Easing.quad) }), -1, true);
    return () => cancelAnimation(pulse);
  }, [hot, reducedMotion, pulse]);
  const glow = useAnimatedStyle(() => ({ transform: [{ scale: 1 + 0.06 * pulse.value }] }));

  const gid = hot ? 'rb-gold' : 'rb-dark';
  return (
    <PressableScale
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !onPress }}
      hitSlop={4}
    >
      <Animated.View
        style={[
          styles.button,
          hot ? styles.hot : null,
          { width: size, height: size, borderRadius: size / 2, borderColor: borderColor ?? (hot ? palette.goldSoft : 'rgba(254,209,0,0.28)') },
          glow,
        ]}
      >
        <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id={gid} cx="50%" cy="30%" r="70%">
              <Stop offset="0" stopColor={hot ? '#FFE45C' : '#2A2A2F'} />
              <Stop offset={hot ? '0.6' : '0.7'} stopColor={hot ? palette.gold : palette.ink} />
              <Stop offset="1" stopColor={hot ? palette.goldDeep : palette.ink} />
            </RadialGradient>
          </Defs>
          <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${gid})`} />
        </Svg>
        <Icon name={icon} size={size * 0.44} color={iconColor ?? (hot ? palette.bg : palette.cream)} strokeWidth={hot ? 2 : 1.8} />
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 9 ? '9+' : String(badge)}</Text>
          </View>
        ) : null}
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: palette.ink,
    ...elevation.button,
  },
  hot: {
    shadowColor: palette.gold,
    shadowOpacity: 0.55,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 0 },
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    paddingHorizontal: 3,
    backgroundColor: palette.hot,
    borderWidth: 2,
    borderColor: palette.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: fontFamily.bodyBold, fontSize: 10, color: palette.white, lineHeight: 12 },
});
