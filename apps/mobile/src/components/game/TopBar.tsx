import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RoundButton } from './RoundButton';
import { elevation, fontFamily, palette, radius } from '../../theme/tokens';

interface TopBarProps {
  roomCode?: string;
  live: boolean;
  onMenu?: () => void;
  onProfile?: () => void;
}

export function TopBar({ roomCode, live, onMenu, onProfile }: TopBarProps) {
  return (
    <View style={styles.bar}>
      <RoundButton icon="menu" size={42} label="Menu, leave game" onPress={onMenu} />
      <View style={styles.plate} accessibilityRole="header">
        <Text style={styles.brand}>
          LUDI{live ? <Text style={styles.brandLive}> LIVE</Text> : null}
        </Text>
        <View style={styles.codeRow}>
          {roomCode ? (
            <>
              <Text style={styles.codeLabel}>Room</Text>
              <Text style={styles.code}>{roomCode}</Text>
            </>
          ) : (
            <Text style={styles.codeLabel}>Pass & Play</Text>
          )}
          {live ? (
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          ) : null}
        </View>
      </View>
      <RoundButton icon="user" size={42} label="Profile" onPress={onProfile} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 56,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  plate: {
    height: 54,
    minWidth: 170,
    paddingHorizontal: 16,
    borderRadius: radius.plate,
    backgroundColor: palette.ink,
    borderWidth: 1,
    borderColor: 'rgba(254,209,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.button,
  },
  brand: { fontFamily: fontFamily.display, fontSize: 17, letterSpacing: 2, color: palette.gold, lineHeight: 20 },
  brandLive: { color: palette.greenBright },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  codeLabel: { fontFamily: fontFamily.body, fontSize: 12, color: palette.textSoft },
  code: { fontFamily: fontFamily.badge, fontSize: 12.5, letterSpacing: 1.5, color: palette.white },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: palette.hot,
    paddingVertical: 2,
    paddingLeft: 5,
    paddingRight: 6,
    borderRadius: 9,
  },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: palette.white },
  liveText: { fontFamily: fontFamily.badge, fontSize: 8.5, letterSpacing: 0.5, color: palette.white },
});
