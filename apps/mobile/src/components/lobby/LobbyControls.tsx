import React, { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { color, font, motion } from '../../theme/tokens';
import { Icon, type IconName } from '../game/Icon';
import { RoundButton } from '../game/RoundButton';
import { PressScale } from '../home/PressScale';
import { cssShadow, topHighlightPath } from '../home/cssShadow';
import { triggerHaptic } from '../../utils/gameAudio';
import { cssGradientLine } from './cssGradient';
import type { StartCta } from './lobbyModel';

const PANEL = '#151517';

export function LobbyHeader({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.header}>
      <RoundButton icon="back" size={42} label="Leave room" onPress={onBack} />
      <View>
        <Text style={styles.title} accessibilityRole="header">
          PRIVATE <Text style={styles.titleGold}>ROOM</Text>
        </Text>
        <Text style={styles.sub}>Online · up to 4 players</Text>
      </View>
    </View>
  );
}

/**
 * CREATE ROOM / JOIN WITH CODE. Inside a room it shows how you got in (host or
 * guest); switching would mean leaving, so the tabs do not respond to taps.
 */
export function RoomModeTabs({ host }: { host: boolean }) {
  return (
    <View style={styles.seg} accessibilityRole="tablist">
      {(['CREATE ROOM', 'JOIN WITH CODE'] as const).map((label, i) => {
        const on = (i === 0) === host;
        return (
          <View key={label} style={[styles.tab, on ? styles.tabOn : null]} accessibilityRole="tab" accessibilityState={{ selected: on, disabled: !on }}>
            <Text style={[styles.tabText, on ? styles.tabTextOn : null]}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

function Switch({ on }: { on: boolean }) {
  const p = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    p.value = withTiming(on ? 1 : 0, { duration: motion.pressMs * 2 });
  }, [on, p]);
  const track = useAnimatedStyle(() => ({ opacity: p.value }));
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: (p.value - 1) * 12 }] }));
  return (
    <View style={styles.switch}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.switchOn, track]} />
      <Animated.View style={[styles.knob, knob]} />
    </View>
  );
}

interface OptionToggleProps {
  icon: IconName;
  label: string;
  on: boolean;
  onToggle?: () => void;
  /** Shown as on and not changeable. */
  hint?: string;
}

export function OptionToggle({ icon, label, on, onToggle, hint }: OptionToggleProps) {
  return (
    <Pressable
      style={styles.opt}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ checked: on, disabled: !onToggle }}
      disabled={!onToggle}
      onPress={() => {
        triggerHaptic.light();
        onToggle?.();
      }}
    >
      <Icon name={icon} size={16} color={color.cream} />
      <Text style={styles.optText}>{label}</Text>
      <Switch on={on} />
    </Pressable>
  );
}

export const START_HEIGHT = 60;
const START_RADIUS = 18;

function GoldFace({ w, h }: { w: number; h: number }) {
  return (
    <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="start-bg" gradientUnits="userSpaceOnUse" {...cssGradientLine(135, w, h)}>
          <Stop offset="0" stopColor={color.goldHot} />
          <Stop offset="0.5" stopColor={color.gold} />
          <Stop offset="1" stopColor={color.goldCta} />
        </LinearGradient>
      </Defs>
      <Rect width={w} height={h} fill="url(#start-bg)" />
      <Path d={topHighlightPath(w, h, START_RADIUS)} fill={color.white} fillOpacity={0.6} fillRule="evenodd" />
    </Svg>
  );
}

function PressDim({ pressed }: { pressed: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({ opacity: pressed.value * 0.45 }));
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.dim, style]} />;
}

interface StartButtonProps {
  cta: StartCta;
  width: number;
  busy?: boolean;
  onPress?: () => void;
}

/** `.start`: the gold START GAME slab for the host; guests get a dark waiting plate. */
export function StartButton({ cta, width, busy, onPress }: StartButtonProps) {
  if (cta.role === 'guest') {
    return (
      <View style={[styles.start, styles.wait, { width }]} accessibilityLabel={`${cta.title} ${cta.detail}`}>
        <Text style={[styles.startText, styles.waitText]}>{cta.title}</Text>
        <Text style={[styles.startDetail, styles.waitDetail]}>{cta.detail}</Text>
      </View>
    );
  }
  return (
    <PressScale
      label={`${cta.title} ${cta.detail}`}
      busy={busy}
      onPress={cta.enabled ? onPress : undefined}
      style={[styles.startShadow, !cta.enabled ? styles.startDisabled : null]}
    >
      {(pressed) => (
        <View style={[styles.start, { width }]}>
          <GoldFace w={width} h={START_HEIGHT} />
          <PressDim pressed={pressed} />
          <Text style={styles.startText}>{cta.title}</Text>
          {busy ? <ActivityIndicator size="small" color={color.bg} /> : <Text style={styles.startDetail}>{cta.detail}</Text>}
        </View>
      )}
    </PressScale>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontFamily: font.display,
    // The mockup's <h1> asks single-weight Anton for bold, so the browser emboldens it (web and Android
    // synthesise the same; iOS draws plain Anton).
    fontWeight: '700',
    fontSize: 26,
    // The mockup's line-height is 1 (26px). Native platforms cut off glyphs above a line box shorter
    // than Anton's ascent + descent, so the box is a full 40px and the margins give back the extra 14.
    lineHeight: 40,
    marginVertical: -7,
    includeFontPadding: false,
    letterSpacing: 0.8,
    color: color.cream,
  },
  titleGold: {
    color: color.gold,
  },
  sub: {
    marginTop: 3,
    fontFamily: font.body,
    fontSize: 11.5,
    lineHeight: 14,
    color: 'rgba(246,239,217,0.6)',
  },
  seg: {
    height: 44,
    borderRadius: 22,
    backgroundColor: PANEL,
    borderWidth: 1,
    borderColor: color.line,
    flexDirection: 'row',
    padding: 4,
  },
  tab: {
    flex: 1,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabOn: {
    backgroundColor: color.gold,
  },
  tabText: {
    fontFamily: font.sticker,
    fontSize: 12,
    lineHeight: 14,
    letterSpacing: 1.2,
    color: 'rgba(246,239,217,0.6)',
  },
  tabTextOn: {
    color: color.bg,
  },
  opt: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    backgroundColor: PANEL,
    borderWidth: 1,
    borderColor: color.line,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  optText: {
    fontFamily: font.bodySemi,
    fontSize: 12,
    lineHeight: 15,
    color: color.cream,
  },
  switch: {
    width: 30,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.16)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 2,
  },
  switchOn: {
    backgroundColor: color.green,
  },
  knob: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: color.white,
  },
  startShadow: {
    borderRadius: START_RADIUS,
    ...cssShadow(0, 12, 30, color.gold, 0.25, 8),
  },
  startDisabled: {
    opacity: 0.55,
  },
  start: {
    height: START_HEIGHT,
    borderRadius: START_RADIUS,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  dim: {
    backgroundColor: color.goldDeep,
  },
  startText: {
    fontFamily: font.display,
    fontSize: 24,
    lineHeight: 36,
    letterSpacing: 1.2,
    color: color.bg,
  },
  startDetail: {
    fontFamily: font.bodyBold,
    fontSize: 12,
    lineHeight: 15,
    color: color.bg,
    opacity: 0.7,
  },
  wait: {
    backgroundColor: PANEL,
    borderWidth: 1.5,
    borderColor: 'rgba(254,209,0,0.35)',
  },
  waitText: {
    color: color.gold,
  },
  waitDetail: {
    color: color.cream,
    opacity: 0.6,
  },
});
