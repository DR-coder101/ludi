/**
 * Dancehall Premium Win Banner - APPROVED SPEC
 * 
 * Required elements:
 * - Green/gold sunburst rays behind the card (rotating 40s)
 * - WINNER kicker text
 * - Place name in huge Anton font
 * - Line like 'DEAN RUN DI BOARD!' built from winner's name
 * - Rotated hot-pink BIG UP! starburst sticker with hard black offset shadow
 * - Stats and final standings
 * - PLAY AGAIN / HOME buttons
 */

import React, { useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';
import Svg, { Defs, RadialGradient as SvgRadialGradient, Stop, Path, Polygon } from 'react-native-svg';
import type { Color } from '@ludi/rules';
import { PLACE_NAMES } from '../components/board/boardLayout';
import { colors, typography, spacing, radii } from '../theme/tokens';

interface WinBannerProps {
  winner: Color;
  placements: Color[];
  playerName?: string;
  onNewGame: () => void;
  onHome?: () => void;
}

export const WinBanner: React.FC<WinBannerProps> = ({
  winner,
  placements,
  playerName = 'CHAMPION',
  onNewGame,
  onHome,
}) => {
  const scaleAnim = new Animated.Value(1.15);
  const opacityAnim = new Animated.Value(0);
  const rotateAnim = new Animated.Value(0);

  useEffect(() => {
    // Win slam (280ms spring, scale 1.15 to 1)
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        damping: 12,
        stiffness: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Rays rotation (40s per turn)
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 40000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const placeName = PLACE_NAMES[winner];
  const winColor = winner === 'yellow' ? colors.gold :
                   winner === 'green' ? colors.greenBright :
                   winner === 'blue' ? colors.silver :
                   colors.redText;

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.overlay}>
      {/* Sunburst rays background (green/gold, rotating) */}
      <Animated.View style={[styles.raysContainer, { transform: [{ rotate: spin }] }]}>
        <Svg width={500} height={500} viewBox="0 0 500 500">
          <Defs>
            <SvgRadialGradient id="sunburst" cx="50%" cy="50%">
              <Stop offset="0%" stopColor={colors.green} stopOpacity="0.4" />
              <Stop offset="50%" stopColor={colors.gold} stopOpacity="0.3" />
              <Stop offset="100%" stopColor={colors.green} stopOpacity="0.4" />
            </SvgRadialGradient>
          </Defs>
          {/* 12 rays */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30) * Math.PI / 180;
            const x1 = 250 + 200 * Math.cos(angle);
            const y1 = 250 + 200 * Math.sin(angle);
            const angle2 = (i * 30 + 15) * Math.PI / 180;
            const x2 = 250 + 200 * Math.cos(angle2);
            const y2 = 250 + 200 * Math.sin(angle2);
            return (
              <Path
                key={i}
                d={`M250,250 L${x1},${y1} L${x2},${y2} Z`}
                fill="url(#sunburst)"
              />
            );
          })}
        </Svg>
      </Animated.View>
      
      {/* Flyer card */}
      <Animated.View
        style={[
          styles.flyerCard,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        {/* WINNER kicker */}
        <Text style={styles.kicker}>WINNER</Text>
        
        {/* Place name (huge Anton) */}
        <Text style={[styles.placeName, { color: winColor }]}>
          {placeName}
        </Text>
        
        {/* Player achievement line: 'DEAN RUN DI BOARD!' */}
        <Text style={styles.achievementLine}>
          {playerName.toUpperCase()} RUN DI BOARD!
        </Text>
        
        {/* BIG UP! starburst sticker (rotated 12deg, hot pink, hard black shadow) */}
        <View style={[styles.stickerShadow, { transform: [{ rotate: '12deg' }] }]}>
          <View style={styles.sticker}>
            <Svg width={120} height={120} viewBox="0 0 120 120">
              {/* Starburst shape (12 points) */}
              <Polygon
                points="60,10 65,45 100,45 72,65 85,100 60,80 35,100 48,65 20,45 55,45"
                fill={colors.hot}
                stroke="white"
                strokeWidth={3}
              />
            </Svg>
            <View style={styles.stickerTextContainer}>
              <Text style={styles.stickerText}>BIG</Text>
              <Text style={styles.stickerText}>UP!</Text>
            </View>
          </View>
        </View>
        
        {/* Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>STATS</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Position:</Text>
            <Text style={styles.statValue}>1st</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Players:</Text>
            <Text style={styles.statValue}>{placements.length}</Text>
          </View>
        </View>
        
        {/* Final standings */}
        <View style={styles.standingsSection}>
          <Text style={styles.sectionTitle}>FINAL STANDINGS</Text>
          {placements.map((color, i) => {
            const placeColor = color === 'yellow' ? colors.gold :
                              color === 'green' ? colors.greenBright :
                              color === 'blue' ? colors.silver :
                              colors.redText;
            return (
              <View key={i} style={styles.standingRow}>
                <Text style={styles.standingPosition}>#{i + 1}</Text>
                <View style={[styles.colorDot, { backgroundColor: placeColor }]} />
                <Text style={styles.standingPlace}>{PLACE_NAMES[color]}</Text>
              </View>
            );
          })}
        </View>
        
        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.primaryButton} onPress={onNewGame}>
            <Text style={styles.primaryButtonText}>PLAY AGAIN</Text>
          </TouchableOpacity>
          {onHome && (
            <TouchableOpacity style={styles.secondaryButton} onPress={onHome}>
              <Text style={styles.secondaryButtonText}>HOME</Text>
            </TouchableOpacity>
          )}
        </View>
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
    backgroundColor: 'rgba(11, 11, 12, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  raysContainer: {
    position: 'absolute',
    width: 500,
    height: 500,
  },
  flyerCard: {
    backgroundColor: colors.surface,
    borderRadius: radii['2xl'],
    padding: spacing.xl,
    maxWidth: 400,
    width: '90%',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.gold,
  },
  kicker: {
    fontSize: typography.sizes.bodyMedium,
    fontFamily: typography.fonts.sticker,
    color: colors.gold,
    letterSpacing: typography.letterSpacing.stickerWide,
    marginBottom: 8,
  },
  placeName: {
    fontSize: 52,
    fontFamily: typography.fonts.brand,
    textAlign: 'center',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  achievementLine: {
    fontSize: typography.sizes.bodyLarge,
    fontFamily: typography.fonts.bodySemiBold,
    color: colors.cream,
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 1,
  },
  stickerShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    marginBottom: 24,
  },
  sticker: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickerTextContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  stickerText: {
    fontSize: 24,
    fontFamily: typography.fonts.sticker,
    color: 'white',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  statsSection: {
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: typography.sizes.stickerSmall,
    fontFamily: typography.fonts.sticker,
    color: colors.gold,
    marginBottom: 8,
    letterSpacing: 2,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: typography.sizes.bodyMedium,
    fontFamily: typography.fonts.body,
    color: colors.textMuted,
  },
  statValue: {
    fontSize: typography.sizes.bodyMedium,
    fontFamily: typography.fonts.bodySemiBold,
    color: colors.cream,
  },
  standingsSection: {
    width: '100%',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  standingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  standingPosition: {
    fontSize: typography.sizes.bodyMedium,
    fontFamily: typography.fonts.bodySemiBold,
    color: colors.textMuted,
    width: 30,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  standingPlace: {
    fontSize: typography.sizes.bodyMedium,
    fontFamily: typography.fonts.body,
    color: colors.cream,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    paddingHorizontal: 16,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.gold,
    paddingVertical: 14,
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: typography.sizes.bodyMedium,
    fontFamily: typography.fonts.bodySemiBold,
    color: colors.bg,
    letterSpacing: 1,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingVertical: 14,
    borderRadius: radii.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surfaceLine,
  },
  secondaryButtonText: {
    fontSize: typography.sizes.bodyMedium,
    fontFamily: typography.fonts.bodySemiBold,
    color: colors.cream,
    letterSpacing: 1,
  },
});
