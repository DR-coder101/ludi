import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { VideoTrack, TrackReferenceOrPlaceholder } from '@livekit/react-native';
import type { Color } from '@ludi/protocol';

export interface VideoTileProps {
  track: TrackReferenceOrPlaceholder;
  playerColor: Color;
  displayName: string;
  isSpeaking?: boolean;
  style?: ViewStyle;
}

const COLOR_MAP: Record<Color, string> = {
  red: '#E53935',
  green: '#43A047',
  yellow: '#FDD835',
  blue: '#1E88E5',
};

export function VideoTile({ 
  track, 
  playerColor, 
  displayName, 
  isSpeaking = false,
  style 
}: VideoTileProps) {
  const borderColor = COLOR_MAP[playerColor];
  const isVideoEnabled = track.publication?.isEnabled ?? false;

  return (
    <View style={[styles.container, style, isSpeaking && { borderColor, borderWidth: 3 }]}>
      {isVideoEnabled && track.publication ? (
        <VideoTrack 
          trackRef={track}
          style={styles.video}
        />
      ) : (
        <View style={[styles.avatarFallback, { backgroundColor: borderColor }]}>
          <Text style={styles.avatarText}>
            {displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      
      <View style={styles.nameContainer}>
        <Text style={styles.nameText} numberOfLines={1}>
          {displayName}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#2a2a2a',
    borderWidth: 2,
    borderColor: '#444',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  nameContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  nameText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
