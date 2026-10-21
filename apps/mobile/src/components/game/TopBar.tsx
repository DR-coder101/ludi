import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { boardFont, color, layout } from '../../theme/tokens';
import { Button3D } from '../ui/Button3D';
import { Icon } from './Icon';
import { RoundButton } from './RoundButton';

interface TopBarProps {
  roomCode: string | null;
  live?: boolean;
  onLeave?: () => void;
  onProfile?: () => void;
}

export function TopBar({ roomCode, live = false, onLeave, onProfile }: TopBarProps) {
  return (
    <View style={styles.bar}>
      <Button3D tone="red" compact label="Leave game" onPress={onLeave} style={styles.leave}>
        <Icon name="leave" size={16} color="#FECACA" strokeWidth={2.5} />
        <Text style={styles.leaveText}>LEAVE</Text>
      </Button3D>
      <View style={styles.plate}>
        <Text style={styles.brand}>
          LUDI{live ? <Text style={styles.brandLive}> LIVE</Text> : null}
        </Text>
        <View style={styles.codeRow}>
          {roomCode ? (
            <>
              <Text style={styles.codeLabel}>Room</Text>
              <Text style={styles.code}>{roomCode}</Text>
              {live ? (
                <View style={styles.live}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              ) : null}
            </>
          ) : (
            <Text style={styles.codeLabel}>Pass & Play</Text>
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
    gap: 8,
  },
  leave: {
    minWidth: 88,
  },
  leaveText: {
    fontFamily: boardFont.display,
    fontSize: 16,
    letterSpacing: 1,
    color: '#FECACA',
  },
  plate: {
    flexGrow: 1,
    minWidth: 0,
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#283833',
    backgroundColor: '#151E1B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontFamily: boardFont.display,
    fontSize: 18,
    lineHeight: 20,
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
    marginTop: 2,
  },
  codeLabel: {
    fontFamily: boardFont.bodyBold,
    fontSize: 10,
    color: color.creamSoft,
    textTransform: 'uppercase',
  },
  code: {
    fontFamily: boardFont.bodyBlack,
    fontSize: 11,
    letterSpacing: 1.4,
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
    backgroundColor: color.red,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: color.white,
  },
  liveText: {
    fontFamily: boardFont.bodyBlack,
    fontSize: 8,
    letterSpacing: 0.4,
    color: color.white,
  },
});
