/**
 * Turn Card - APPROVED SPEC
 * 
 * Shows current player, timer ring (gold turning hot pink under 5s), and two dice
 * Centered between icon rails
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, radii, PLACE_NAMES } from '../theme/tokens';
import type { EngineColor } from '../theme/tokens';
import { DicePair } from './DicePair';

interface TurnCardProps {
  currentPlayer: EngineColor;
  dice: [number, number] | null;
  timeRemaining?: number; // seconds
  onRoll?: () => void;
}

export const TurnCard: React.FC<TurnCardProps> = ({
  currentPlayer,
  dice,
  timeRemaining,
  onRoll,
}) => {
  const placeName = PLACE_NAMES[currentPlayer];
  const timerColor = timeRemaining && timeRemaining < 5 ? colors.hot : colors.gold;
  
  return (
    <View style={styles.container}>
      <View style={[styles.timerRing, { borderColor: timerColor }]}>
        <View style={styles.content}>
          <Text style={styles.placeName}>{placeName}</Text>
          {dice ? (
            <DicePair dice={dice} />
          ) : (
            <View style={styles.diceContainer}>
              <Text style={styles.rollPrompt}>TAP TO ROLL</Text>
            </View>
          )}
          {timeRemaining !== undefined && (
            <Text style={[styles.timer, { color: timerColor }]}>
              {timeRemaining}s
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  timerRing: {
    borderWidth: 4,
    borderRadius: radii.full,
    padding: 16,
  },
  content: {
    alignItems: 'center',
    gap: 8,
  },
  placeName: {
    fontSize: typography.sizes.bodyMedium,
    fontFamily: typography.fonts.sticker,
    color: colors.cream,
    letterSpacing: typography.letterSpacing.stickerWide,
    textTransform: 'uppercase',
  },
  diceContainer: {
    paddingVertical: 20,
  },
  rollPrompt: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fonts.bodySemiBold,
    color: colors.textMuted,
    letterSpacing: 2,
  },
  timer: {
    fontSize: typography.sizes.bodyLarge,
    fontFamily: typography.fonts.bodyBold,
    letterSpacing: 1,
  },
});
