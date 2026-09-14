import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import type { Player } from '@ludi/protocol';
import { VideoTile } from './VideoTile';
import { MicCamControls } from './MicCamControls';
import { useVideoStore } from '../../stores/videoStore';

export interface VideoGridProps {
  roomPlayers: Player[];
  myPlayerId: string;
}

const { width: screenWidth } = Dimensions.get('window');
const GRID_PADDING = 16;
const GRID_GAP = 8;
const COLLAPSED_HEIGHT = 60;

export function VideoGrid({ roomPlayers, myPlayerId }: VideoGridProps) {
  const isVideoCollapsed = useVideoStore((state) => state.isVideoCollapsed);
  const micEnabled = useVideoStore((state) => state.micEnabled);
  const cameraEnabled = useVideoStore((state) => state.cameraEnabled);
  const toggleVideoCollapsed = useVideoStore((state) => state.toggleVideoCollapsed);
  const toggleMic = useVideoStore((state) => state.toggleMic);
  const toggleCamera = useVideoStore((state) => state.toggleCamera);

  if (isVideoCollapsed) {
    return (
      <View style={styles.collapsedContainer}>
        <TouchableOpacity
          onPress={toggleVideoCollapsed}
          style={styles.collapsedButton}
          activeOpacity={0.7}
        >
          <Text style={styles.collapsedText}>
            📹 Video ({roomPlayers.length})
          </Text>
          <Text style={styles.expandIcon}>▼</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const tileWidth = (screenWidth - GRID_PADDING * 2 - GRID_GAP) / 2;
  const tileHeight = tileWidth * 0.75;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Video Chat</Text>
        <TouchableOpacity
          onPress={toggleVideoCollapsed}
          style={styles.collapseButton}
          activeOpacity={0.7}
        >
          <Text style={styles.collapseIcon}>▲</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {roomPlayers.slice(0, 4).map((player) => {
          return (
            <View
              key={player.id}
              style={[
                styles.placeholder,
                { 
                  width: tileWidth, 
                  height: tileHeight,
                  backgroundColor: player.color === 'red' ? '#E53935' :
                                 player.color === 'green' ? '#43A047' :
                                 player.color === 'yellow' ? '#FDD835' : '#1E88E5'
                }
              ]}
            >
              <Text style={styles.placeholderText}>
                {player.displayName.charAt(0).toUpperCase()}
              </Text>
              <View style={styles.nameContainer}>
                <Text style={styles.nameText} numberOfLines={1}>
                  {player.displayName}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <MicCamControls
        micEnabled={micEnabled}
        cameraEnabled={cameraEnabled}
        onToggleMic={toggleMic}
        onToggleCamera={toggleCamera}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: GRID_PADDING,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '700',
  },
  collapseButton: {
    padding: 4,
  },
  collapseIcon: {
    fontSize: 16,
    color: '#D4AF37',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    marginBottom: 12,
  },
  placeholder: {
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#444',
    position: 'relative',
  },
  placeholderText: {
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
  collapsedContainer: {
    marginBottom: 12,
  },
  collapsedButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  collapsedText: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: '600',
  },
  expandIcon: {
    fontSize: 14,
    color: '#D4AF37',
  },
});

