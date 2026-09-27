import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  Text,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { socketManager } from '../../src/net/socket';
import { useRoomStore } from '../../src/stores/roomStore';
import { useGameStore } from '../../src/stores/gameStore';
import { useConnectionStore } from '../../src/stores/connectionStore';
import { useChatStore } from '../../src/stores/chatStore';
import { useVideoStore } from '../../src/stores/videoStore';
import { useToastStore } from '../../src/stores/toastStore';
import { BoardScreen } from '../../src/components/game/BoardScreen';
import type { LastRoll } from '../../src/components/game/turnCopy';
import type { Seats } from '../../src/components/game/types';
import { WinBanner } from '../../src/components/WinBanner';
import { ChatPanel } from '../../src/components/ChatPanel';
import { Toast } from '../../src/components/Toast';
import { OnboardingTooltip, useOnboarding } from '../../src/components/OnboardingTooltip';
import { gameAudio, triggerHaptic } from '../../src/utils/gameAudio';
import { fetchVideoToken } from '../../src/net/videoToken';
import { palette } from '../../src/theme/tokens';

export default function OnlineGameScreen() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();
  const roomCode = code?.toUpperCase() || '';

  // Store state
  const roomState = useRoomStore((state) => state.roomState);
  const myPlayerId = useRoomStore((state) => state.myPlayerId);
  const myPlayer = useRoomStore((state) => state.getMyPlayer());

  const gameState = useGameStore((state) => state.gameState);
  const legalMoves = useGameStore((state) => state.legalMoves);
  const setGameState = useGameStore((state) => state.setGameState);
  const setLegalMoves = useGameStore((state) => state.setLegalMoves);
  const setCurrentTurnPlayerId = useGameStore((state) => state.setCurrentTurnPlayerId);
  const setTurnDeadline = useGameStore((state) => state.setTurnDeadline);
  const applyOptimisticMove = useGameStore((state) => state.applyOptimisticMove);
  const rollbackOptimisticMove = useGameStore((state) => state.rollbackOptimisticMove);
  const turnDeadline = useGameStore((state) => state.turnDeadline);

  const isConnected = useConnectionStore((state) => state.isConnected);
  const isReconnecting = useConnectionStore((state) => state.isReconnecting);
  const setConnected = useConnectionStore((state) => state.setConnected);
  const setReconnecting = useConnectionStore((state) => state.setReconnecting);

  const addChatMessage = useChatStore((state) => state.addMessage);
  const unreadCount = useChatStore((state) => state.unreadCount);
  const toggleChat = useChatStore((state) => state.toggleChat);

  const videoToken = useVideoStore((state) => state.token);
  const setConnection = useVideoStore((state) => state.setConnection);
  const resetVideo = useVideoStore((state) => state.reset);
  const micEnabled = useVideoStore((state) => state.micEnabled);
  const toggleMic = useVideoStore((state) => state.toggleMic);
  
  const { visible, message, type, duration, showToast, hideToast } = useToastStore();

  const { shouldShow: shouldShowOnboarding, dismissOnboarding } = useOnboarding();

  // Local UI state
  const [isRolling, setIsRolling] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [lastRoll, setLastRoll] = useState<LastRoll | null>(null);
  const [rollKey, setRollKey] = useState(0);

  // Initialize audio
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
      
      fetchVideoToken(roomCode, myPlayerId).then((result) => {
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

  // Socket event listeners
  useEffect(() => {
    const socket = socketManager.getSocket();
    if (!socket) {
      router.replace('/');
      return;
    }

    console.log('[Game] Setting up socket listeners');

    // Game state updates (authoritative)
    socket.on('game:state', (state) => {
      console.log('[Game] Received game state:', state.phase, state.turn);
      setGameState(state);
    });

    // Dice rolled
    socket.on('game:diceRolled', (payload) => {
      console.log('[Game] Dice rolled:', payload.value, 'legal moves:', payload.legalMoves.length);
      setLegalMoves(payload.legalMoves);
      gameAudio.play('roll');
      const roller = useRoomStore.getState().roomState?.players.find((p) => p.id === payload.playerId);
      if (roller) {
        setLastRoll({ value: payload.value, color: roller.color, passed: payload.legalMoves.length === 0 });
        setRollKey((k) => k + 1);
      }
      
      if (payload.playerId === myPlayerId) {
        triggerHaptic.light();
      }
    });

    // Token moves are animated by the board from the state diff.
    socket.on('game:tokenMoved', (payload) => {
      console.log('[Game] Token moved:', payload.tokenIndex, payload.playerId === myPlayerId ? '(me)' : '(other)');
    });

    // Turn changed
    socket.on('game:turnChanged', (payload) => {
      console.log('[Game] Turn changed:', payload.playerId === myPlayerId ? 'MY TURN' : 'other turn');
      setCurrentTurnPlayerId(payload.playerId);
      setTurnDeadline(payload.deadlineTs);
      
      if (payload.playerId === myPlayerId) {
        triggerHaptic.medium();
      }
    });

    // Game over
    socket.on('game:over', (payload) => {
      console.log('[Game] Game over! Winner:', payload.winnerId);
      gameAudio.play('win');
      triggerHaptic.success();
    });

    // Chat messages
    socket.on('chat:message', (message, playerId) => {
      console.log('[Game] Chat message from', playerId);
      addChatMessage(playerId, message);
    });

    // Connection status
    socket.on('connect', () => {
      console.log('[Game] Socket connected');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('[Game] Socket disconnected');
      setConnected(false);
    });

    socket.io.on('reconnect_attempt', () => {
      console.log('[Game] Attempting to reconnect');
      setReconnecting(true);
    });

    socket.io.on('reconnect', () => {
      console.log('[Game] Reconnected');
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

  // Derive my color from room state
  const myColor = useMemo(() => {
    return myPlayer?.color || null;
  }, [myPlayer]);

  // Check if it's my turn
  const isMyTurn = useMemo(() => {
    if (!gameState || !myColor) return false;
    return gameState.turn === myColor;
  }, [gameState, myColor]);

  const seats = useMemo<Seats>(() => {
    const out: Seats = {};
    for (const p of roomState?.players ?? []) {
      const isYou = p.id === myPlayerId;
      out[p.color] = { name: p.displayName, isYou, muted: isYou && !micEnabled };
    }
    return out;
  }, [roomState?.players, myPlayerId, micEnabled]);

  const handleRoll = useCallback(() => {
    if (!isMyTurn || gameState?.phase !== 'awaiting_roll' || isRolling) return;

    const socket = socketManager.getSocket();
    if (!socket) return;

    console.log('[Game] Rolling dice');
    setIsRolling(true);

    socket.emit('game:roll', {}, (response) => {
      setIsRolling(false);
      
      if (!response.success) {
        console.error('[Game] Roll failed:', response.error);
        showToast(response.error || 'Roll failed', 'error');
      }
    });
  }, [isMyTurn, gameState?.phase, isRolling]);

  const handleTokenPress = useCallback((tokenIndex: number) => {
    if (!isMyTurn || gameState?.phase !== 'awaiting_move' || isMoving) return;

    const move = legalMoves.find((m) => m.tokenIndex === tokenIndex);
    if (!move) return;

    const socket = socketManager.getSocket();
    if (!socket || !gameState) return;

    console.log('[Game] Moving token', tokenIndex);
    setIsMoving(true);

    const from = gameState.tokens[tokenIndex].pos;
    
    // Optimistically update UI
    applyOptimisticMove(tokenIndex, from, move.resulting);

    socket.emit('game:move', { tokenIndex }, (response) => {
      setIsMoving(false);

      if (!response.success) {
        console.error('[Game] Move rejected:', response.error, response.hint);
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

  const handleNewGame = () => {
    handleLeave();
  };

  const confirmLeave = () => {
    if (Platform.OS === 'web') {
      handleLeave();
      return;
    }
    Alert.alert('Leave game?', 'You will leave this room.', [
      { text: 'Stay', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: handleLeave },
    ]);
  };

  if (!gameState || !roomState) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.gold} />
          <Text style={styles.loadingText}>Loading game...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isFinished = gameState.phase === 'finished';

  return (
    <BoardScreen
      state={gameState}
      legalMoves={isMyTurn ? legalMoves : []}
      seats={seats}
      myTurn={isMyTurn}
      onRoll={isMyTurn && !isRolling ? handleRoll : undefined}
      onTokenPress={handleTokenPress}
      lastRoll={lastRoll}
      rollKey={rollKey}
      roomCode={roomCode}
      live
      deadline={turnDeadline}
      onMenu={confirmLeave}
      onProfile={() => router.push('/profile')}
      voice={{ on: micEnabled, onToggle: toggleMic }}
      chat={{ unread: unreadCount, onOpen: toggleChat }}
    >
      {shouldShowOnboarding && (
        <OnboardingTooltip onDismiss={dismissOnboarding} />
      )}
      {isReconnecting && (
        <View style={styles.reconnectingBanner} pointerEvents="none">
          <Text style={styles.reconnectingText}>Reconnecting...</Text>
        </View>
      )}
      <Toast
        visible={visible}
        message={message}
        type={type}
        duration={duration}
        onDismiss={hideToast}
      />
      <ChatPanel
        roomCode={roomCode}
        myPlayerId={myPlayerId || ''}
        roomPlayers={roomState.players}
        showToggle={false}
      />
      {isFinished && gameState.winner && (
        <WinBanner
          winner={gameState.winner}
          placements={gameState.placements}
          onNewGame={handleNewGame}
        />
      )}
    </BoardScreen>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: palette.gold,
  },
  reconnectingBanner: {
    position: 'absolute',
    top: 64,
    alignSelf: 'center',
    backgroundColor: '#4a3a1a',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  reconnectingText: {
    color: palette.gold,
    fontSize: 14,
    fontWeight: '600',
  },
});
