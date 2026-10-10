import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { color, font } from '../../theme/tokens';
import { MicCamControls } from './MicCamControls';

export type CallBarProps = {
  liveCount: number;
  micOn: boolean;
  cameraOn: boolean;
  onMic: () => void;
  onCamera: () => void;
  onFlip: () => void;
  onLeave: () => void;
};

export function CallBar({
  liveCount,
  micOn,
  cameraOn,
  onMic,
  onCamera,
  onFlip,
  onLeave,
}: CallBarProps) {
  return (
    <View style={styles.bar} accessibilityLabel={`Video call, ${liveCount} of 4 live`}>
      <View style={styles.header}>
        <View style={styles.dot} />
        <Text style={styles.kicker}>{`VIDEO CALL · ${liveCount}/4 LIVE`}</Text>
      </View>
      <MicCamControls
        micEnabled={micOn}
        cameraEnabled={cameraOn}
        onToggleMic={onMic}
        onToggleCamera={onCamera}
        onFlip={onFlip}
        onLeave={onLeave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: 'center',
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: color.hot,
  },
  kicker: {
    fontFamily: font.sticker,
    fontSize: 9,
    letterSpacing: 0.8,
    color: color.cream,
  },
});
