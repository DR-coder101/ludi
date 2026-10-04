import { useEffect, useState } from 'react';
import { Share } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import type { HouseRules } from '@ludi/protocol';
import { socketManager } from '../../src/net/socket';
import { useRoomStore } from '../../src/stores/roomStore';
import { useConnectionStore } from '../../src/stores/connectionStore';
import { useVideoStore } from '../../src/stores/videoStore';
import { useGameStore } from '../../src/stores/gameStore';
import { useToastStore } from '../../src/stores/toastStore';
import { Toast } from '../../src/components/Toast';
import { LobbyLoading, LobbyRoom } from '../../src/components/lobby/LobbyRoom';
import { lobbySeats, MIN_PLAYERS, roomNote, startCta } from '../../src/components/lobby/lobbyModel';
import { copyText } from '../../src/components/lobby/clipboard';

export default function LobbyScreen() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();
  const roomCode = code?.toUpperCase() || '';

  const roomState = useRoomStore((state) => state.roomState);
  const setRoomState = useRoomStore((state) => state.setRoomState);
  const myPlayerId = useRoomStore((state) => state.myPlayerId);
  const setMyPlayerId = useRoomStore((state) => state.setMyPlayerId);
  const updatePlayerConnection = useRoomStore((state) => state.updatePlayerConnection);
  const setGameState = useGameStore((state) => state.setGameState);
  const isHost = useRoomStore((state) => state.isHost());
  
  const isConnected = useConnectionStore((state) => state.isConnected);
  const setConnected = useConnectionStore((state) => state.setConnected);
  const setReconnecting = useConnectionStore((state) => state.setReconnecting);

  const micEnabled = useVideoStore((state) => state.micEnabled);
  const cameraEnabled = useVideoStore((state) => state.cameraEnabled);
  const toggleMic = useVideoStore((state) => state.toggleMic);
  const toggleCamera = useVideoStore((state) => state.toggleCamera);

  const { visible, message, type, duration, showToast, hideToast } = useToastStore();

  const [isStarting, setIsStarting] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const socket = socketManager.getSocket();
    if (!socket) {
      router.replace('/');
      return;
    }

    // Set my player ID from stored server-issued ID
    const storedPlayerId = socketManager.getPlayerId();
    if (storedPlayerId) {
      setMyPlayerId(storedPlayerId);
    }
    setConnected(socket.connected);

    // Timeout if room state doesn't arrive within 10 seconds
    const timeout = setTimeout(() => {
      if (!roomState) {
        console.error('[Lobby] Timeout waiting for room state');
        setLoadingError('Could not load room. The room may not exist or the server is unavailable.');
      }
    }, 10000);

    // Listen for room state updates
    socket.on('room:state', (state) => {
      console.log('[Lobby] Room state update:', state);
      setRoomState(state);
      clearTimeout(timeout);
      setLoadingError(null);
      
      // Update myPlayerId if we don't have it yet and can find ourselves
      const storedPlayerId = socketManager.getPlayerId();
      if (storedPlayerId && state.players.some(p => p.id === storedPlayerId)) {
        setMyPlayerId(storedPlayerId);
      }
    });

    // Request current room state when mounting (handles race condition where
    // room:create emits room:state before this listener is set up)
    socket.emit('room:requestState');

    // Listen for game start
    socket.on('game:state', (gameState) => {
      console.log('[Lobby] Game started, navigating to game screen');
      // The game screen subscribes after it mounts, so it would miss this first state.
      setGameState(gameState);
      router.replace(`/game/${roomCode}`);
    });

    // Connection status
    socket.on('connect', () => {
      console.log('[Lobby] Socket connected');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('[Lobby] Socket disconnected');
      setConnected(false);
    });

    socket.io.on('reconnect_attempt', () => {
      console.log('[Lobby] Attempting to reconnect');
      setReconnecting(true);
    });

    socket.io.on('reconnect', () => {
      console.log('[Lobby] Reconnected');
      setConnected(true);
      setReconnecting(false);
    });

    // Player connection changes
    socket.on('player:connectionChanged', (playerId, connected) => {
      console.log(`[Lobby] Player ${playerId} connection: ${connected}`);
      updatePlayerConnection(playerId, connected);
    });

    socket.on('error', (message) => {
      console.error('[Lobby] Server error:', message);
      showToast(message, 'error');
    });

    return () => {
      clearTimeout(timeout);
      socket.off('room:state');
      socket.off('game:state');
      socket.off('player:connectionChanged');
      socket.off('error');
    };
  }, [roomCode, router, retryCount]);

  const handleLeave = async () => {
    const socket = socketManager.getSocket();
    if (socket) {
      socket.emit('room:leave');
    }
    await socketManager.clearSession();
    router.replace('/');
  };

  const handleStartGame = () => {
    const socket = socketManager.getSocket();
    if (!socket || !isHost) return;

    if (!roomState || roomState.players.length < MIN_PLAYERS) {
      showToast('Need at least one player to start', 'error');
      return;
    }

    setIsStarting(true);
    socket.emit('room:ready');
    
    // Timeout in case server doesn't respond
    setTimeout(() => setIsStarting(false), 5000);
  };

  const invite = `Join my Ludi game! Room code: ${roomCode}`;

  const handleShareCode = async () => {
    try {
      await Share.share({ message: invite });
    } catch (error) {
      // react-native-web rejects when the browser has no Web Share API.
      if (await copyText(invite)) showToast('Invite copied', 'success');
      else console.error('Share error:', error);
    }
  };

  const handleCopyCode = async () => {
    if (await copyText(roomCode)) {
      showToast('Room code copied', 'success');
      return;
    }
    try {
      await Share.share({ message: roomCode });
    } catch (error) {
      console.error('Copy error:', error);
    }
  };

  const handleHouseRules = (houseRules: HouseRules) => {
    const socket = socketManager.getSocket();
    if (!socket || !isHost) return;

    socket.emit('room:updateHouseRules', houseRules, (response) => {
      if (!response.success) {
        showToast(response.error || 'Failed to update house rules', 'error');
      }
    });
  };

  const handleSelectSeat = (color: string) => {
    const socket = socketManager.getSocket();
    if (!socket) return;

    socket.emit('room:selectSeat', { color }, (response) => {
      if (!response.success) {
        showToast(response.error || 'Failed to select seat', 'error');
      }
    });
  };

  const toast = <Toast visible={visible} message={message} type={type} duration={duration} onDismiss={hideToast} />;
  const header = <Stack.Screen options={{ headerShown: false }} />;

  if (!roomState) {
    return (
      <LobbyLoading error={loadingError} onRetry={() => {
        setLoadingError(null);
        setRetryCount(prev => prev + 1);
      }} onBack={() => router.replace('/')}>
        {header}
        {toast}
      </LobbyLoading>
    );
  }

  const count = roomState.players.length;

  return (
    <LobbyRoom
      code={roomCode}
      host={isHost}
      seats={lobbySeats(roomState, myPlayerId)}
      note={roomNote(count, isConnected)}
      start={startCta(count, isHost)}
      starting={isStarting}
      voice={{ on: micEnabled, onToggle: toggleMic }}
      video={{ on: cameraEnabled, onToggle: toggleCamera }}
      houseRules={roomState.houseRules}
      onHouseRulesChange={isHost ? handleHouseRules : undefined}
      onBack={handleLeave}
      onCopy={handleCopyCode}
      onShare={handleShareCode}
      onStart={handleStartGame}
      onSelectSeat={handleSelectSeat}
    >
      {header}
      {toast}
    </LobbyRoom>
  );
}
