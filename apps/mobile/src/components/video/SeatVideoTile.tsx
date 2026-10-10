import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { color, font, type PieceColor } from '../../theme/tokens';
import { Icon } from '../game/Icon';
import { LiveVideoFill } from './LiveVideoFill';
import { PortraitAvatar } from './PortraitAvatar';
import { tileLabel, type SeatVideo } from './seatVideo';

export function SeatVideoTile({
  seat,
  tint,
  piece,
}: {
  seat: Exclude<SeatVideo, { kind: 'none' }>;
  tint: string;
  piece: PieceColor;
}) {
  const speaking = seat.speaking;
  const label = tileLabel(seat);
  return (
    <View
      accessibilityLabel={label}
      style={[
        styles.tile,
        { borderColor: tint, borderWidth: speaking ? 2.2 : 1.4 },
        speaking ? { shadowColor: tint, shadowOpacity: 0.85, shadowRadius: 5, shadowOffset: { width: 0, height: 0 } } : null,
      ]}
    >
      {seat.kind === 'camOff' ? (
        <View style={styles.camOff}>
          <View style={[styles.initialCircle, { borderColor: tint }]}>
            <Text style={styles.initial}>{seat.initial}</Text>
          </View>
          <View style={styles.camOffBadge} accessibilityLabel="Camera off">
            <CamOffGlyph />
            <Text style={styles.camOffLabel}>CAM OFF</Text>
          </View>
        </View>
      ) : (
        <View style={styles.liveFill}>
          <PortraitAvatar piece={piece} />
          {seat.identity ? (
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <LiveVideoFill identity={seat.identity} />
            </View>
          ) : null}
        </View>
      )}
      {seat.you ? (
        <View style={styles.youBadge}>
          <Text style={styles.youText}>YOU</Text>
        </View>
      ) : null}
      {speaking ? (
        <View style={styles.levels} accessibilityLabel="Speaking">
          {[6, 10, 8, 4].map((h, i) => (
            <View key={i} style={[styles.level, { height: h, backgroundColor: tint }]} />
          ))}
        </View>
      ) : null}
      <View style={styles.nameBar}>
        <Text style={styles.name} numberOfLines={1}>
          {label}
        </Text>
        {seat.muted ? (
          <View style={styles.micOffBadge} accessibilityLabel="Microphone off">
            <Icon name="mic" size={7} color="#ff6b6b" strokeWidth={2} />
          </View>
        ) : (
          <Icon name="mic" size={7} color={color.white} strokeWidth={2} />
        )}
      </View>
    </View>
  );
}

function CamOffGlyph() {
  return (
    <Svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke={color.creamMuted} strokeWidth={2} strokeLinecap="round">
      <Rect x={3} y={7} width={11} height={10} rx={2} />
      <Path d="M14 10.5l5-3v9l-5-3z" />
      <Path d="M4 20L20 4" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    borderRadius: 7,
    overflow: 'hidden',
    backgroundColor: '#2a2b2f',
  },
  liveFill: {
    flex: 1,
  },
  camOff: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.ink,
    gap: 5,
  },
  initialCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2b2f',
  },
  initial: {
    fontFamily: font.display,
    fontSize: 16,
    color: color.cream,
  },
  camOffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  camOffLabel: {
    fontFamily: font.sticker,
    fontSize: 5.5,
    letterSpacing: 0.5,
    color: color.creamMuted,
  },
  youBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: color.hot,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  youText: {
    fontFamily: font.sticker,
    fontSize: 6,
    color: color.white,
  },
  levels: {
    position: 'absolute',
    top: 5,
    right: 5,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 1.5,
    height: 10,
  },
  level: {
    width: 2.4,
    borderRadius: 1,
  },
  nameBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  name: {
    flex: 1,
    fontFamily: font.bodyBold,
    fontSize: 7,
    color: color.white,
  },
  micOffBadge: {
    minWidth: 10,
    alignItems: 'center',
  },
});
