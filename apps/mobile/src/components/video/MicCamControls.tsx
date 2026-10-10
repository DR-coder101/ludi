import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { color, font } from '../../theme/tokens';
import { RoundButton } from '../game/RoundButton';

export interface MicCamControlsProps {
  micEnabled: boolean;
  cameraEnabled: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onFlip?: () => void;
  onLeave?: () => void;
}

export function MicCamControls({
  micEnabled,
  cameraEnabled,
  onToggleMic,
  onToggleCamera,
  onFlip,
  onLeave,
}: MicCamControlsProps) {
  return (
    <View style={styles.row}>
      <View style={styles.item}>
        <RoundButton
          icon="mic"
          size={40}
          tone={micEnabled ? 'voice' : 'dark'}
          label={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
          onPress={onToggleMic}
        />
        <Text style={styles.caption}>{micEnabled ? 'Mic On' : 'Mic Off'}</Text>
      </View>
      <View style={styles.item}>
        <RoundButton
          icon="video"
          size={40}
          tone={cameraEnabled ? 'voice' : 'dark'}
          label={cameraEnabled ? 'Turn camera off' : 'Turn camera on'}
          onPress={onToggleCamera}
        />
        <Text style={styles.caption}>Camera</Text>
      </View>
      {onFlip ? (
        <View style={styles.item}>
          <RoundButton icon="flip" size={40} tone="gold" label="Flip camera" onPress={onFlip} />
          <Text style={styles.caption}>Flip</Text>
        </View>
      ) : null}
      {onLeave ? (
        <View style={styles.item}>
          <RoundButton icon="leave" size={40} tone="leave" label="Leave video call" onPress={onLeave} />
          <Text style={styles.caption}>Leave</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 10,
  },
  item: {
    width: 52,
    alignItems: 'center',
    gap: 3,
  },
  caption: {
    fontFamily: font.bodySemi,
    fontSize: 8,
    color: color.creamMuted,
    textAlign: 'center',
  },
});
