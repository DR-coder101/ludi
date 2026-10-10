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
  /** Fit header + four labelled buttons inside the game-screen call card. */
  compact?: boolean;
}

export function MicCamControls({
  micEnabled,
  cameraEnabled,
  onToggleMic,
  onToggleCamera,
  onFlip,
  onLeave,
  compact = false,
}: MicCamControlsProps) {
  const size = compact ? 36 : 40;
  return (
    <View style={[styles.row, compact ? styles.rowCompact : null]}>
      <View style={compact ? styles.itemCompact : styles.item}>
        <RoundButton
          icon="mic"
          size={size}
          tone={micEnabled ? 'voice' : 'dark'}
          label={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
          onPress={onToggleMic}
        />
        <Text style={styles.caption} numberOfLines={1}>
          {micEnabled ? 'Mic On' : 'Mic Off'}
        </Text>
      </View>
      <View style={compact ? styles.itemCompact : styles.item}>
        <RoundButton
          icon="video"
          size={size}
          tone={cameraEnabled ? 'voice' : 'dark'}
          label={cameraEnabled ? 'Turn camera off' : 'Turn camera on'}
          onPress={onToggleCamera}
        />
        <Text style={styles.caption} numberOfLines={1}>
          Camera
        </Text>
      </View>
      {onFlip ? (
        <View style={compact ? styles.itemCompact : styles.item}>
          <RoundButton icon="flip" size={size} tone="gold" label="Flip camera" onPress={onFlip} />
          <Text style={styles.caption} numberOfLines={1}>
            Flip
          </Text>
        </View>
      ) : null}
      {onLeave ? (
        <View style={compact ? styles.itemCompact : styles.item}>
          <RoundButton icon="leave" size={size} tone="leave" label="Leave video call" onPress={onLeave} />
          <Text style={styles.caption} numberOfLines={1}>
            Leave
          </Text>
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
  rowCompact: {
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    gap: 0,
  },
  item: {
    width: 52,
    alignItems: 'center',
    gap: 3,
  },
  itemCompact: {
    flex: 1,
    minWidth: 0,
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
