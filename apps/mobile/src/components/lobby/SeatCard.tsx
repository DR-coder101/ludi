import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, LinearGradient, Rect, Stop } from 'react-native-svg';
import { accent, color, font, piece as PIECE, PLACES, type Corner, type PieceColor } from '../../theme/tokens';
import { Icon } from '../game/Icon';
import { MiniMap } from '../board/MiniMap';
import { PieceDefs, PieceGlyph } from '../board/PieceGlyph';
import { cssShadow } from '../home/cssShadow';
import { triggerHaptic } from '../../utils/gameAudio';
import { cssGradientLine } from './cssGradient';
import type { LobbySeat } from './lobbyModel';

export const SEAT_HEIGHT = 150;
const RADIUS = 18;
const BORDER = 1.5;
const CORNERS: Corner[] = ['TL', 'TR', 'BL', 'BR'];
/**
 * Town names: Anton 22 at the mockup's 0.98 line-height, which Chrome draws on a 22px line pitch.
 * Native platforms cut off glyphs above a line box shorter than Anton's ascent + descent
 * (1.505em), so each line gets a full 34px box and the boxes overlap to keep that pitch.
 */
const NAME_TOP = 10;
const NAME_STEP = 22;
const NAME_BOX = 34;
/** `.pc.sel` glow. The mockup's is Kingston red; other seats glow in their own piece colour. */
const GLOW: Record<PieceColor, string> = { gold: PIECE.gold.mid, green: PIECE.green.mid, red: PIECE.red.mid, black: color.silver };

interface SeatCardProps {
  seat: LobbySeat;
  width: number;
  onInvite?: () => void;
}

function CardFace({ w, h }: { w: number; h: number }) {
  return (
    <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="pc-bg" gradientUnits="userSpaceOnUse" {...cssGradientLine(170, w, h)}>
          <Stop offset="0" stopColor="#18181b" />
          <Stop offset="1" stopColor="#0d0d0f" />
        </LinearGradient>
      </Defs>
      <Rect width={w} height={h} fill="url(#pc-bg)" />
    </Svg>
  );
}

/** `.pc .av`: grey head-and-shoulders on a dark disc. */
function Avatar() {
  return (
    <Svg width={24} height={24}>
      <Defs>
        <ClipPath id="seat-av">
          <Circle cx={12} cy={12} r={12} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#seat-av)">
        <Circle cx={12} cy={12} r={12} fill="#35363b" />
        <Ellipse cx={12} cy={24} rx={14.1} ry={10.6} fill="#8a8c92" />
        <Circle cx={12} cy={9.12} r={4.97} fill="#8a8c92" />
      </G>
    </Svg>
  );
}

/** Four squares, the seat's corner lit in its accent. */
function CornerMark({ corner, tint }: { corner: Corner; tint: string }) {
  return (
    <View style={styles.cornerMark}>
      {CORNERS.map((c) => (
        <View key={c} style={[styles.cornerCell, c === corner ? { backgroundColor: tint } : null]} />
      ))}
    </View>
  );
}

export function SeatCard({ seat, width, onInvite }: SeatCardProps) {
  const place = PLACES[seat.color];
  const a = accent[place.piece];
  const open = seat.name == null;
  const border = seat.you ? a : open ? 'rgba(255,255,255,0.14)' : `${a}88`;
  const glow = GLOW[place.piece];
  const inner = { w: width - BORDER * 2, h: SEAT_HEIGHT - BORDER * 2 };
  const label = open ? `${place.full}, open seat. ${seat.status}` : `${place.full}: ${seat.name}, ${seat.status}`;

  const card = (
    <View style={[styles.card, { width, borderColor: border }]}>
      <CardFace w={inner.w} h={inner.h} />
      <View style={styles.name} pointerEvents="none">
        {place.lines.map((line, i) => (
          <Text key={line} style={[styles.nameLine, i > 0 ? styles.nameNext : null, { color: a }]}>
            {line}
          </Text>
        ))}
      </View>
      <CornerMark corner={place.corner} tint={a} />
      {seat.you ? (
        <View style={[styles.tick, { backgroundColor: PIECE[place.piece].mid }]}>
          <Icon name="check" size={12} color={color.white} strokeWidth={3} />
        </View>
      ) : null}
      <Svg width={92} height={40} style={styles.map}>
        <MiniMap pin={place.pin} x={2} y={4} w={86} pinColor={a} pinStroke={color.ink} />
      </Svg>
      <Svg width={34} height={40} style={styles.piece}>
        <PieceDefs />
        <PieceGlyph piece={place.piece} cx={17} cy={18} r={12} />
      </Svg>
      {open ? (
        <View style={[styles.who, styles.whoOpen]}>
          <View style={styles.plus}>
            <Icon name="plus" size={14} color={color.cream} strokeWidth={2.2} />
          </View>
          <Text style={styles.inviteText} numberOfLines={1}>
            {seat.status}
          </Text>
        </View>
      ) : (
        <View style={styles.who}>
          <Avatar />
          <View style={styles.whoText}>
            <Text style={styles.player} numberOfLines={1}>
              {seat.name}
            </Text>
            <Text style={[styles.status, seat.ready ? styles.statusReady : null]} numberOfLines={1}>
              {seat.status}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.seat, seat.you ? cssShadow(0, 0, 24, glow, 0.35, 0) : null]}>
      {seat.you ? <View pointerEvents="none" style={[styles.ring, { borderColor: `${glow}40` }]} /> : null}
      {open && onInvite ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityHint="Share the room invite"
          onPress={() => {
            triggerHaptic.light();
            onInvite();
          }}
        >
          {card}
        </Pressable>
      ) : (
        <View accessible accessibilityLabel={label}>
          {card}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  seat: {
    borderRadius: RADIUS,
  },
  /** `0 0 0 3px` spread ring. */
  ring: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: RADIUS + 3,
    borderWidth: 3,
  },
  card: {
    height: SEAT_HEIGHT,
    borderRadius: RADIUS,
    borderWidth: BORDER,
    backgroundColor: '#131315',
    overflow: 'hidden',
  },
  name: {
    position: 'absolute',
    left: 12,
    top: NAME_TOP - (NAME_BOX - NAME_STEP) / 2,
  },
  nameLine: {
    fontFamily: font.display,
    fontSize: 22,
    lineHeight: NAME_BOX,
    letterSpacing: 0.4,
    includeFontPadding: false,
  },
  nameNext: {
    marginTop: NAME_STEP - NAME_BOX,
  },
  cornerMark: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 11.5,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 1.5,
  },
  cornerCell: {
    width: 5,
    height: 5,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tick: {
    position: 'absolute',
    right: 10,
    top: 34,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: color.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  map: {
    position: 'absolute',
    left: 12,
    top: 66,
  },
  piece: {
    position: 'absolute',
    right: 8,
    top: 62,
  },
  who: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 6,
  },
  whoOpen: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(246,239,217,0.3)',
  },
  whoText: {
    flex: 1,
  },
  player: {
    fontFamily: font.bodyBold,
    fontSize: 12,
    lineHeight: 15,
    color: color.cream,
  },
  status: {
    fontFamily: font.bodySemi,
    fontSize: 10,
    lineHeight: 12,
    color: 'rgba(246,239,217,0.55)',
  },
  statusReady: {
    color: color.greenBright,
  },
  plus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(246,239,217,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteText: {
    flex: 1,
    fontFamily: font.bodyBold,
    fontSize: 12,
    lineHeight: 15,
    color: 'rgba(246,239,217,0.75)',
  },
});
