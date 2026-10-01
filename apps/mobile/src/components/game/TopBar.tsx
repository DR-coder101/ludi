import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { color, font, layout } from '../../theme/tokens';
import { RoundButton } from './RoundButton';

interface TopBarProps {
  /** Online room code; null for pass-and-play on one device. */
  roomCode: string | null;
  onMenu?: () => void;
  onProfile?: () => void;
}

function PlateFace() {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
      <Defs>
        <LinearGradient id="plate" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1b1b1e" />
          <Stop offset="1" stopColor="#0f0f11" />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#plate)" />
    </Svg>
  );
}

/** Menu button, "LUDI LIVE" plate with room code, profile button. */
export function TopBar({ roomCode, onMenu, onProfile }: TopBarProps) {
  return (
    <View style={styles.bar}>
      <RoundButton icon="menu" size={layout.topButton} label="Leave game" onPress={onMenu} />
      <View style={styles.plateShadow}>
        <View style={styles.plate}>
          <PlateFace />
          <Text style={styles.brand}>
            LUDI <Text style={styles.brandLive}>LIVE</Text>
          </Text>
          {roomCode ? (
            <View style={styles.codeRow}>
              <Text style={styles.codeLabel}>Room</Text>
              <Text style={styles.code}>{roomCode}</Text>
              <View style={styles.live}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>
          ) : (
            <View style={styles.codeRow}>
              <Text style={styles.codeLabel}>Pass & Play</Text>
            </View>
          )}
        </View>
      </View>
      <RoundButton icon="user" size={layout.topButton} label="Profile" onPress={onProfile} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: layout.topBarHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  plateShadow: {
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 9,
    elevation: 8,
  },
  plate: {
    height: 54,
    minWidth: 170,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(254,209,0,0.35)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontFamily: font.display,
    fontSize: 17,
    lineHeight: 19,
    letterSpacing: 2,
    color: color.gold,
  },
  brandLive: {
    color: color.greenBright,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  codeLabel: {
    fontFamily: font.body,
    fontSize: 12,
    color: color.creamSoft,
  },
  code: {
    fontFamily: font.sticker,
    fontSize: 12.5,
    letterSpacing: 1.5,
    color: color.white,
  },
  live: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 5,
    paddingRight: 6,
    paddingVertical: 2,
    borderRadius: 9,
    backgroundColor: color.hot,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: color.white,
  },
  liveText: {
    fontFamily: font.sticker,
    fontSize: 8.5,
    letterSpacing: 0.5,
    color: color.white,
  },
});
