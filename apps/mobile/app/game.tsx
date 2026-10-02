import { useState, useEffect, useMemo } from 'react';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import type { Color, GameState } from '@ludi/rules';
import { createGame, rollDice, legalMoves, applyMove } from '@ludi/rules';
import { BoardScreen } from '../src/components/game/BoardScreen';
import type { MoveLike } from '../src/components/board/boardModel';
import { makeHop, type HopAnimation } from '../src/components/board/BoardView';
import { WinScreen } from '../src/components/win/WinScreen';
import { winView } from '../src/components/win/winModel';
import { useMatchStats } from '../src/components/win/useMatchStats';
import { gameAudio, triggerHaptic } from '../src/utils/gameAudio';
import { OnboardingTooltip, useOnboarding } from '../src/components/OnboardingTooltip';

interface PendingMove {
  anim: HopAnimation;
  next: GameState;
  captures: boolean;
}

export default function GameScreen() {
  const router = useRouter();
  const { colors } = useLocalSearchParams<{ colors: string }>();

  const { shouldShow: shouldShowOnboarding, dismissOnboarding } = useOnboarding();

  const playerColors = useMemo(() => {
    if (!colors) return ['red', 'green'] as Color[];
    return colors.split(',') as Color[];
  }, [colors]);

  const names = useMemo(() => {
    const out: Partial<Record<Color, string>> = {};
    playerColors.forEach((c, i) => {
      out[c] = `Player ${i + 1}`;
    });
    return out;
  }, [playerColors]);

  const newGame = () =>
    createGame({
      playerColors,
      houseRules: {
        maxConsecutiveSixes: 2,
        extraRollOnCapture: false,
        blockadeCanMoveTogether: false,
        exactFinishBonus: false,
        playForPlacements: false,
      },
    });
  const [gameState, setGameState] = useState<GameState>(newGame);
  const [lastRoll, setLastRoll] = useState<[number, number] | null>(null);
  const [rollKey, setRollKey] = useState(0);
  const [pending, setPending] = useState<PendingMove | null>(null);
  const [previousTurn, setPreviousTurn] = useState<Color | null>(null);
  const match = useMatchStats(gameState.phase === 'finished');

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

  const moves = useMemo(() => {
    if (gameState.phase !== 'awaiting_move') return [];
    return legalMoves(gameState);
  }, [gameState]);

  const handleRoll = () => {
    if (gameState.phase !== 'awaiting_roll' || pending) return;
    const result = rollDice(gameState, Math.random);
    match.roll(gameState.turn, result.values);
    gameAudio.play('roll');
    triggerHaptic.medium();
    setLastRoll(result.values);
    setRollKey((k) => k + 1);
    setGameState(result.state);
  };

  const handleMove = ({ tokenIndex, dieIndex }: MoveLike) => {
    if (gameState.phase !== 'awaiting_move' || pending) return;
    const move = moves.find((m) => m.tokenIndex === tokenIndex && m.dieIndex === dieIndex);
    if (!move) return;
    if (move.captures) match.capture(gameState.turn);

    const next = applyMove(gameState, tokenIndex, dieIndex).state;
    const anim = makeHop(gameState, tokenIndex, move.resulting);
    if (!anim) {
      setGameState(next);
      return;
    }
    setPending({ anim, next, captures: !!move.captures });
  };

  const handleHopDone = () => {
    if (!pending) return;
    if (pending.captures) {
      gameAudio.play('capture');
      triggerHaptic.heavy();
    }
    setGameState(pending.next);
    setPending(null);
  };

  const handleRematch = () => {
    setGameState(newGame());
    setLastRoll(null);
    setPending(null);
    match.reset();
  };

  const results = winView({ state: gameState, names, roomCode: null, stats: match.stats });

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <BoardScreen
        state={gameState}
        moves={moves}
        me={null}
        names={names}
        roomCode={null}
        lastRoll={lastRoll}
        rollKey={rollKey}
        hop={pending?.anim ?? null}
        onHopDone={handleHopDone}
        onRoll={handleRoll}
        onMove={handleMove}
        onMenu={() => router.back()}
        onProfile={() => router.push('/profile')}
      >
        {shouldShowOnboarding ? <OnboardingTooltip onDismiss={dismissOnboarding} /> : null}
        {gameState.phase === 'finished' && results ? (
          <WinScreen view={results} onRematch={handleRematch} onLobby={() => router.back()} />
        ) : null}
      </BoardScreen>
    </>
  );
}
