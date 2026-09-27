/**
 * Dancehall Premium Win Banner - Flyer Card Style
 */

import React, { useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';
import type { Color } from '@ludi/rules';
import { PLACE_NAMES, COLORS } from '../components/board/boardLayout';
import { colors, typography, spacing, radii, shadows } from '../theme/tokens';
import type { EngineColor } from '../theme/tokens';

interface WinBannerProps {
  winner: Color;
  placements: Color[];
  onNewGame: () => void;
}

const PLACE_DISPLAY: Record<Color, { name: string; shortName: string }> = {
  yellow: { name: PLACE_NAMES.yellow, shortName: 'MOBAY' },
  green: { name: PLACE_NAMES.green, shortName: 'OCHI' },
  blue: { name: PLACE_NAMES.blue, shortName: 'NEGRIL' },
  red: { name: PLACE_NAMES.red, shortName: 'KINGSTON' },
};

export const WinBanner: React.FC<WinBannerProps> = ({
  winner,
  placements,
  onNewGame,
}) => {
  const scaleAnim = new Animated.Value(0.8);
  const opacityAnim = new Animated.Value(0);

  useEffect(() => {
    // Win celebration animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.overlay}>
      <Animated.View
        style={[
          styles.flyerCard,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        {/* Flyer header */}
        <View style={styles.flyerHeader}>
          <Text style={styles.flyerTopText}>🎉 CHAMPION 🎉</Text>
          <Text style={styles.flyerMainTitle}>
            {PLACE_DISPLAY[winner].name}
          </Text>
          <Text style={styles.flyerSubtitle}>TAKES THE CROWN!</Text>
        </View>

        {/* Winner visual */}
        <View style={styles.winnerVisual}>
          <View style={styles.winnerCircleOuter}>
            <View
              style={[
                styles.winnerCircle,
                { backgroundColor: COLORS[winner] },
                winner === 'blue' && styles.winnerCircleNegril,
              ]}
            />
          </View>
          <Text style={styles.winnerLabel}>
            #{placements.indexOf(winner) + 1} WINNER
          </Text>
        </View>

        {/* Placements podium */}
        {placements.length > 1 && (
          <View style={styles.podiumSection}>
            <Text style={styles.podiumTitle}>FINAL STANDINGS</Text>
            <View style={styles.podium}>
              {placements.slice(0, 3).map((color, index) => (
                <View key={color} style={styles.podiumPlace}>
                  <View
                    style={[
                      styles.podiumCircle,
                      { backgroundColor: COLORS[color] },
                      color === 'blue' && styles.podiumCircleNegril,
                    ]}
                  />
                  <View style={[
                    styles.podiumRank,
                    index === 0 && styles.podiumRankFirst,
                    index === 1 && styles.podiumRankSecond,
                    index === 2 && styles.podiumRankThird,
                  ]}>
                    <Text style={styles.podiumRankText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.podiumName}>
                    {PLACE_DISPLAY[color].shortName}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.newGameButton}
            onPress={onNewGame}
            activeOpacity={0.8}
          >
            <Text style={styles.newGameButtonText}>PLAY AGAIN</Text>
          </TouchableOpacity>
        </View>

        {/* Decorative border pattern */}
        <View style={styles.decorativeBorder} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  flyerCard: {
    backgroundColor: colors.surface,
    borderRadius: radii['2xl'],
    padding: spacing.xl,
    maxWidth: 400,
    width: '90%',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.accent,
    ...shadows.gold,
    position: 'relative',
    overflow: 'hidden',
  },
  decorativeBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: colors.accent,
  },
  flyerHeader: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  flyerTopText: {
    fontSize: typography.sizes.bodyMedium,
    fontFamily: typography.fonts.bodyBold,
    color: colors.accent,
    marginBottom: spacing.sm,
    letterSpacing: typography.letterSpacing.widest,
  },
  flyerMainTitle: {
    fontSize: typography.sizes.displayMedium,
    fontFamily: typography.fonts.display,
    color: colors.accent,
    textAlign: 'center',
    marginBottom: spacing.xs,
    letterSpacing: typography.letterSpacing.wider,
    textShadowColor: colors.shadowGold,
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  flyerSubtitle: {
    fontSize: typography.sizes.bodyLarge,
    fontFamily: typography.fonts.heading,
    color: colors.textSecondary,
    letterSpacing: typography.letterSpacing.wider,
  },
  winnerVisual: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  winnerCircleOuter: {
    padding: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 3,
    borderColor: colors.accent,
    marginBottom: spacing.md,
    ...shadows.gold,
  },
  winnerCircle: {
    width: 100,
    height: 100,
    borderRadius: radii.full,
    borderWidth: 4,
    borderColor: colors.accent,
  },
  winnerCircleNegril: {
    borderColor: colors.negrilSilver,
  },
  winnerLabel: {
    fontSize: typography.sizes.bodyMedium,
    fontFamily: typography.fonts.heading,
    color: colors.accent,
    letterSpacing: typography.letterSpacing.wider,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  podiumSection: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  podiumTitle: {
    fontSize: typography.sizes.bodyLarge,
    fontFamily: typography.fonts.heading,
    color: colors.accent,
    marginBottom: spacing.md,
    textAlign: 'center',
    letterSpacing: typography.letterSpacing.wider,
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  podiumPlace: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  podiumCircle: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    borderWidth: 3,
    borderColor: colors.accent,
    ...shadows.md,
  },
  podiumCircleNegril: {
    borderColor: colors.negrilSilver,
  },
  podiumRank: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.textTertiary,
  },
  podiumRankFirst: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
    width: 40,
    height: 40,
  },
  podiumRankSecond: {
    backgroundColor: colors.negrilSilver,
    borderColor: colors.negrilSilver,
  },
  podiumRankThird: {
    backgroundColor: colors.kingstonRed,
    borderColor: colors.kingstonRed,
  },
  podiumRankText: {
    fontSize: typography.sizes.bodyMedium,
    fontFamily: typography.fonts.bodyBold,
    color: colors.textOnAccent,
  },
  podiumName: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fonts.bodySemiBold,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  actionsContainer: {
    width: '100%',
    gap: spacing.md,
  },
  newGameButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.lg,
    borderRadius: radii.xl,
    alignItems: 'center',
    ...shadows.gold,
  },
  newGameButtonText: {
    fontSize: typography.sizes.headingSmall,
    fontFamily: typography.fonts.heading,
    color: colors.textOnAccent,
    letterSpacing: typography.letterSpacing.widest,
  },
});
