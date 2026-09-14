import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

export interface MicCamControlsProps {
  micEnabled: boolean;
  cameraEnabled: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
}

export function MicCamControls({
  micEnabled,
  cameraEnabled,
  onToggleMic,
  onToggleCamera,
}: MicCamControlsProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, !micEnabled && styles.buttonDisabled]}
        onPress={onToggleMic}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>
          {micEnabled ? '🎤' : '🔇'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, !cameraEnabled && styles.buttonDisabled]}
        onPress={onToggleCamera}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>
          {cameraEnabled ? '📹' : '📷'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#666',
  },
  buttonText: {
    fontSize: 24,
  },
});
