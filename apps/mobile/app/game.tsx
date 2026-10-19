import { useState, useEffect, useMemo } from 'react';
import { AppState } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import type { ErrorBoundaryProps } from 'expo-router';
import type { Color, GameState } from '@ludi/rules';
import { legalMoves } from '@ludi/rules';
import { BoardScreen } from '../src/components/game/BoardScreen';
import type { MoveLike } from '../src/components/board/boardModel';
import { makeHop, type HopAnimation } from '../src/components/board/BoardView';
import { WinScreen } from '../src/components/win/WinScreen';
import { winView } from '../src/components/win/winModel';
import { useMatchStats } from '../src/components/win/useMatchStats';
import { gameAudio, triggerHaptic } from '../src/utils/gameAudio';
import { OnboardingTooltip, useOnboarding } from '../src/components/OnboardingTooltip';
import {
  clearLocalGame,
  createLocalGame,
  loadLocalGame,
  reduceLocalGame,
  resumeLocalGame,
  saveLocalGame,
  type LocalGame,
} from '../src/game/localGame';
import { decidePlayEvent, playSessionFlag } from '../src/nav/playNavigation';
import { RouteErrorBoundary } from '../src/nav/RouteErrorView';
import { storage } from '../src/utils/storage';

interface PendingMove {
  anim: HopAnimation;
  next: GameState;
  captures: boolean;
}

export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <RouteErrorBoundary {...props} />;
}

export default function GameScreen() {
  const router = useRouter();
  const { colors, resume } = useLocalSearchParams<{ colors: string; resume?: string }>();

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

  const [game, setGame] = useState<LocalGame>(() => createLocalGame(playerColors));
  const [hydrated, setHydrated] = useState(resume !== '1');
  const [pending, setPending] = useState<PendingMove | null>(null);
  const [previousTurn, setPreviousTurn] = useState<Color | null>(null);
  const match = useMatchStats(game.state.phase === 'finished');
  const gameState = game.state;

  useEffect(() => {
    playSessionFlag.setLocal(true);
    let cancelled = false;
    if (resume === '1') {
      void loadLocalGame(storage).then((saved) => {
        if (cancelled) return;
        setGame((fresh) => resumeLocalGame(fresh, saved));
        setHydrated(true);
      });
    } else {
      setHydrated(true);
    }
    return () => {
      cancelled = true;
      playSessionFlag.setLocal(false);
    };
  }, [playerColors, resume]);

  useEffect(() => {
    if (!hydrated) return;
    if (game.state.phase === 'finished') {
      void clearLocalGame(storage);
      return;
    }
    void saveLocalGame(storage, game);
  }, [game, hydrated]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      const event = next === 'active' ? 'app-active' : 'app-background';
      const cmd = decidePlayEvent('local', event);
      if (cmd.type !== 'stay') {
        console.error('[LocalGame] refused to leave the board on', event, cmd);
      }
      if (hydrated && (next === 'background' || next === 'inactive')) {
        void saveLocalGame(storage, game);
      }
    });
    return () => sub.remove();
  }, [game, hydrated]);

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
    const next = reduceLocalGame(game, { type: 'roll', random: Math.random });
    if (next.lastRoll) match.roll(gameState.turn, next.lastRoll);
    gameAudio.play('roll');
    triggerHaptic.medium();
    setGame(next);
  };

  const handleMove = ({ tokenIndex, dieIndex }: MoveLike) => {
    if (gameState.phase !== 'awaiting_move' || pending) return;
    const move = moves.find((m) => m.tokenIndex === tokenIndex && m.dieIndex === dieIndex);
    if (!move) return;
    if (move.captures) match.capture(gameState.turn);

    const next = reduceLocalGame(game, { type: 'move', tokenIndex, dieIndex });
    const anim = makeHop(gameState, tokenIndex, move.resulting);
    if (!anim) {
      setGame(next);
      return;
    }
    setPending({ anim, next: next.state, captures: !!move.captures });
  };

  const handleHopDone = () => {
    if (!pending) return;
    if (pending.captures) {
      gameAudio.play('capture');
      triggerHaptic.heavy();
    }
    setGame((current) => ({ ...current, state: pending.next }));
    setPending(null);
  };

  const handleRematch = () => {
    setGame(reduceLocalGame(game, { type: 'rematch' }));
    setPending(null);
    match.reset();
  };

  const leaveBoard = () => {
    void clearLocalGame(storage);
    playSessionFlag.setLocal(false);
    router.back();
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
        lastRoll={game.lastRoll}
        rollKey={game.rollKey}
        hop={pending?.anim ?? null}
        onHopDone={handleHopDone}
        onRoll={handleRoll}
        onMove={handleMove}
        onMenu={leaveBoard}
        onProfile={() => router.push('/profile')}
      >
        {shouldShowOnboarding ? <OnboardingTooltip onDismiss={dismissOnboarding} /> : null}
        {gameState.phase === 'finished' && results ? (
          <WinScreen view={results} onRematch={handleRematch} onLobby={leaveBoard} />
        ) : null}
      </BoardScreen>
    </>
  );
}
