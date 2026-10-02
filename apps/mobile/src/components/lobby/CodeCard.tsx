import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Mask, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';
import { color, font } from '../../theme/tokens';
import { Icon, type IconName } from '../game/Icon';
import { PressScale } from '../home/PressScale';
import { cssShadow } from '../home/cssShadow';
import { cssGradientLine } from './cssGradient';
import { MAX_PLAYERS, type RoomNote } from './lobbyModel';

export const CODE_CARD_HEIGHT = 148;
const RADIUS = 20;
const BORDER = 1;
const PAD = 18;
const TILE = { w: 46, h: 58, gap: 7 };

interface CodeCardProps {
  code: string;
  width: number;
  players: number;
  note: RoomNote;
  onCopy: () => void;
  onShare: () => void;
}

/** `.codecard`: 160° face with a green halftone washing out from the top-right corner. */
function CardFace({ w, h }: { w: number; h: number }) {
  const line = cssGradientLine(160, w, h);
  // `.ht` sits at right:-30 top:-30, 220×200, masked by radial-gradient(closest-side).
  const ht = { x: w + 30 - 220, y: -30, width: 220, height: 200 };
  return (
    <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="cc-bg" gradientUnits="userSpaceOnUse" {...line}>
          <Stop offset="0" stopColor="#1c1d20" />
          <Stop offset="1" stopColor="#0e0e10" />
        </LinearGradient>
        <Pattern id="cc-dots" x={ht.x} y={ht.y} width={6} height={6} patternUnits="userSpaceOnUse">
          <Circle cx={3} cy={3} r={1.2} fill={color.green} fillOpacity={0.35} />
        </Pattern>
        <RadialGradient id="cc-fade" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <Stop offset="0" stopColor="#fff" stopOpacity={1} />
          <Stop offset="1" stopColor="#fff" stopOpacity={0} />
        </RadialGradient>
        <Mask id="cc-mask">
          <Rect {...ht} fill="url(#cc-fade)" />
        </Mask>
      </Defs>
      <Rect width={w} height={h} fill="url(#cc-bg)" />
      <Rect {...ht} fill="url(#cc-dots)" mask="url(#cc-mask)" />
    </Svg>
  );
}

function Chip({ icon, label, tone, onPress }: { icon: IconName; label: string; tone: 'dark' | 'green'; onPress: () => void }) {
  const ink = tone === 'green' ? color.white : color.cream;
  return (
    <PressScale label={label} onPress={onPress} style={[styles.chip, tone === 'green' ? styles.chipGreen : styles.chipDark]}>
      {() => (
        <>
          <Icon name={icon} size={15} color={ink} />
          <Text style={[styles.chipText, { color: ink }]}>{label}</Text>
        </>
      )}
    </PressScale>
  );
}

export function CodeCard({ code, width, players, note, onCopy, onShare }: CodeCardProps) {
  const inner = { w: width - BORDER * 2, h: CODE_CARD_HEIGHT - BORDER * 2 };
  const chars = code.split('');
  const tileW = Math.min(TILE.w, (inner.w - PAD * 2 - TILE.gap * (chars.length - 1)) / chars.length);

  return (
    <View style={[styles.shadow, { width }]}>
      <View style={styles.card} accessibilityRole="summary" accessibilityLabel={`Room code ${chars.join(' ')}`}>
        <CardFace w={inner.w} h={inner.h} />
        <Text style={styles.label}>ROOM CODE</Text>
        <View style={styles.tiles}>
          {chars.map((c, i) => (
            <View key={i} style={[styles.tile, { width: tileW }]}>
              <View style={styles.tileInset} />
              <Text style={styles.tileText}>{c}</Text>
            </View>
          ))}
        </View>
        <View style={styles.sticker}>
          <Text style={styles.stickerText}>
            {players}/{MAX_PLAYERS} IN
          </Text>
        </View>
        <View style={styles.actions}>
          <Chip icon="copy" label="Copy" tone="dark" onPress={onCopy} />
          <Chip icon="share" label="Share invite" tone="green" onPress={onShare} />
          <Text
            style={[styles.note, note.tone === 'warn' ? styles.noteWarn : null]}
            numberOfLines={1}
            accessibilityLiveRegion="polite"
          >
            {note.text}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: RADIUS,
    ...cssShadow(0, 12, 30, '#000', 0.6, 10),
  },
  card: {
    height: CODE_CARD_HEIGHT,
    borderRadius: RADIUS,
    borderWidth: BORDER,
    borderColor: 'rgba(254,209,0,0.35)',
    backgroundColor: '#151618',
    overflow: 'hidden',
  },
  label: {
    position: 'absolute',
    left: PAD,
    top: 16,
    fontFamily: font.sticker,
    fontSize: 10,
    lineHeight: 11,
    letterSpacing: 2,
    color: color.greenBright,
  },
  tiles: {
    position: 'absolute',
    left: PAD,
    top: 38,
    flexDirection: 'row',
    gap: TILE.gap,
  },
  tile: {
    height: TILE.h,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(254,209,0,0.55)',
    backgroundColor: color.bg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  /** `inset 0 -3px 0 rgba(254,209,0,.12)`. */
  tileInset: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    backgroundColor: 'rgba(254,209,0,0.12)',
  },
  tileText: {
    fontFamily: font.display,
    fontSize: 36,
    lineHeight: 54,
    color: color.gold,
  },
  sticker: {
    position: 'absolute',
    right: 14,
    top: 14,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: color.hot,
    transform: [{ rotate: '6deg' }],
    ...cssShadow(2, 2, 0, color.bg, 1, 0),
  },
  stickerText: {
    fontFamily: font.sticker,
    fontSize: 10,
    lineHeight: 11,
    letterSpacing: 1,
    color: color.white,
  },
  actions: {
    position: 'absolute',
    left: PAD,
    right: PAD,
    bottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipDark: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  chipGreen: {
    backgroundColor: color.green,
    borderColor: color.green,
  },
  chipText: {
    fontFamily: font.bodyBold,
    fontSize: 12,
    lineHeight: 15,
  },
  note: {
    flexShrink: 1,
    marginLeft: 'auto',
    fontFamily: font.bodySemi,
    fontSize: 11,
    lineHeight: 14,
    color: 'rgba(246,239,217,0.55)',
  },
  noteWarn: {
    color: color.gold,
  },
});
