import React, { useEffect, type ReactNode } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { color, font } from '../../theme/tokens';
import { useLudiFonts } from '../../theme/fonts';
import { Icon } from '../game/Icon';
import { PressScale } from '../home/PressScale';
import { cssShadow } from '../home/cssShadow';
import { cssGradientLine } from '../lobby/cssGradient';
import { cardHeight, WinCard } from './WinCard';
import type { WinView } from './winModel';

/**
 * win.html's `.screen.grain`, `.marble`, blurred board and red `.dim`, pre-rendered from the
 * pack in Chrome (390×844 @2x). Native has no CSS blur or feTurbulence.
 */
const BACKDROP = require('../../../assets/board/win-backdrop.jpg');

const MAX_COLUMN = 440;
const SIDE = 22;
/** Mockup: card 45pt under the status bar, buttons 16pt under the card and 16pt above the home indicator. */
const TOP_GAP = 45;
const BUTTON_GAP = 16;
const BOTTOM_GAP = 16;
const BUTTON_HEIGHT = 58;
const BUTTON_RADIUS = 18;
/** `.rays` centre sits 238pt below the card top (330 − 92). */
const RAYS_FROM_CARD = 238;
const RAYS = 900;
const RAY_TURN_MS = 40000;
const CONFETTI_MS = 2500;

const RAY_PATHS = Array.from({ length: 24 }, (_, i) => {
  const a = (i * 15 * Math.PI) / 180;
  const b = ((i * 15 + 7.5) * Math.PI) / 180;
  const c = RAYS / 2;
  return {
    d: `M${c} ${c}L${c + c * Math.cos(a)} ${c + c * Math.sin(a)}L${c + c * Math.cos(b)} ${c + c * Math.sin(b)}Z`,
    fill: i % 2 ? color.green : color.gold,
  };
});

const CONFETTI_COLORS = [color.gold, color.green, color.hot, color.white, color.red];
const CONFETTI = Array.from({ length: 42 }, (_, i) => {
  const x = (i * 97) % 390;
  const y = ((i * 53) % 300) + 40;
  return {
    x,
    y,
    w: i % 3 ? 6 : 4,
    h: i % 3 ? 3 : 8,
    r: (i * 37) % 180,
    fill: CONFETTI_COLORS[i % 5],
  };
});

/** Green and gold sunburst, one slow turn every 40 s. */
function Rays({ top, left, still }: { top: number; left: number; still: boolean }) {
  const turn = useSharedValue(0);
  useEffect(() => {
    if (still) return;
    turn.value = withRepeat(withTiming(1, { duration: RAY_TURN_MS, easing: Easing.linear }), -1, false);
  }, [still, turn]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value * 360}deg` }] }));
  return (
    <Animated.View pointerEvents="none" style={[styles.rays, { top, left }, style]}>
      <Svg width={RAYS} height={RAYS}>
        {RAY_PATHS.map((ray) => (
          <Path key={ray.d} d={ray.d} fill={ray.fill} opacity={0.18} />
        ))}
      </Svg>
    </Animated.View>
  );
}

/** Confetti drifts down into place over 2.5 s. */
function Confetti({ left, still }: { left: number; still: boolean }) {
  const fall = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (!still) fall.value = withTiming(1, { duration: CONFETTI_MS, easing: Easing.out(Easing.quad) });
  }, [still, fall]);
  const style = useAnimatedStyle(() => ({
    opacity: Math.min(1, fall.value * 3),
    transform: [{ translateY: (fall.value - 1) * 160 }],
  }));
  return (
    <Animated.View pointerEvents="none" style={[styles.confetti, { left }, style]}>
      <Svg width={390} height={400}>
        {CONFETTI.map((c) => (
          <Rect
            key={`${c.x}-${c.y}`}
            x={c.x}
            y={c.y}
            width={c.w}
            height={c.h}
            rx={1}
            fill={c.fill}
            opacity={0.85}
            transform={`rotate(${c.r} ${c.x} ${c.y})`}
          />
        ))}
      </Svg>
    </Animated.View>
  );
}

function PressDim({ pressed }: { pressed: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({ opacity: pressed.value * 0.45 }));
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.dim, style]} />;
}

/** `.b1`: gold 135° slab with a gold glow. */
function RematchButton({ width, busy, onPress }: { width: number; busy?: boolean; onPress?: () => void }) {
  return (
    <PressScale label="Rematch" hint="Play again" busy={busy} onPress={onPress} style={[styles.rematchShadow, !onPress ? styles.disabled : null]}>
      {(pressed) => (
        <View style={[styles.button, { width }]}>
          <Svg width={width} height={BUTTON_HEIGHT} style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="win-rematch" gradientUnits="userSpaceOnUse" {...cssGradientLine(135, width, BUTTON_HEIGHT)}>
                <Stop offset="0" stopColor={color.goldHot} />
                <Stop offset="0.5" stopColor={color.gold} />
                <Stop offset="1" stopColor={color.goldCta} />
              </LinearGradient>
            </Defs>
            <Rect width={width} height={BUTTON_HEIGHT} fill="url(#win-rematch)" />
          </Svg>
          <PressDim pressed={pressed} />
          {busy ? (
            <ActivityIndicator size="small" color={color.bg} />
          ) : (
            <>
              {/* A View so web stacks the icon above the absolutely positioned gradient. */}
              <View>
                <Icon name="refresh" size={20} color={color.bg} strokeWidth={2.4} />
              </View>
              <Text style={[styles.buttonText, styles.rematchText]}>REMATCH</Text>
            </>
          )}
        </View>
      )}
    </PressScale>
  );
}

/** `.b2`: cream outline on smoked black. */
function LobbyButton({ width, onPress }: { width: number; onPress: () => void }) {
  return (
    <PressScale label="Lobby" hint="Leave the game" onPress={onPress}>
      {() => (
        <View style={[styles.button, styles.lobby, { width }]}>
          <Icon name="home" size={20} color={color.cream} strokeWidth={2} />
          <Text style={styles.buttonText}>LOBBY</Text>
        </View>
      )}
    </PressScale>
  );
}

export interface WinScreenProps {
  view: WinView;
  /** Missing while a rematch cannot start (for example, not connected). */
  onRematch?: () => void;
  rematchBusy?: boolean;
  onLobby: () => void;
  /** Overrides device safe-area insets (the dev preview simulates an iPhone frame on web). */
  insets?: { top: number; bottom: number };
  children?: ReactNode;
}

/** The results poster from win.png, over everything else on the game screen. */
export function WinScreen({ view, onRematch, rematchBusy, onLobby, children, ...props }: WinScreenProps) {
  const fontsReady = useLudiFonts();
  const reduced = useReducedMotion();
  const device = useSafeAreaInsets();
  const insets = props.insets ?? device;
  const { width, height } = useWindowDimensions();

  const column = Math.min(width, MAX_COLUMN);
  const cardWidth = column - SIDE * 2;
  const card = cardHeight(view.rows.length);
  const content = card + BUTTON_GAP + BUTTON_HEIGHT;
  const spare = height - insets.top - insets.bottom - content - TOP_GAP - BOTTOM_GAP;
  const topGap = TOP_GAP + Math.max(0, spare / 2);
  const cardTop = insets.top + topGap;
  // Too short for the mockup's stack: the card scrolls and the buttons stay on screen.
  const pinned = spare < 0;
  // Chrome floors the 1.5pt LOBBY border to 1pt at 3x, so flex 1.5 : 1 splits the row less 2pt.
  const rematchWidth = (cardWidth - 10 - 2) * 0.6;
  const bottom = insets.bottom + BOTTOM_GAP;

  const buttons = (
    <View style={[styles.buttons, pinned ? { paddingTop: BUTTON_GAP, paddingBottom: bottom } : styles.buttonsInline]}>
      <RematchButton width={rematchWidth} busy={rematchBusy} onPress={onRematch} />
      <LobbyButton width={cardWidth - 10 - rematchWidth} onPress={onLobby} />
    </View>
  );

  return (
    <View style={styles.screen} accessibilityViewIsModal>
      <StatusBar style="light" />
      <Image source={BACKDROP} style={styles.fill} resizeMode="cover" accessibilityIgnoresInvertColors />
      {fontsReady ? (
        <>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} alwaysBounceVertical={false}>
            <View style={[styles.column, { width: column, paddingTop: cardTop, paddingBottom: pinned ? 0 : bottom }]}>
              <Rays top={cardTop + RAYS_FROM_CARD - RAYS / 2} left={column / 2 - RAYS / 2} still={reduced} />
              <Confetti left={(column - 390) / 2} still={reduced} />
              <WinCard view={view} width={cardWidth} />
              {pinned ? null : buttons}
            </View>
          </ScrollView>
          {pinned ? buttons : null}
        </>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    // Android stacks siblings by elevation before zIndex; the board rails use up to 8.
    elevation: 30,
    backgroundColor: color.bg,
  },
  // A required image defaults to its intrinsic size, which beats left/right/top/bottom alone.
  fill: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
  column: {
    flexGrow: 1,
    alignItems: 'center',
  },
  rays: {
    position: 'absolute',
    width: RAYS,
    height: RAYS,
    opacity: 0.5,
  },
  confetti: {
    position: 'absolute',
    top: 0,
    width: 390,
    height: 400,
  },
  buttons: {
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  buttonsInline: {
    marginTop: BUTTON_GAP,
  },
  button: {
    height: BUTTON_HEIGHT,
    borderRadius: BUTTON_RADIUS,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  rematchShadow: {
    borderRadius: BUTTON_RADIUS,
    ...cssShadow(0, 12, 30, color.gold, 0.25, 8),
  },
  disabled: {
    opacity: 0.55,
  },
  dim: {
    backgroundColor: color.goldDeep,
  },
  lobby: {
    borderWidth: 1.5,
    borderColor: 'rgba(246,239,217,0.5)',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  buttonText: {
    fontFamily: font.display,
    fontSize: 21,
    lineHeight: 32,
    includeFontPadding: false,
    letterSpacing: 1,
    color: color.cream,
  },
  rematchText: {
    color: color.bg,
  },
});
