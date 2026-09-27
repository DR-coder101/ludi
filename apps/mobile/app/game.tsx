import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import type { Color, GameState } from '@ludi/rules';
import {
  createGame,
  rollDice,
  legalMoves,
  applyMove,
} from '@ludi/rules';
import { BoardScreen } from '../src/components/game/BoardScreen';
import type { LastRoll } from '../src/components/game/turnCopy';
import type { Seats } from '../src/components/game/types';
import { WinBanner } from '../src/components/WinBanner';
import { gameAudio, triggerHaptic } from '../src/utils/gameAudio';
import { OnboardingTooltip, useOnboarding } from '../src/components/OnboardingTooltip';

export default function GameScreen() {
  const router = useRouter();
  const { colors } = useLocalSearchParams<{ colors: string }>();

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
  const [lastRoll, setLastRoll] = useState<LastRoll | null>(null);
  const [rollKey, setRollKey] = useState(0);
  const previousTurn = useRef<Color>(gameState.turn);

  useEffect(() => {
    gameAudio.initialize();
    gameAudio.loadSounds();

    return () => {
      gameAudio.cleanup();
    };
  }, []);

  useEffect(() => {
    if (gameState.turn !== previousTurn.current) {
      triggerHaptic.medium();
      previousTurn.current = gameState.turn;
    }
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

  const seats = useMemo<Seats>(
    () => Object.fromEntries(playerColors.map((c, i) => [c, { name: `Player ${i + 1}` }])),
    [playerColors]
  );

  const handleRoll = () => {
    if (gameState.phase !== 'awaiting_roll') return;

    const result = rollDice(gameState, Math.random);
    gameAudio.play('roll');
    setLastRoll({
      value: result.value,
      color: gameState.turn,
      passed: result.state.phase !== 'awaiting_move',
    });
    setRollKey((k) => k + 1);
    setGameState(result.state);
  };

  const handleTokenPress = (tokenIndex: number) => {
    if (gameState.phase !== 'awaiting_move') return;
    if (!legalMovesArray.some((m) => m.tokenIndex === tokenIndex)) return;
    setGameState(applyMove(gameState, tokenIndex).state);
  };

  const handleNewGame = () => {
    router.back();
  };

  return (
    <BoardScreen
      state={gameState}
      legalMoves={legalMovesArray}
      seats={seats}
      myTurn
      onRoll={handleRoll}
      onTokenPress={handleTokenPress}
      lastRoll={lastRoll}
      rollKey={rollKey}
      onMenu={() => router.back()}
      onProfile={() => router.push('/profile')}
    >
      {shouldShowOnboarding && (
        <OnboardingTooltip onDismiss={dismissOnboarding} />
      )}
      {gameState.phase === 'finished' && gameState.winner && (
        <WinBanner
          winner={gameState.winner}
          placements={gameState.placements}
          onNewGame={handleNewGame}
        />
      )}
    </BoardScreen>
  );
}
