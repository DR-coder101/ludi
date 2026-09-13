import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import type { Color } from '@ludi/rules';
import { COLORS } from '../components/board/boardLayout';

interface WinBannerProps {
  winner: Color;
  placements: Color[];
  onNewGame: () => void;
}

const COLOR_NAMES: Record<Color, string> = {
  red: 'Red',
  green: 'Green',
  yellow: 'Yellow',
  blue: 'Blue',
};

export const WinBanner: React.FC<WinBannerProps> = ({
  winner,
  placements,
  onNewGame,
}) => {
  return (
    <View style={styles.overlay}>
      <View style={styles.banner}>
        <Text style={styles.title}>🎉 Game Over! 🎉</Text>
        
        <View style={styles.winnerSection}>
          <View
            style={[
              styles.winnerCircle,
              { backgroundColor: COLORS[winner] },
            ]}
          />
          <Text style={styles.winnerText}>
            {COLOR_NAMES[winner]} Wins!
          </Text>
        </View>

        {placements.length > 1 && (
          <View style={styles.placementsSection}>
            <Text style={styles.placementsTitle}>Final Placements:</Text>
            {placements.map((color, index) => (
              <View key={color} style={styles.placementRow}>
                <Text style={styles.placementRank}>{index + 1}.</Text>
                <View
                  style={[
                    styles.placementCircle,
                    { backgroundColor: COLORS[color] },
                  ]}
                />
                <Text style={styles.placementName}>{COLOR_NAMES[color]}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.button} onPress={onNewGame}>
          <Text style={styles.buttonText}>New Game</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  banner: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    maxWidth: 350,
    width: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    color: '#333',
  },
  winnerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  winnerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    borderWidth: 4,
    borderColor: '#FFD700',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  winnerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  placementsSection: {
    width: '100%',
    marginBottom: 24,
  },
  placementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#666',
  },
  placementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  placementRank: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    width: 24,
  },
  placementCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  placementName: {
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});
