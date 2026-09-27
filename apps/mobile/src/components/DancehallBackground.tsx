/**
 * Dancehall Background Component
 * Provides texture and gradient backdrop for screens
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme/tokens';

interface DancehallBackgroundProps {
  children: React.ReactNode;
}

export const DancehallBackground: React.FC<DancehallBackgroundProps> = ({ children }) => {
  return (
    <View style={styles.container}>
      <View style={styles.gradient} />
      <View style={styles.grain} />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    // Radial gradient effect (simulated with opacity overlay)
    opacity: 0.1,
  },
  grain: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    opacity: 0.05,
    // Noise texture would be added here with an image overlay
  },
});
