/**
 * Player Strip - APPROVED SPEC
 * 
 * Shows players using place names (MOBAY / OCHI / NEGRIL / KINGSTON)
 * with their piece colors
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, PLACE_NAMES } from '../theme/tokens';
import type { EngineColor } from '../theme/tokens';

interface PlayerStripProps {
  players: Array<{
    engineColor: EngineColor;
    name: string;
    isCurrentTurn?: boolean;
  }>;
}

export const PlayerStrip: React.FC<PlayerStripProps> = ({ players }) => {
  const getShortName = (color: EngineColor): string => {
    const names: Record<EngineColor, string> = {
      yellow: 'MOBAY',
      green: 'OCHI',
      blue: 'NEGRIL',
      red: 'KINGSTON',
    };
    return names[color];
  };
  
  const getColor = (color: EngineColor): string => {
    const colorMap: Record<EngineColor, string> = {
      yellow: colors.gold,
      green: colors.greenBright,
      blue: colors.silver,
      red: colors.redText,
    };
    return colorMap[color];
  };
  
  return (
    <View style={styles.container}>
      {players.map((player, i) => (
        <View
          key={i}
          style={[
            styles.playerCard,
            player.isCurrentTurn && styles.currentTurn,
            { borderColor: getColor(player.engineColor) },
          ]}
        >
          <View style={[styles.colorDot, { backgroundColor: getColor(player.engineColor) }]} />
          <View>
            <Text style={styles.placeName}>{getShortName(player.engineColor)}</Text>
            <Text style={styles.playerName}>{player.name}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  currentTurn: {
    borderWidth: 3,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  placeName: {
    fontSize: typography.sizes.stickerSmall,
    fontFamily: typography.fonts.sticker,
    color: colors.cream,
    letterSpacing: 1,
  },
  playerName: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fonts.body,
    color: colors.textMuted,
  },
});
