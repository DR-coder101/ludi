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
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  playerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  rollSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rollLabel: {
    fontSize: 14,
    color: '#666',
  },
  rollBadge: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 32,
    alignItems: 'center',
  },
  rollText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});
