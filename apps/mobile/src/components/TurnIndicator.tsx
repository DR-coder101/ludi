import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Color } from '@ludi/rules';
import { COLORS } from '../components/board/boardLayout';

interface TurnIndicatorProps {
  currentPlayer: Color;
  lastRoll: number | null;
  phase: 'awaiting_roll' | 'awaiting_move' | 'finished';
}

const COLOR_NAMES: Record<Color, string> = {
  red: 'Red',
  green: 'Green',
  yellow: 'Yellow',
  blue: 'Blue',
};

export const TurnIndicator: React.FC<TurnIndicatorProps> = ({
  currentPlayer,
  lastRoll,
  phase,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.playerSection}>
        <View
          style={[
            styles.playerCircle,
            { backgroundColor: COLORS[currentPlayer] },
          ]}
        />
        <Text style={styles.playerText}>{COLOR_NAMES[currentPlayer]}'s Turn</Text>
      </View>
      
      {lastRoll !== null && phase !== 'finished' && (
        <View style={styles.rollSection}>
          <Text style={styles.rollLabel}>Last Roll:</Text>
          <View style={styles.rollBadge}>
            <Text style={styles.rollText}>{lastRoll}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D4AF37',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  playerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playerCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#D4AF37',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  playerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  rollSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rollLabel: {
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: '500',
  },
  rollBadge: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 32,
    alignItems: 'center',
  },
  rollText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
});
