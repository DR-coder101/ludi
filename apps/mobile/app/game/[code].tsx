import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  useWindowDimensions,
  ScrollView,
  SafeAreaView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import type { Color, TokenPos } from '@ludi/protocol';
import { socketManager } from '../../src/net/socket';
import { useRoomStore } from '../../src/stores/roomStore';
import { useGameStore } from '../../src/stores/gameStore';
import { useConnectionStore } from '../../src/stores/connectionStore';
import { useChatStore } from '../../src/stores/chatStore';
import { useVideoStore } from '../../src/stores/videoStore';
import { useToastStore } from '../../src/stores/toastStore';
import { GameBoard } from '../../src/components/board/GameBoard';
import { Dice } from '../../src/components/Dice';
import { TurnIndicator } from '../../src/components/TurnIndicator';
import { WinBanner } from '../../src/components/WinBanner';
import { TurnDeadline } from '../../src/components/TurnDeadline';
import { ChatPanel } from '../../src/components/ChatPanel';
import { VideoGrid } from '../../src/components/video/VideoGrid';
import { Toast } from '../../src/components/Toast';
import { OnboardingTooltip, useOnboarding } from '../../src/components/OnboardingTooltip';
import { gameAudio, triggerHaptic } from '../../src/utils/gameAudio';
import { fetchVideoToken } from '../../src/net/videoToken';

export default function OnlineGameScreen() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();
  const roomCode = code?.toUpperCase() || '';
  const { width } = useWindowDimensions();

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

  const videoToken = useVideoStore((state) => state.token);
  const setConnection = useVideoStore((state) => state.setConnection);
  const resetVideo = useVideoStore((state) => state.reset);
  
  const { visible, message, type, duration, showToast, hideToast } = useToastStore();

  const { shouldShow: shouldShowOnboarding, dismissOnboarding } = useOnboarding();

  // Local UI state
  const [animatingToken, setAnimatingToken] = useState<{
    tokenIndex: number;
    from: TokenPos;
    to: TokenPos;
  } | null>(null);

  const [capturedToken, setCapturedToken] = useState<{
    tokenIndex: number;
    pos: TokenPos;
  } | null>(null);

  const [isRolling, setIsRolling] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  // LiveKit URL from environment
  const livekitUrl = process.env.EXPO_PUBLIC_LIVEKIT_URL || '';

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
      
      if (payload.playerId === myPlayerId) {
        triggerHaptic.light();
      }
    });

    // Token moved (for animations)
    socket.on('game:tokenMoved', (payload) => {
      console.log('[Game] Token moved:', payload.tokenIndex, payload.playerId === myPlayerId ? '(me)' : '(other)');
      
      setAnimatingToken({
        tokenIndex: payload.tokenIndex,
        from: payload.from,
        to: payload.to,
      });

      if (payload.captured) {
        const capturedTokenIndex = gameState?.tokens.findIndex(
          (t: { color: Color; index: number }) => t.color === payload.captured!.color && t.index === payload.captured!.index
        ) ?? -1;

        if (capturedTokenIndex !== -1 && gameState) {
          setCapturedToken({
            tokenIndex: capturedTokenIndex,
            pos: gameState.tokens[capturedTokenIndex].pos,
          });
          gameAudio.play('capture');
        }
      } else {
        gameAudio.play('hop');
      }

      setTimeout(() => {
        setAnimatingToken(null);
        setCapturedToken(null);
      }, 800);
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
  }, [roomCode, myPlayerId, gameState?.tokens]);

  // Derive my color from room state
  const myColor = useMemo(() => {
    return myPlayer?.color || null;
  }, [myPlayer]);

  // Check if it's my turn
  const isMyTurn = useMemo(() => {
    if (!gameState || !myColor) return false;
    return gameState.turn === myColor;
  }, [gameState, myColor]);

  // Legal token indices for highlighting
  const legalTokenIndices = useMemo(() => {
    return legalMoves.map((move) => move.tokenIndex);
  }, [legalMoves]);

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

  const handleLeave = () => {
    const socket = socketManager.getSocket();
    if (socket) {
      socket.emit('room:leave');
    }
    router.replace('/');
  };

  const handleNewGame = () => {
    handleLeave();
  };

  if (!gameState || !roomState) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4AF37" />
          <Text style={styles.loadingText}>Loading game...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const boardWidth = Math.min(width - 32, 500);
  const isFinished = gameState.phase === 'finished';

  const gameContent = (
    <>
      <Toast
        visible={visible}
        message={message}
        type={type}
        duration={duration}
        onDismiss={hideToast}
      />
      {isReconnecting && (
        <View style={styles.reconnectingBanner}>
          <Text style={styles.reconnectingText}>🔄 Reconnecting...</Text>
        </View>
      )}

      {videoToken && livekitUrl && roomState && myPlayerId && (
        <VideoGrid 
          roomPlayers={roomState.players} 
          myPlayerId={myPlayerId}
        />
      )}

      <View style={styles.header}>
        <TouchableOpacity onPress={handleLeave} style={styles.leaveButton}>
          <Text style={styles.leaveButtonText}>← Leave</Text>
        </TouchableOpacity>

        <TurnIndicator
          currentPlayer={gameState.turn}
          lastRoll={gameState.dice}
          phase={gameState.phase}
        />
        
        {isMyTurn && turnDeadline && gameState.phase !== 'finished' && (
          <TurnDeadline deadline={turnDeadline} />
        )}
      </View>

      <View style={styles.boardContainer}>
        <GameBoard
          width={boardWidth}
          gameState={gameState}
          legalTokenIndices={isMyTurn ? legalTokenIndices : []}
          onTokenPress={handleTokenPress}
          animatingToken={animatingToken}
          capturedToken={capturedToken}
        />
      </View>

      <View style={styles.controls}>
        <Dice
          value={gameState.dice}
          onRoll={handleRoll}
          disabled={!isMyTurn || gameState.phase !== 'awaiting_roll' || isRolling}
        />
      </View>

      {isFinished && gameState.winner && (
        <WinBanner
          winner={gameState.winner}
          placements={gameState.placements}
          onNewGame={handleNewGame}
        />
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {shouldShowOnboarding && (
        <OnboardingTooltip onDismiss={dismissOnboarding} />
      )}
      <ScrollView contentContainerStyle={styles.container}>
        {videoToken && livekitUrl ? (
          gameContent
        ) : (
          gameContent
        )}
      </ScrollView>

      <ChatPanel roomCode={roomCode} myPlayerId={myPlayerId || ''} roomPlayers={roomState.players} />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#D4AF37',
  },
  reconnectingBanner: {
    width: '100%',
    backgroundColor: '#4a3a1a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  reconnectingText: {
    color: '#FDD835',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    width: '100%',
    maxWidth: 500,
    marginBottom: 16,
  },
  leaveButton: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  leaveButtonText: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: '600',
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
