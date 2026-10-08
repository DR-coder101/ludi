import { useEffect, useState, useMemo, useCallback } from 'react';
import { StyleSheet, View, SafeAreaView, Text, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import type { Color } from '@ludi/protocol';
import { legalMoves as engineMoves } from '@ludi/rules';
import { socketManager } from '../../src/net/socket';
import { useRoomStore } from '../../src/stores/roomStore';
import { useGameStore } from '../../src/stores/gameStore';
import { useConnectionStore } from '../../src/stores/connectionStore';
import { useChatStore } from '../../src/stores/chatStore';
import { useVideoStore } from '../../src/stores/videoStore';
import { useToastStore } from '../../src/stores/toastStore';
import { BoardScreen } from '../../src/components/game/BoardScreen';
import type { MoveLike } from '../../src/components/board/boardModel';
import { makeHop, type HopAnimation } from '../../src/components/board/BoardView';
import { useTurnTimer } from '../../src/components/game/useTurnTimer';
import { WinScreen } from '../../src/components/win/WinScreen';
import { winView } from '../../src/components/win/winModel';
import { useMatchStats } from '../../src/components/win/useMatchStats';
import { ChatPanel } from '../../src/components/ChatPanel';
import { Toast } from '../../src/components/Toast';
import { OnboardingTooltip, useOnboarding } from '../../src/components/OnboardingTooltip';
import { gameAudio, triggerHaptic } from '../../src/utils/gameAudio';
import { fetchVideoToken } from '../../src/net/videoToken';
import { color, font } from '../../src/theme/tokens';

/** Server turn length (`deadlineTs: Date.now() + 30000`). */
const TURN_MS = 30000;

export default function OnlineGameScreen() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();
  const roomCode = code?.toUpperCase() || '';

  const roomState = useRoomStore((state) => state.roomState);
  const myPlayerId = useRoomStore((state) => state.myPlayerId);
  const myPlayer = useRoomStore((state) => state.getMyPlayer());

  const gameState = useGameStore((state) => state.gameState);
  const setGameState = useGameStore((state) => state.setGameState);
  const setCurrentTurnPlayerId = useGameStore((state) => state.setCurrentTurnPlayerId);
  const setTurnDeadline = useGameStore((state) => state.setTurnDeadline);
  const applyOptimisticMove = useGameStore((state) => state.applyOptimisticMove);
  const rollbackOptimisticMove = useGameStore((state) => state.rollbackOptimisticMove);
  const turnDeadline = useGameStore((state) => state.turnDeadline);

  const isReconnecting = useConnectionStore((state) => state.isReconnecting);
  const setConnected = useConnectionStore((state) => state.setConnected);
  const setReconnecting = useConnectionStore((state) => state.setReconnecting);

  const addChatMessage = useChatStore((state) => state.addMessage);
  const unreadCount = useChatStore((state) => state.unreadCount);
  const toggleChat = useChatStore((state) => state.toggleChat);

  const videoToken = useVideoStore((state) => state.token);
  const micEnabled = useVideoStore((state) => state.micEnabled);
  const toggleMic = useVideoStore((state) => state.toggleMic);
  const setConnection = useVideoStore((state) => state.setConnection);
  const resetVideo = useVideoStore((state) => state.reset);

  const { visible, message, type, duration, showToast, hideToast } = useToastStore();

  const { shouldShow: shouldShowOnboarding, dismissOnboarding } = useOnboarding();

  const [hop, setHop] = useState<HopAnimation | null>(null);
  const [lastRoll, setLastRoll] = useState<[number, number] | null>(null);
  const [rollKey, setRollKey] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [isRematching, setIsRematching] = useState(false);
  const match = useMatchStats(gameState?.phase === 'finished');

  const timer = useTurnTimer(gameState?.phase === 'finished' ? null : turnDeadline, TURN_MS);

  useEffect(() => {
    const init = async () => {
      await gameAudio.initialize();
      await gameAudio.loadSounds();
    };
    init();
    return () => {
      gameAudio.cleanup();
    };
  }, []);

  // Fetch video token when game reaches READY_CHECK or later
  useEffect(() => {
    if (!roomState || !myPlayerId || !roomCode) return;

    const shouldConnectVideo =
      roomState.status === 'ready_check' ||
      roomState.status === 'countdown' ||
      roomState.status === 'in_progress';

    if (shouldConnectVideo && !videoToken) {
      console.log('[Video] Fetching token for room:', roomCode);
      const sessionToken = socketManager.getSessionToken() ?? '';

      fetchVideoToken(roomCode, myPlayerId, sessionToken).then((result) => {
        if (result.token) {
          console.log('[Video] Token received, connecting to LiveKit');
          setConnection(roomCode, result.token);
        } else {
          console.error('[Video] Failed to fetch token:', result.error);
        }
      });
    }

    return () => {
      if (roomState.status === 'finished' || roomState.status === 'closed') {
        resetVideo();
      }
    };
  }, [roomState?.status, myPlayerId, roomCode, videoToken, setConnection, resetVideo]);

  useEffect(() => {
    const socket = socketManager.getSocket();
    if (!socket) {
      router.replace('/');
      return;
    }

    socket.on('game:state', (state) => {
      setGameState(state);
    });

    const colorOf = (playerId: string) =>
      useRoomStore.getState().roomState?.players.find((p) => p.id === playerId)?.color;

    socket.on('game:diceRolled', (payload) => {
      const roller = colorOf(payload.playerId);
      if (roller) match.roll(roller, payload.values);
      setLastRoll(payload.values);
      setRollKey((k) => k + 1);
      gameAudio.play('roll');

      if (payload.playerId === myPlayerId) {
        triggerHaptic.light();
      }
    });

    socket.on('game:tokenMoved', (payload) => {
      if (payload.captured) {
        const mover = colorOf(payload.playerId);
        if (mover) match.capture(mover);
        gameAudio.play('capture');
        triggerHaptic.heavy();
      }
      // Our own move already started its hop on tap.
      if (payload.playerId === myPlayerId) return;
      const current = useGameStore.getState().gameState;
      if (!current) return;
      const before = {
        ...current,
        tokens: current.tokens.map((t, i) => (i === payload.tokenIndex ? { ...t, pos: payload.from } : t)),
      };
      setHop(makeHop(before, payload.tokenIndex, payload.to));
    });

    socket.on('game:turnChanged', (payload) => {
      setCurrentTurnPlayerId(payload.playerId);
      setTurnDeadline(payload.deadlineTs);

      if (payload.playerId === myPlayerId) {
        triggerHaptic.medium();
      }
    });

    socket.on('game:over', () => {
      gameAudio.play('win');
      triggerHaptic.success();
    });

    socket.on('chat:message', (message, playerId) => {
      addChatMessage(playerId, message);
    });

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.io.on('reconnect_attempt', () => {
      setReconnecting(true);
    });

    socket.io.on('reconnect', () => {
      setConnected(true);
      setReconnecting(false);
    });

    socket.on('error', (message) => {
      console.error('[Game] Server error:', message);
      showToast(message, 'error');
    });

    return () => {
      socket.off('game:state');
      socket.off('game:diceRolled');
      socket.off('game:tokenMoved');
      socket.off('game:turnChanged');
      socket.off('game:over');
      socket.off('chat:message');
      socket.off('error');
    };
  }, [roomCode, myPlayerId]);

  const myColor = myPlayer?.color ?? null;
  const isMyTurn = !!gameState && !!myColor && gameState.turn === myColor;
  // Moves come from the synced state, so they stay current after the first die is played.
  const legalMoves = useMemo(
    () => (gameState?.phase === 'awaiting_move' ? engineMoves(gameState) : []),
    [gameState],
  );

  const names = useMemo(() => {
    const out: Partial<Record<Color, string>> = {};
    for (const p of roomState?.players ?? []) out[p.color] = p.displayName;
    return out;
  }, [roomState?.players]);

  const handleRoll = useCallback(() => {
    if (!isMyTurn || gameState?.phase !== 'awaiting_roll' || isRolling) return;

    const socket = socketManager.getSocket();
    if (!socket) return;

    setIsRolling(true);
    triggerHaptic.medium();

    socket.emit('game:roll', {}, (response) => {
      setIsRolling(false);

      if (!response.success) {
        console.error('[Game] Roll failed:', response.error);
        showToast(response.error || 'Roll failed', 'error');
      }
    });
  }, [isMyTurn, gameState?.phase, isRolling]);

  const handleMove = useCallback(({ tokenIndex, dieIndex }: MoveLike) => {
    if (!isMyTurn || gameState?.phase !== 'awaiting_move' || isMoving) return;

    const move = legalMoves.find((m) => m.tokenIndex === tokenIndex && m.dieIndex === dieIndex);
    if (!move) return;

    const socket = socketManager.getSocket();
    if (!socket || !gameState) return;

    setIsMoving(true);

    const from = gameState.tokens[tokenIndex].pos;
    setHop(makeHop(gameState, tokenIndex, move.resulting));
    applyOptimisticMove({ tokenIndex, dieIndex, from, to: move.resulting });

    socket.emit('game:move', { tokenIndex, dieIndex }, (response) => {
      setIsMoving(false);

      if (!response.success) {
        console.error('[Game] Move rejected:', response.error, response.hint);
        setHop(null);
        rollbackOptimisticMove();
        const errorMsg = response.hint
          ? `${response.error}: ${response.hint}`
          : response.error || 'Move rejected';
        showToast(errorMsg, 'error', 4000);
      }
    });
  }, [isMyTurn, gameState, legalMoves, isMoving, applyOptimisticMove, rollbackOptimisticMove]);

  const handleLeave = async () => {
    const socket = socketManager.getSocket();
    if (socket) {
      socket.emit('room:leave');
    }
    await socketManager.clearSession();
    router.replace('/');
  };

  /** No rematch event exists yet, so REMATCH opens a fresh room with the same house rules. */
  const handleRematch = async () => {
    const socket = socketManager.getSocket();
    if (!socket || !roomState || !myPlayer || isRematching) return;
    setIsRematching(true);
    socket.emit('room:leave');
    await socketManager.clearSession();
    socket.emit('room:create', { displayName: myPlayer.displayName, houseRules: roomState.houseRules }, async (response) => {
      if (!response.success || !response.roomCode) {
        setIsRematching(false);
        showToast(response.error || 'Could not open a rematch room', 'error');
        return;
      }
      if (response.sessionToken) await socketManager.saveSessionToken(response.sessionToken);
      if (response.playerId) await socketManager.savePlayerId(response.playerId);
      resetVideo();
      router.replace(`/lobby/${response.roomCode}`);
    });
  };

  if (!gameState || !roomState) {
    return (
      <SafeAreaView style={styles.loading}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={color.gold} />
        <Text style={styles.loadingText}>Loading game...</Text>
      </SafeAreaView>
    );
  }

  const isFinished = gameState.phase === 'finished';
  const results = isFinished ? winView({ state: gameState, names, roomCode, stats: match.stats }) : null;
  const toast = (
    <Toast visible={visible} message={message} type={type} duration={duration} onDismiss={hideToast} />
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <BoardScreen
        state={gameState}
        moves={isMyTurn && !isMoving ? legalMoves : []}
        me={myColor}
        names={names}
        roomCode={roomCode}
        lastRoll={lastRoll}
        rollKey={rollKey}
        timer={timer}
        hop={hop}
        onHopDone={() => setHop(null)}
        onRoll={isRolling ? undefined : handleRoll}
        onMove={handleMove}
        onMenu={handleLeave}
        onProfile={() => router.push('/profile')}
        voice={{ on: micEnabled, onToggle: toggleMic }}
        chat={{ unread: unreadCount, onToggle: toggleChat }}
      >
        {isReconnecting ? (
          <View style={styles.reconnecting} pointerEvents="none">
            <Text style={styles.reconnectingText}>RECONNECTING…</Text>
          </View>
        ) : null}
        <ChatPanel hideToggle roomCode={roomCode} myPlayerId={myPlayerId || ''} roomPlayers={roomState.players} />
        {results ? null : toast}
        {shouldShowOnboarding ? <OnboardingTooltip onDismiss={dismissOnboarding} /> : null}
        {results ? (
          <WinScreen
            view={results}
            onRematch={myPlayer ? handleRematch : undefined}
            rematchBusy={isRematching}
            onLobby={handleLeave}
          >
            {toast}
          </WinScreen>
        ) : null}
      </BoardScreen>
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: color.bg,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: color.gold,
  },
  reconnecting: {
    position: 'absolute',
    top: 120,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: color.gold,
  },
  reconnectingText: {
    fontFamily: font.sticker,
    fontSize: 11,
    letterSpacing: 1,
    color: color.bg,
  },
});
