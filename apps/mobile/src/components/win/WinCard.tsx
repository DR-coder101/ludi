import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, View, type TextStyle } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, LinearGradient, Mask, Pattern, Polygon, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { accent, color, font, PLACES, type PieceColor } from '../../theme/tokens';
import { antonBold } from '../../theme/antonBold';
import { MiniMap } from '../board/MiniMap';
import { Icon } from '../game/Icon';
import { cssShadow } from '../home/cssShadow';
import { triggerHaptic } from '../../utils/gameAudio';
import { headlineSize, placeTitleSize, type WinRow, type WinStat, type WinView } from './winModel';

const GRAIN = require('../../../assets/board/grain.png');

const BORDER = 2;
const FLAG = 10;
const TOP = 300;
const ROW = 30;
const ROW_GAP = 6;
/** Flag, poster, headline, detail, stats and their margins, plus the 2pt under the last row (win.html). */
const FIXED = FLAG + TOP + 16 + 40 + 2 + 15 + 14 + 75 + 12 + 2;

export function cardHeight(rows: number): number {
  return FIXED + rows * ROW + (rows - 1) * ROW_GAP + BORDER * 2;
}

interface Poster {
  /** `.top` radial stops at 0, 60% and 100%. */
  stops: [string, string, string];
  /** CSS `overlay` grain over a dark base is about `2 × base` blended normally. */
  grain: string;
  island: string;
  rowFill: string;
  rowLine: string;
}

/** win.html draws Kingston's red poster; the other towns get the same treatment in their own colour. */
const POSTER: Record<PieceColor, Poster> = {
  red: { stops: ['#B3121F', '#6E0A12', '#2a0508'], grain: '#FF1C30', island: '#D9505B', rowFill: 'rgba(228,32,46,0.14)', rowLine: 'rgba(255,51,64,0.4)' },
  green: { stops: ['#0B7A34', '#05461D', '#01200C'], grain: '#16D45E', island: '#4FBF78', rowFill: 'rgba(15,174,71,0.14)', rowLine: 'rgba(25,196,90,0.4)' },
  gold: { stops: ['#6E5600', '#3D3000', '#171200'], grain: '#DCAC00', island: '#C9AA3A', rowFill: 'rgba(254,209,0,0.12)', rowLine: 'rgba(254,209,0,0.4)' },
  black: { stops: ['#3A3B41', '#1E1F23', '#0B0B0C'], grain: '#5A5C64', island: '#8A8D94', rowFill: 'rgba(217,220,225,0.1)', rowLine: 'rgba(217,220,225,0.35)' },
};

interface Layer {
  dx: number;
  dy: number;
  color: string;
}

/**
 * CSS `text-shadow` with zero blur as offset copies underneath: React Native allows one
 * shadow per Text, and Android draws nothing for a zero shadow radius.
 */
function PosterText({ text, style, layers, top }: { text: string; style: TextStyle; layers: Layer[]; top: number }) {
  return (
    <View style={[styles.posterLine, { top }]} accessible accessibilityRole="header" accessibilityLabel={text}>
      {layers.map((l) => (
        <Text
          key={`${l.dx}-${l.color}`}
          style={[style, styles.posterCopy, { color: l.color, transform: [{ translateX: l.dx }, { translateY: l.dy }] }]}
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
        >
          {text}
        </Text>
      ))}
      <Text style={style}>{text}</Text>
    </View>
  );
}

/** `.av`: the pack's grey silhouette, 88pt with a 3pt gold rim (CSS background percentages on the 82pt padding box). */
function Avatar() {
  return (
    <View style={styles.avatar}>
      <Svg width={88} height={88}>
        <Defs>
          <ClipPath id="win-av">
            <Circle cx={44} cy={44} r={41} />
          </ClipPath>
        </Defs>
        <Circle cx={44} cy={44} r={44} fill="#3a3b40" />
        <G clipPath="url(#win-av)">
          <Circle cx={44} cy={34.2} r={16} fill="#8a8c92" />
          <Ellipse cx={44} cy={85} rx={46.6} ry={33.7} fill="#8a8c92" />
        </G>
        <Circle cx={44} cy={44} r={42.5} fill="none" stroke={color.gold} strokeWidth={3} />
      </Svg>
    </View>
  );
}

const BURST_POINTS = Array.from({ length: 28 }, (_, i) => {
  const a = (i * Math.PI) / 14;
  const r = i % 2 ? 30 : 38;
  return `${(40 + r * Math.cos(a)).toFixed(1)},${(40 + r * Math.sin(a)).toFixed(1)}`;
}).join(' ');

/** The BIG UP! sticker: drops in 200 ms after the card lands, with the second success haptic. */
function BigUp({ still }: { still: boolean }) {
  const drop = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (still) return;
    drop.value = withDelay(480, withSpring(1, { duration: 280, dampingRatio: 0.55 }));
    const t = setTimeout(() => triggerHaptic.success(), 480);
    return () => clearTimeout(t);
  }, [still, drop]);
  const style = useAnimatedStyle(() => ({
    opacity: Math.min(1, drop.value * 2),
    transform: [{ translateY: (1 - drop.value) * -36 }, { rotate: '12deg' }, { scale: 1 + (1 - drop.value) * 0.5 }],
  }));
  return (
    <Animated.View style={[styles.burst, style]} accessibilityLabel="Big up!">
      <Svg width={80} height={80}>
        <Polygon points={BURST_POINTS} fill={color.hot} stroke={color.bg} strokeWidth={2} />
        <SvgText x={40} y={37} textAnchor="middle" fontFamily={font.display} fontSize={15} fill={color.white}>
          BIG
        </SvgText>
        <SvgText x={40} y={54} textAnchor="middle" fontFamily={font.display} fontSize={15} fill={color.white}>
          UP!
        </SvgText>
      </Svg>
    </Animated.View>
  );
}

/** `.top`: radial red with halftone fading in from the top. */
function PosterBackdrop({ w, poster }: { w: number; poster: Poster }) {
  const cx = w / 2;
  const cy = TOP * 0.6;
  const rx = w * 0.9;
  const ry = TOP * 0.8;
  return (
    <Svg width={w} height={TOP} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient
            id="win-top"
            gradientUnits="userSpaceOnUse"
            cx={cx}
            cy={cy}
            fx={cx}
            fy={cy}
            r={rx}
            gradientTransform={`translate(${cx} ${cy}) scale(1 ${ry / rx}) translate(${-cx} ${-cy})`}
          >
            <Stop offset="0" stopColor={poster.stops[0]} />
            <Stop offset="0.6" stopColor={poster.stops[1]} />
            <Stop offset="1" stopColor={poster.stops[2]} />
          </RadialGradient>
          <Pattern id="win-dots" width={6} height={6} patternUnits="userSpaceOnUse">
            <Circle cx={3} cy={3} r={1.2} fill={color.white} fillOpacity={0.12} />
          </Pattern>
          <LinearGradient id="win-fade" x1="0" y1="0" x2="0" y2={TOP} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={color.white} stopOpacity={0} />
            <Stop offset="0.7" stopColor={color.white} stopOpacity={1} />
          </LinearGradient>
          <Mask id="win-dots-mask" x={0} y={0} width={w} height={TOP} maskUnits="userSpaceOnUse">
            <Rect width={w} height={TOP} fill="url(#win-fade)" />
          </Mask>
        </Defs>
        <Rect width={w} height={TOP} fill="url(#win-top)" />
        <Rect width={w} height={TOP} fill="url(#win-dots)" mask="url(#win-dots-mask)" />
    </Svg>
  );
}

/**
 * `.grain::after`. CSS overlay barely changes white or gold text, but a tinted normal blend
 * would stain it, so the grain sits under the text instead of over it.
 */
function Grain({ tint, w, h, top }: { tint: string; w: number; h: number; top: number }) {
  return (
    <View pointerEvents="none" style={[styles.grain, { width: w, height: h, top }]}>
      <Image source={GRAIN} resizeMode="repeat" style={{ width: w, height: h, tintColor: tint }} accessibilityIgnoresInvertColors />
    </View>
  );
}

function Stats({ stats }: { stats: WinStat[] }) {
  return (
    <View style={styles.stats}>
      {stats.map((s, i) => (
        <View key={s.label} style={[styles.stat, i > 0 ? styles.statDivider : null]} accessible accessibilityLabel={`${s.label} ${s.value}`}>
          <Text style={styles.statValue}>{s.value}</Text>
          <Text style={styles.statLabel}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}

function RankRow({ row, poster }: { row: WinRow; poster: Poster }) {
  const a = accent[PLACES[row.color].piece];
  return (
    <View
      style={[styles.row, row.winner ? { backgroundColor: poster.rowFill, borderWidth: 1, borderColor: poster.rowLine } : null]}
      accessible
      accessibilityLabel={`${row.rank}. ${row.name}, ${row.progress.toLowerCase()}, ${PLACES[row.color].full}`}
    >
      <Text style={[styles.rank, row.winner ? styles.rankWinner : null]}>{row.rank}</Text>
      <View style={styles.dot}>
        <View style={styles.dotRing} />
        <View style={[styles.dotFill, { backgroundColor: a }]} />
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {row.name}
      </Text>
      <Text style={styles.progress}>· {row.progress}</Text>
      <Text style={[styles.place, { color: a }]}>{row.place}</Text>
    </View>
  );
}

interface WinCardProps {
  view: WinView;
  width: number;
}

/** `.card`: the poster slams in (scale 1.15 → 1, 280 ms spring). */
export function WinCard({ view, width }: WinCardProps) {
  const reduced = useReducedMotion();
  const poster = POSTER[PLACES[view.winner].piece];
  const inner = width - BORDER * 2;
  const height = cardHeight(view.rows.length);
  const placeSize = placeTitleSize(view.place, inner);
  // Anton needs ~1.505em of line box on native; each title gets a full box, centred on the mockup's line.
  const placeBox = Math.ceil(placeSize * 1.54);
  const headSize = headlineSize(view.headline, inner - 32);

  const slam = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (!reduced) slam.value = withSpring(1, { duration: 280, dampingRatio: 0.7 });
  }, [reduced, slam]);
  const slamStyle = useAnimatedStyle(() => ({
    opacity: withTiming(slam.value > 0 ? 1 : 0, { duration: 120 }),
    transform: [{ scale: 1.15 - 0.15 * slam.value }],
  }));

  return (
    <Animated.View style={[{ width, height }, slamStyle]}>
      <View style={styles.ring} />
      <View style={[styles.shadow, { width, height }]}>
        <View style={[styles.card, { width, height }]}>
          <Svg width={inner} height={height - BORDER * 2} style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="win-card" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#141416" />
                <Stop offset="1" stopColor={color.bg} />
              </LinearGradient>
            </Defs>
            <Rect width={inner} height={height - BORDER * 2} fill="url(#win-card)" />
          </Svg>
          <Grain tint="#28282C" w={inner} h={height - BORDER * 2 - FLAG - TOP} top={FLAG + TOP} />
          <View style={styles.flag}>
            <View style={[styles.flagBand, { backgroundColor: color.green }]} />
            <View style={[styles.flagBand, { backgroundColor: color.gold }]} />
            <View style={[styles.flagBand, { backgroundColor: color.bg }]} />
          </View>
          <View style={[styles.top, { width: inner }]}>
            <PosterBackdrop w={inner} poster={poster} />
            <Grain tint={poster.grain} w={inner} h={TOP} top={0} />
            <Text style={styles.kicker}>{view.kicker}</Text>
            <PosterText text="WINNER" style={styles.winner} top={7} layers={[{ dx: 4, dy: 4, color: color.bg }]} />
            <PosterText
              text={view.place}
              style={{ ...styles.town, fontSize: placeSize, lineHeight: placeBox }}
              // The mockup's 60pt line starts at 124; Chrome draws its caps 1pt above that line's centre.
              top={153 - placeBox / 2}
              layers={[
                { dx: 6, dy: 6, color: color.green },
                { dx: 3, dy: 3, color: color.bg },
              ]}
            />
            <Svg width={84} height={36} style={styles.map}>
              <MiniMap pin={PLACES[view.winner].pin} x={2} y={2} w={80} pinColor={color.gold} pinStroke={color.white} base={poster.island} />
            </Svg>
            <View style={styles.avatarWrap}>
              <Avatar />
              <View style={styles.crown}>
                <Icon name="crown" size={34} color={color.gold} strokeWidth={2} />
              </View>
            </View>
            <BigUp still={reduced} />
          </View>
          <Text style={[styles.headline, { fontSize: headSize }]} numberOfLines={1} accessibilityRole="header">
            {view.headline}
          </Text>
          <Text style={styles.detail}>{view.detail}</Text>
          <Stats stats={view.stats} />
          <View style={styles.rows}>
            {view.rows.map((row) => (
              <RankRow key={row.color} row={row} poster={poster} />
            ))}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

/**
 * Line heights are Chrome's `normal` for each font and size in win.html (Inter 12.5 → 15,
 * Inter 11.5 → 14, Archivo Black 9.5 → 10, Anton 15 → 23, Anton 26 → 40). Anton titles
 * shorter than ~1.505em in the mockup get a taller box and negative offsets instead.
 */
const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: 30,
    backgroundColor: 'rgba(254,209,0,0.08)',
  },
  shadow: {
    borderRadius: 24,
    backgroundColor: color.bg,
    ...cssShadow(0, 24, 60, '#000', 0.8, 18),
  },
  card: {
    borderRadius: 24,
    borderWidth: BORDER,
    borderColor: color.gold,
    overflow: 'hidden',
  },
  flag: {
    height: FLAG,
    flexDirection: 'row',
  },
  flagBand: {
    flex: 1,
  },
  top: {
    height: TOP,
    overflow: 'hidden',
  },
  grain: {
    position: 'absolute',
    left: 0,
    opacity: 0.22,
  },
  kicker: {
    position: 'absolute',
    top: 18,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: font.sticker,
    fontSize: 10.5,
    lineHeight: 11,
    letterSpacing: 3,
    color: color.gold,
  },
  posterLine: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  posterCopy: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  winner: {
    fontFamily: font.display,
    fontSize: 92,
    // Mockup line-height .9 (82.8) at top 36; a 140pt box keeps native from cutting the caps.
    lineHeight: 140,
    includeFontPadding: false,
    letterSpacing: 1,
    textAlign: 'center',
    color: color.white,
  },
  town: {
    fontFamily: font.display,
    includeFontPadding: false,
    letterSpacing: 2,
    textAlign: 'center',
    color: color.gold,
  },
  map: {
    position: 'absolute',
    left: 16,
    top: 212,
  },
  avatarWrap: {
    position: 'absolute',
    top: 200,
    left: '50%',
    marginLeft: -44,
    width: 88,
    height: 88,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#3a3b40',
    ...cssShadow(0, 8, 24, '#000', 0.6, 10),
  },
  crown: {
    position: 'absolute',
    top: -24,
    left: 27,
  },
  burst: {
    position: 'absolute',
    right: 14,
    top: 188,
    width: 80,
    height: 84,
  },
  headline: {
    marginTop: 16,
    marginHorizontal: 16,
    fontFamily: font.display,
    lineHeight: 40,
    includeFontPadding: false,
    letterSpacing: 0.6,
    textAlign: 'center',
    color: color.cream,
  },
  detail: {
    marginTop: 2,
    fontFamily: font.body,
    fontSize: 12.5,
    lineHeight: 15,
    textAlign: 'center',
    color: 'rgba(246,239,217,0.65)',
  },
  stats: {
    marginTop: 14,
    marginHorizontal: 18,
    height: 75,
    flexDirection: 'row',
    borderRadius: 14,
    backgroundColor: '#161618',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 10,
  },
  statDivider: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.07)',
  },
  statValue: {
    fontFamily: font.display,
    // Mockup <b> asks Anton for bold; antonBold synthesises on web/Android and keeps Anton on iOS.
    ...antonBold,
    fontSize: 22,
    // Chrome's 33 is a hair under Anton's 33.1 ascent + descent; 35 with -1 margins keeps the baseline.
    lineHeight: 35,
    marginVertical: -1,
    includeFontPadding: false,
    letterSpacing: 0.5,
    color: color.gold,
  },
  statLabel: {
    marginTop: 6,
    fontFamily: font.bodyBold,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 1,
    color: 'rgba(246,239,217,0.55)',
  },
  rows: {
    marginTop: 12,
    marginHorizontal: 18,
    gap: ROW_GAP,
  },
  row: {
    height: ROW,
    borderRadius: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  rank: {
    width: 16,
    fontFamily: font.display,
    fontSize: 15,
    lineHeight: 23,
    includeFontPadding: false,
    color: 'rgba(246,239,217,0.5)',
  },
  rankWinner: {
    color: color.gold,
  },
  dot: {
    width: 10,
    height: 10,
  },
  dotRing: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  dotFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 5,
  },
  name: {
    flexShrink: 1,
    fontFamily: font.bodySemi,
    fontSize: 12.5,
    lineHeight: 15,
    color: color.cream,
  },
  progress: {
    fontFamily: font.body,
    fontSize: 11.5,
    lineHeight: 14,
    color: 'rgba(246,239,217,0.45)',
  },
  place: {
    marginLeft: 'auto',
    fontFamily: font.sticker,
    fontSize: 9.5,
    lineHeight: 10,
    letterSpacing: 1,
  },
});
