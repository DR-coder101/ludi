import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface DiceProps {
  value: number | null;
  onRoll: () => void;
  disabled?: boolean;
}

export const Dice: React.FC<DiceProps> = ({ value, onRoll, disabled }) => {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (value !== null) {
      rotation.value = withSequence(
        withTiming(360, { duration: 300, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 0 })
      );
      scale.value = withSequence(
        withTiming(1.2, { duration: 150 }),
        withSpring(1, { damping: 10, stiffness: 100 })
      );
    }
  }, [value]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
  }));

  const handlePress = () => {
    if (!disabled) {
      rotation.value = withSequence(
        withTiming(720, { duration: 400, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 0 })
      );
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#333',
  },
  diceDisabled: {
    opacity: 0.5,
  },
  diceText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
  },
  tapText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});
