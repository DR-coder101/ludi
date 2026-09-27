/**
 * Board Icon Rails - APPROVED SPEC
 * 
 * Left side: menu, players, mic, chat, emoji (48pt circles)
 * Right side: speaker, settings, profile (48pt circles)
 * Flank the turn card in the center
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { colors, sizes, radii } from '../theme/tokens';

interface IconRailsProps {
  onMenu?: () => void;
  onPlayers?: () => void;
  onMic?: () => void;
  onChat?: () => void;
  onEmoji?: () => void;
  onSpeaker?: () => void;
  onSettings?: () => void;
  onProfile?: () => void;
}

export const IconRails: React.FC<IconRailsProps> = ({
  onMenu,
  onPlayers,
  onMic,
  onChat,
  onEmoji,
  onSpeaker,
  onSettings,
  onProfile,
}) => {
  return (
    <View style={styles.container}>
      {/* Left rail */}
      <View style={styles.rail}>
        <IconButton icon="☰" onPress={onMenu} />
        <IconButton icon="👥" onPress={onPlayers} />
        <IconButton icon="🎤" onPress={onMic} />
        <IconButton icon="💬" onPress={onChat} />
        <IconButton icon="😊" onPress={onEmoji} />
      </View>
      
      {/* Right rail */}
      <View style={styles.rail}>
        <IconButton icon="🔊" onPress={onSpeaker} />
        <IconButton icon="⚙" onPress={onSettings} />
        <IconButton icon="👤" onPress={onProfile} />
      </View>
    </View>
  );
};

const IconButton: React.FC<{ icon: string; onPress?: () => void }> = ({ icon, onPress }) => (
  <TouchableOpacity style={styles.iconButton} onPress={onPress}>
    <Text style={styles.iconText}>{icon}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 12,
  },
  rail: {
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    width: sizes.railButton,
    height: sizes.railButton,
    borderRadius: radii.railButton,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
  },
});
