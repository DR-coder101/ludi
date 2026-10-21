import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { boardFont, color } from '../../theme/tokens';
import { RoundButton } from './RoundButton';
import type { DockKey } from './boardChrome';

export function ActionDock({
  keys,
  voiceOn,
  cameraOn,
  unread,
  onVoice,
  onCamera,
  onChat,
}: {
  keys: readonly DockKey[];
  voiceOn: boolean;
  cameraOn: boolean;
  unread: number;
  onVoice?: () => void;
  onCamera?: () => void;
  onChat?: () => void;
}) {
  if (keys.length === 0) return null;
  return (
    <View style={styles.row}>
      {keys.map((key) => {
        switch (key) {
          case 'voice':
            return (
              <View key={key} style={styles.item}>
                <RoundButton
                  icon="mic"
                  size={44}
                  tone={voiceOn ? 'voice' : 'dark'}
                  label={voiceOn ? 'Mute microphone' : 'Unmute microphone'}
                  onPress={onVoice}
                />
                <Text style={[styles.caption, voiceOn ? styles.on : null]}>{voiceOn ? 'Voice ON' : 'Voice OFF'}</Text>
              </View>
            );
          case 'camera':
            return (
              <View key={key} style={styles.item}>
                <RoundButton
                  icon="video"
                  size={44}
                  tone={cameraOn ? 'voice' : 'dark'}
                  label={cameraOn ? 'Turn camera off' : 'Turn camera on'}
                  onPress={onCamera}
                />
                <Text style={[styles.caption, cameraOn ? styles.on : null]}>
                  {cameraOn ? 'Camera ON' : 'Camera OFF'}
                </Text>
              </View>
            );
          case 'chat':
            return (
              <View key={key} style={styles.item}>
                <RoundButton icon="chat" size={44} badge={unread || undefined} label="Open Chat" onPress={onChat} />
                <Text style={styles.caption}>Chat</Text>
              </View>
            );
          default: {
            const _never: never = key;
            return _never;
          }
        }
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    paddingHorizontal: 4,
  },
  item: {
    alignItems: 'center',
    gap: 4,
    minWidth: 64,
  },
  caption: {
    fontFamily: boardFont.bodyBold,
    fontSize: 9,
    color: color.creamMuted,
  },
  on: {
    color: color.greenBright,
  },
});
