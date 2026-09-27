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
import { BoardSVGFull } from '../src/components/board/BoardSVGFull';
import { BoardTopBar } from '../src/components/BoardTopBar';
import { IconRails } from '../src/components/IconRails';
import { TurnCard } from '../src/components/TurnCard';
import { PlayerStrip } from '../src/components/PlayerStrip';
import { WinBanner } from '../src/components/WinBanner';
import { gameAudio, triggerHaptic } from '../src/utils/gameAudio';
import { OnboardingTooltip, useOnboarding } from '../src/components/OnboardingTooltip';
import type { EngineColor } from '../src/theme/tokens';

export default function GameScreen() {
  const router = useRouter();
  const { colors } = useLocalSearchParams<{ colors: string }>();
  const { width } = useWindowDimensions();
  
  const { shouldShow: shouldShowOnboarding, dismissOnboarding } = useOnboarding();
  
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

  const players = playerColors.map((color) => ({
    engineColor: color as EngineColor,
    name: `Player ${playerColors.indexOf(color) + 1}`,
    isCurrentTurn: color === gameState.turn,
  }));

  return (
    <SafeAreaView style={styles.safeArea}>
      {shouldShowOnboarding && (
        <OnboardingTooltip onDismiss={dismissOnboarding} />
      )}
      
      <BoardTopBar
        onBack={() => router.back()}
        onSettings={() => {}}
      />
      
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.boardContainer}>
          <BoardSVGFull
            width={boardWidth}
            pieces={gameState.tokens.map((token, i) => ({
              engineColor: token.color as EngineColor,
              row: token.pos.row,
              col: token.pos.col,
              isMovable: legalTokenIndices.includes(i),
            }))}
            highlightCells={legalMovesArray.map(m => ({ row: m.resulting.row, col: m.resulting.col }))}
          />
        </View>

        <View style={styles.railsAndTurnCard}>
          <IconRails />
          <TurnCard
            currentPlayer={gameState.turn as EngineColor}
            dice={gameState.dice ? [gameState.dice, gameState.dice] : null}
            onRoll={handleRoll}
          />
        </View>

        <PlayerStrip players={players} />

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
    backgroundColor: '#0B0B0C',
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor: '#0B0B0C',
  },
  boardContainer: {
    marginVertical: 16,
    alignItems: 'center',
  },
  railsAndTurnCard: {
    width: '100%',
    marginTop: 16,
    alignItems: 'center',
  },
});
