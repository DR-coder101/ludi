import { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  useWindowDimensions,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import type { Color, GameState, TokenPos } from '@ludi/rules';
import {
  createGame,
  rollDice,
  legalMoves,
  applyMove,
} from '@ludi/rules';
import { GameBoard } from '../src/components/board/GameBoard';
import { Dice } from '../src/components/Dice';
import { TurnIndicator } from '../src/components/TurnIndicator';
import { WinBanner } from '../src/components/WinBanner';
import { gameAudio, triggerHaptic } from '../src/utils/gameAudio';

export default function GameScreen() {
  const router = useRouter();
  const { colors } = useLocalSearchParams<{ colors: string }>();
  const { width } = useWindowDimensions();
  
  const playerColors = useMemo(() => {
    if (!colors) return ['red', 'green'] as Color[];
    return colors.split(',') as Color[];
  }, [colors]);

  const [gameState, setGameState] = useState<GameState>(() =>
    createGame({
      playerColors,
      houseRules: {
        maxConsecutiveSixes: 2,
        extraRollOnCapture: false,
        blockadeCanMoveTogether: false,
        exactFinishBonus: false,
        playForPlacements: false,
      },
    })
  );

  const [animatingToken, setAnimatingToken] = useState<{
    tokenIndex: number;
    from: TokenPos;
    to: TokenPos;
  } | null>(null);

  const [capturedToken, setCapturedToken] = useState<{
    tokenIndex: number;
    pos: TokenPos;
  } | null>(null);
  
  const [previousTurn, setPreviousTurn] = useState<Color | null>(null);

  useEffect(() => {
    gameAudio.initialize();
    gameAudio.loadSounds();
    
    return () => {
      gameAudio.cleanup();
    };
  }, []);

  useEffect(() => {
    if (gameState.turn !== previousTurn && previousTurn !== null) {
      triggerHaptic.medium();
    }
    setPreviousTurn(gameState.turn);
  }, [gameState.turn]);

  useEffect(() => {
    if (gameState.phase === 'finished') {
      gameAudio.play('win');
      triggerHaptic.success();
    }
  }, [gameState.phase]);

  const legalMovesArray = useMemo(() => {
    if (gameState.phase !== 'awaiting_move') return [];
    return legalMoves(gameState);
  }, [gameState]);

  const legalTokenIndices = useMemo(() => {
    return legalMovesArray.map((move) => move.tokenIndex);
  }, [legalMovesArray]);

  const handleRoll = () => {
    if (gameState.phase !== 'awaiting_roll') return;
    
    const result = rollDice(gameState, Math.random);
    setGameState(result.state);
  };

  const handleTokenPress = (tokenIndex: number) => {
    if (gameState.phase !== 'awaiting_move') return;
    
    const move = legalMovesArray.find((m) => m.tokenIndex === tokenIndex);
    if (!move) return;

    const oldPos = gameState.tokens[tokenIndex].pos;
    
    if (move.captures) {
      const capturedTokenIndex = gameState.tokens.findIndex(
        (t) => t.color === move.captures!.color && t.index === move.captures!.index
      );
      
      if (capturedTokenIndex !== -1) {
        const capturedPos = gameState.tokens[capturedTokenIndex].pos;
        setCapturedToken({ tokenIndex: capturedTokenIndex, pos: capturedPos });
      }
    }
    
    setAnimatingToken({
      tokenIndex,
      from: oldPos,
      to: move.resulting,
    });
    
    const result = applyMove(gameState, tokenIndex);
    
    setTimeout(() => {
      setGameState(result.state);
      setAnimatingToken(null);
      setCapturedToken(null);
    }, 800);
  };

  const handleNewGame = () => {
    router.back();
  };

  const boardWidth = Math.min(width - 32, 500);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TurnIndicator
            currentPlayer={gameState.turn}
            lastRoll={gameState.dice}
            phase={gameState.phase}
          />
        </View>

        <View style={styles.boardContainer}>
          <GameBoard
            width={boardWidth}
            gameState={gameState}
            legalTokenIndices={legalTokenIndices}
            onTokenPress={handleTokenPress}
            animatingToken={animatingToken}
            capturedToken={capturedToken}
          />
        </View>

        <View style={styles.controls}>
          <Dice
            value={gameState.dice}
            onRoll={handleRoll}
            disabled={gameState.phase !== 'awaiting_roll'}
          />
        </View>

        {gameState.phase === 'finished' && gameState.winner && (
          <WinBanner
            winner={gameState.winner}
            placements={gameState.placements}
            onNewGame={handleNewGame}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  container: {
    flexGrow: 1,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  header: {
    width: '100%',
    maxWidth: 500,
    marginBottom: 16,
  },
  boardContainer: {
    marginVertical: 16,
    borderRadius: 12,
    backgroundColor: '#2a2a2a',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  controls: {
    marginTop: 20,
    alignItems: 'center',
  },
});
