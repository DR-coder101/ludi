/**
 * Dev-only preview route for screenshot capture
 * Renders board and win screens with mock state
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { BoardSVGFull } from '../../src/components/board/BoardSVGFull';
import { BoardTopBar } from '../../src/components/BoardTopBar';
import { IconRails } from '../../src/components/IconRails';
import { TurnCard } from '../../src/components/TurnCard';
import { PlayerStrip } from '../../src/components/PlayerStrip';
import { WinBanner } from '../../src/components/WinBanner';
import type { EngineColor } from '../../src/theme/tokens';

// Mock game states
const mockStartPieces = [
  { engineColor: 'yellow' as EngineColor, row: 1, col: 1, isMovable: false },
  { engineColor: 'yellow' as EngineColor, row: 1, col: 2, isMovable: false },
  { engineColor: 'green' as EngineColor, row: 1, col: 17, isMovable: false },
  { engineColor: 'green' as EngineColor, row: 2, col: 17, isMovable: false },
  { engineColor: 'red' as EngineColor, row: 17, col: 17, isMovable: false },
  { engineColor: 'red' as EngineColor, row: 17, col: 16, isMovable: false },
  { engineColor: 'blue' as EngineColor, row: 17, col: 1, isMovable: false },
  { engineColor: 'blue' as EngineColor, row: 16, col: 1, isMovable: false },
];

const mockMidGamePieces = [
  { engineColor: 'yellow' as EngineColor, row: 8, col: 5, isMovable: true },
  { engineColor: 'yellow' as EngineColor, row: 9, col: 3, isMovable: false },
  { engineColor: 'green' as EngineColor, row: 5, col: 9, isMovable: false },
  { engineColor: 'green' as EngineColor, row: 12, col: 10, isMovable: true },
  { engineColor: 'red' as EngineColor, row: 10, col: 14, isMovable: false },
  { engineColor: 'red' as EngineColor, row: 15, col: 9, isMovable: true },
  { engineColor: 'blue' as EngineColor, row: 8, col: 2, isMovable: false },
  { engineColor: 'blue' as EngineColor, row: 9, col: 15, isMovable: false },
];

const mockPlayers = [
  { engineColor: 'yellow' as EngineColor, name: 'Player 1', isCurrentTurn: true },
  { engineColor: 'green' as EngineColor, name: 'Player 2', isCurrentTurn: false },
  { engineColor: 'red' as EngineColor, name: 'Player 3', isCurrentTurn: false },
  { engineColor: 'blue' as EngineColor, name: 'Player 4', isCurrentTurn: false },
];

export default function DevPreviewScreen() {
  const [view, setView] = useState<'start' | 'midgame' | 'win'>('start');

  return (
    <View style={styles.container}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => setView('start')} style={[styles.navButton, view === 'start' && styles.navButtonActive]}>
          <Text style={styles.navText}>Start</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setView('midgame')} style={[styles.navButton, view === 'midgame' && styles.navButtonActive]}>
          <Text style={styles.navText}>Mid-game</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setView('win')} style={[styles.navButton, view === 'win' && styles.navButtonActive]}>
          <Text style={styles.navText}>Win</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {view !== 'win' && (
          <>
            <BoardTopBar
              roomCode="DEMO"
              isLive={true}
              onBack={() => {}}
              onSettings={() => {}}
            />
            
            <View style={styles.boardContainer}>
              <BoardSVGFull
                width={380}
                pieces={view === 'start' ? mockStartPieces : mockMidGamePieces}
                highlightCells={view === 'midgame' ? [{ row: 8, col: 6 }, { row: 8, col: 7 }] : []}
                targetCell={view === 'midgame' ? { row: 8, col: 6, moveCount: 3 } : undefined}
              />
            </View>

            <View style={styles.railsAndTurnCard}>
              <IconRails />
              <TurnCard
                currentPlayer="yellow"
                dice={view === 'midgame' ? [3, 3] : null}
                timeRemaining={view === 'midgame' ? 12 : undefined}
              />
            </View>

            <PlayerStrip players={mockPlayers} />
          </>
        )}

        {view === 'win' && (
          <WinBanner
            winner="yellow"
            placements={['yellow', 'green', 'red', 'blue']}
            playerName="DEAN"
            onNewGame={() => {}}
            onHome={() => {}}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0C',
  },
  nav: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#141416',
  },
  navButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#18181B',
  },
  navButtonActive: {
    backgroundColor: '#FED100',
  },
  navText: {
    color: '#F6EFD9',
    fontWeight: '600',
  },
  content: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  boardContainer: {
    marginVertical: 16,
  },
  railsAndTurnCard: {
    width: '100%',
    marginTop: 16,
    alignItems: 'center',
  },
});
