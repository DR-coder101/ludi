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
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  banner: {
    backgroundColor: '#2a2a2a',
    borderRadius: 24,
    padding: 32,
    maxWidth: 350,
    width: '90%',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#D4AF37',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    color: '#D4AF37',
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
    borderColor: '#D4AF37',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 10,
  },
  winnerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  placementsSection: {
    width: '100%',
    marginBottom: 24,
  },
  placementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#D4AF37',
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
    color: '#D4AF37',
    width: 24,
  },
  placementCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D4AF37',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  placementName: {
    fontSize: 16,
    color: '#fff',
  },
  button: {
    backgroundColor: '#D4AF37',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
});
