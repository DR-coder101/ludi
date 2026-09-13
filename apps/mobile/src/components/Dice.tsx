import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { gameAudio, triggerHaptic } from '../utils/gameAudio';

interface DiceProps {
  value: number | null;
  onRoll: () => void;
  disabled?: boolean;
}

export const Dice: React.FC<DiceProps> = ({ value, onRoll, disabled }) => {
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);
  const rotateZ = useSharedValue(0);
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (value !== null) {
      rotateX.value = withSequence(
        withRepeat(
          withTiming(360, { duration: 100, easing: Easing.linear }),
          3,
          false
        ),
        withTiming(0, { duration: 0 })
      );
      rotateY.value = withSequence(
        withRepeat(
          withTiming(360, { duration: 120, easing: Easing.linear }),
          3,
          false
        ),
        withTiming(0, { duration: 0 })
      );
      rotateZ.value = withSequence(
        withRepeat(
          withTiming(360, { duration: 80, easing: Easing.linear }),
          4,
          false
        ),
        withTiming(0, { duration: 0 })
      );
      
      scale.value = withSequence(
        withTiming(1.3, { duration: 150 }),
        withSpring(1, { damping: 8, stiffness: 120 })
      );

      translateX.value = withSequence(
        withTiming(5, { duration: 50 }),
        withTiming(-5, { duration: 50 }),
        withTiming(4, { duration: 50 }),
        withTiming(-3, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );

      translateY.value = withSequence(
        withTiming(-8, { duration: 100 }),
        withTiming(3, { duration: 100 }),
        withTiming(-2, { duration: 80 }),
        withTiming(0, { duration: 70 })
      );

      gameAudio.play('roll');
      triggerHaptic.medium();
    }
  }, [value]);

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

  const handlePress = () => {
    if (!disabled) {
      rotateZ.value = withTiming(360, { duration: 300, easing: Easing.out(Easing.cubic) });
      scale.value = withSequence(
        withTiming(0.9, { duration: 100 }),
        withSpring(1, { damping: 10 })
      );
      triggerHaptic.light();
      onRoll();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.dice,
          animatedStyle,
          disabled && styles.diceDisabled,
        ]}
      >
        <Text style={styles.diceText}>{value ?? '?'}</Text>
      </Animated.View>
      {!disabled && (
        <Text style={styles.tapText}>Tap to Roll</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  dice: {
    width: 70,
    height: 70,
    backgroundColor: '#fff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 3,
    borderColor: '#D4AF37',
  },
  diceDisabled: {
    opacity: 0.5,
  },
  diceText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  tapText: {
    marginTop: 8,
    fontSize: 12,
    color: '#D4AF37',
    fontWeight: '600',
  },
});
