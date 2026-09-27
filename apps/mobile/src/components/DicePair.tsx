/**
 * Two-Dice Display Component for Dancehall Premium UI
 * 
 * IMPORTANT: The game engine (packages/rules) currently uses ONE die.
 * This component is built to display TWO dice and is ready for when
 * the engine is updated to support two-dice gameplay.
 * 
 * Current state: Displays the single die value on BOTH dice
 * Future state: Will display two separate dice values when engine supports it
 */

import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  Easing,
  withDelay,
} from 'react-native-reanimated';
import { colors, typography, spacing, radii, shadows } from '../theme/tokens';
import { triggerHaptic } from '../utils/haptics';

interface DicePairProps {
  value: number | null; // Single die value from current engine
  onRoll: () => void;
  disabled?: boolean;
}

/**
 * Individual die component with animation
 */
const AnimatedDie: React.FC<{
  value: number | null;
  delay: number;
}> = ({ value, delay }) => {
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);
  const rotateZ = useSharedValue(0);
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (value !== null) {
      // Staggered animation for each die
      rotateX.value = withDelay(
        delay,
        withSequence(
          withRepeat(
            withTiming(360, { duration: 100, easing: Easing.linear }),
            3,
            false
          ),
          withTiming(0, { duration: 0 })
        )
      );

      rotateY.value = withDelay(
        delay,
        withSequence(
          withRepeat(
            withTiming(360, { duration: 120, easing: Easing.linear }),
            3,
            false
          ),
          withTiming(0, { duration: 0 })
        )
      );

      rotateZ.value = withDelay(
        delay,
        withSequence(
          withRepeat(
            withTiming(360, { duration: 80, easing: Easing.linear }),
            4,
            false
          ),
          withTiming(0, { duration: 0 })
        )
      );

      scale.value = withDelay(
        delay,
        withSequence(
          withTiming(1.3, { duration: 150 }),
          withSpring(1, { damping: 8, stiffness: 120 })
        )
      );

      translateX.value = withDelay(
        delay,
        withSequence(
          withTiming(5, { duration: 50 }),
          withTiming(-5, { duration: 50 }),
          withTiming(4, { duration: 50 }),
          withTiming(-3, { duration: 50 }),
          withTiming(0, { duration: 50 })
        )
      );

      translateY.value = withDelay(
        delay,
        withSequence(
          withTiming(-8, { duration: 100 }),
          withTiming(3, { duration: 100 }),
          withTiming(-2, { duration: 80 }),
          withTiming(0, { duration: 70 })
        )
      );
    }
  }, [value, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateX: `${rotateX.value}deg` },
      { rotateY: `${rotateY.value}deg` },
      { rotateZ: `${rotateZ.value}deg` },
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <Animated.View style={[styles.die, animatedStyle]}>
      <Text style={styles.dieText}>{value ?? '?'}</Text>
    </Animated.View>
  );
};

/**
 * Pair of dice display
 * 
 * NOTE: Currently shows the same value on both dice since engine only provides one.
 * When the engine is updated to support two dice:
 * 1. Update GameState type to have `dice: [number, number] | null`
 * 2. Update this component to accept `value: [number, number] | null`
 * 3. Display dice[0] on left die, dice[1] on right die
 * 4. Update total calculation to sum both dice
 */
export const DicePair: React.FC<DicePairProps> = ({ value, onRoll, disabled }) => {
  const handlePress = async () => {
    if (!disabled) {
      await triggerHaptic('roll');
      onRoll();
    }
  };

  // TODO: When engine supports two dice, this will be the sum of both
  const total = value !== null ? value : null;

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
      style={styles.container}
    >
      <View style={styles.diceContainer}>
        {/* Left die - currently shows same value as right */}
        <AnimatedDie value={value} delay={0} />
        
        {/* Right die - staggered animation */}
        <AnimatedDie value={value} delay={50} />
      </View>

      {/* Total display */}
      {total !== null && (
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalValue}>{total}</Text>
        </View>
      )}

      {/* Instruction text */}
      {!disabled && total === null && (
        <Text style={styles.tapText}>TAP TO ROLL</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.md,
  },
  diceContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  die: {
    width: 60,
    height: 60,
    backgroundColor: colors.textPrimary,
    borderRadius: radii.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.accent,
    ...shadows.gold,
  },
  dieText: {
    fontSize: 32,
    fontFamily: typography.fonts.bodyBold,
    color: colors.textOnAccent,
  },
  totalContainer: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    alignItems: 'center',
    minWidth: 80,
    ...shadows.gold,
  },
  totalLabel: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fonts.bodyBold,
    color: colors.textOnAccent,
    letterSpacing: typography.letterSpacing.wider,
  },
  totalValue: {
    fontSize: typography.sizes.headingLarge,
    fontFamily: typography.fonts.heading,
    color: colors.textOnAccent,
    letterSpacing: typography.letterSpacing.wide,
  },
  tapText: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fonts.bodySemiBold,
    color: colors.accent,
    letterSpacing: typography.letterSpacing.wider,
  },
});
