import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { color, font } from '../../theme/tokens';
import { LiveVideoFill } from './LiveVideoFill';
import { tileLabel, type SeatVideo } from './seatVideo';

export function SeatVideoTile({
  seat,
  tint,
}: {
  seat: Exclude<SeatVideo, { kind: 'none' }>;
  tint: string;
}) {
  const speaking = seat.speaking;
  const label = tileLabel(seat);
  return (
    <View
      accessibilityLabel={label}
      style={[
        styles.tile,
        { borderColor: tint, borderWidth: speaking ? 2.2 : 1.3 },
      ]}
    >
      {seat.kind === 'camOff' ? (
        <View style={styles.camOff}>
          <Text style={styles.initial}>{seat.initial}</Text>
          <Text style={styles.camOffLabel}>CAM OFF</Text>
        </View>
      ) : (
        <View style={styles.liveFill}>
          <View style={styles.head} />
          <View style={styles.shoulders} />
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
        {seat.muted ? <Text style={styles.micOff}>MIC OFF</Text> : null}
      </View>
    </View>
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
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: '#3a3b40',
  },
  head: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#7b7d83',
    marginBottom: 2,
  },
  shoulders: {
    width: 36,
    height: 16,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: '#7b7d83',
    marginBottom: 16,
  },
  camOff: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.ink,
    gap: 4,
  },
  initial: {
    fontFamily: font.display,
    fontSize: 22,
    color: color.cream,
  },
  camOffLabel: {
    fontFamily: font.sticker,
    fontSize: 6,
    letterSpacing: 0.6,
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
  micOff: {
    fontFamily: font.sticker,
    fontSize: 5,
    color: '#ff6b6b',
  },
});
