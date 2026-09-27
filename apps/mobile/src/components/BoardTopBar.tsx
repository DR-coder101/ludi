/**
 * Board Screen Top Bar - APPROVED SPEC
 * 
 * Contains: back button, room code, hot pink LIVE badge, settings button
 * Top bar buttons are 42pt circles
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, sizes, radii } from '../theme/tokens';

interface BoardTopBarProps {
  roomCode?: string;
  isLive?: boolean;
  onBack: () => void;
  onSettings: () => void;
}

export const BoardTopBar: React.FC<BoardTopBarProps> = ({
  roomCode,
  isLive = true,
  onBack,
  onSettings,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={onBack}>
        <Text style={styles.buttonText}>←</Text>
      </TouchableOpacity>
      
      {roomCode && (
        <View style={styles.roomCodeContainer}>
          <Text style={styles.roomCode}>{roomCode}</Text>
          {isLive && (
            <View style={styles.liveBadge}>
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
        </View>
      )}
      
      <TouchableOpacity style={styles.button} onPress={onSettings}>
        <Text style={styles.buttonText}>⚙</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
  },
  button: {
    width: sizes.topBarButton,
    height: sizes.topBarButton,
    borderRadius: radii.topBarButton,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 20,
    color: colors.cream,
  },
  roomCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roomCode: {
    fontSize: typography.sizes.bodyLarge,
    fontFamily: typography.fonts.bodySemiBold,
    color: colors.cream,
    letterSpacing: 2,
  },
  liveBadge: {
    backgroundColor: colors.hot,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  liveText: {
    fontSize: typography.sizes.stickerSmall,
    fontFamily: typography.fonts.sticker,
    color: 'white',
    letterSpacing: typography.letterSpacing.stickerWide,
  },
});
