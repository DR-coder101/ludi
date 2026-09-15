import { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { socketManager } from '../../src/net/socket';
import { useRoomStore } from '../../src/stores/roomStore';
import { useConnectionStore } from '../../src/stores/connectionStore';
import type { Player } from '@ludi/protocol';

const COLOR_DISPLAY: Record<string, { name: string; hex: string }> = {
  red: { name: 'Red', hex: '#E53935' },
  green: { name: 'Green', hex: '#43A047' },
  yellow: { name: 'Yellow', hex: '#FDD835' },
  blue: { name: 'Blue', hex: '#1E88E5' },
};

export default function LobbyScreen() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();
  const roomCode = code?.toUpperCase() || '';

  const roomState = useRoomStore((state) => state.roomState);
  const setRoomState = useRoomStore((state) => state.setRoomState);
  const setMyPlayerId = useRoomStore((state) => state.setMyPlayerId);
  const updatePlayerConnection = useRoomStore((state) => state.updatePlayerConnection);
  const myPlayer = useRoomStore((state) => state.getMyPlayer());
  const isHost = useRoomStore((state) => state.isHost());
  
  const isConnected = useConnectionStore((state) => state.isConnected);
  const setConnected = useConnectionStore((state) => state.setConnected);
  const setReconnecting = useConnectionStore((state) => state.setReconnecting);

  const [isStarting, setIsStarting] = useState(false);

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

    // Listen for room state updates
    socket.on('room:state', (state) => {
      console.log('[Lobby] Room state update:', state);
      setRoomState(state);
      
      // Update myPlayerId if we don't have it yet and can find ourselves
      const storedPlayerId = socketManager.getPlayerId();
      if (storedPlayerId && state.players.some(p => p.id === storedPlayerId)) {
        setMyPlayerId(storedPlayerId);
      }
    });

    // Listen for game start
    socket.on('game:state', (gameState) => {
      console.log('[Lobby] Game started, navigating to game screen');
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
      alert(message);
    });

    return () => {
      socket.off('room:state');
      socket.off('game:state');
      socket.off('player:connectionChanged');
      socket.off('error');
    };
  }, [roomCode, router]);

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

    if (!roomState || roomState.players.length < 2) {
      alert('Need at least 2 players to start');
      return;
    }

    setIsStarting(true);
    socket.emit('room:ready');
    
    // Timeout in case server doesn't respond
    setTimeout(() => setIsStarting(false), 5000);
  };

  const handleShareCode = async () => {
    try {
      await Share.share({
        message: `Join my Ludi game! Room code: ${roomCode}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  if (!roomState) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4AF37" />
          <Text style={styles.loadingText}>Loading room...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {!isConnected && (
          <View style={styles.reconnectingBanner}>
            <Text style={styles.reconnectingText}>🔄 Reconnecting...</Text>
          </View>
        )}

        <View style={styles.header}>
          <TouchableOpacity onPress={handleLeave} style={styles.leaveButton}>
            <Text style={styles.leaveButtonText}>← Leave</Text>
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Room Lobby</Text>
            <View style={styles.codeContainer}>
              <Text style={styles.code}>{roomCode}</Text>
              <TouchableOpacity onPress={handleShareCode} style={styles.shareButton}>
                <Text style={styles.shareButtonText}>📤 Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.playersCard}>
          <Text style={styles.cardTitle}>
            Players ({roomState.players.length}/4)
          </Text>
          
          {roomState.players.map((player: Player) => (
            <PlayerCard key={player.id} player={player} isMe={player.id === myPlayer?.id} />
          ))}

          {roomState.players.length < 4 && (
            <View style={styles.emptySlot}>
              <Text style={styles.emptySlotText}>Waiting for players...</Text>
            </View>
          )}
        </View>

        <View style={styles.rulesCard}>
          <Text style={styles.cardTitle}>House Rules</Text>
          <View style={styles.ruleRow}>
            <Text style={styles.ruleLabel}>Max consecutive sixes:</Text>
            <Text style={styles.ruleValue}>{roomState.houseRules.maxConsecutiveSixes}</Text>
          </View>
          <View style={styles.ruleRow}>
            <Text style={styles.ruleLabel}>Extra roll on capture:</Text>
            <Text style={styles.ruleValue}>{roomState.houseRules.extraRollOnCapture ? 'Yes' : 'No'}</Text>
          </View>
          <View style={styles.ruleRow}>
            <Text style={styles.ruleLabel}>Play for placements:</Text>
            <Text style={styles.ruleValue}>{roomState.houseRules.playForPlacements ? 'Yes' : 'No'}</Text>
          </View>
        </View>

        {isHost && (
          <TouchableOpacity
            style={[
              styles.startButton,
              (isStarting || roomState.players.length < 2) && styles.startButtonDisabled,
            ]}
            onPress={handleStartGame}
            disabled={isStarting || roomState.players.length < 2}
          >
            {isStarting ? (
              <ActivityIndicator color="#1a1a1a" />
            ) : (
              <Text style={styles.startButtonText}>
                {roomState.players.length < 2 ? 'Waiting for Players...' : 'Start Game'}
              </Text>
            )}
          </TouchableOpacity>
        )}

        {!isHost && (
          <View style={styles.waitingContainer}>
            <Text style={styles.waitingText}>Waiting for host to start...</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function PlayerCard({ player, isMe }: { player: Player; isMe: boolean }) {
  const colorInfo = COLOR_DISPLAY[player.color] || { name: player.color, hex: '#888' };

  return (
    <View style={[styles.playerCard, !player.connected && styles.playerCardDisconnected]}>
      <View style={[styles.playerColorCircle, { backgroundColor: colorInfo.hex }]} />
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>
          {player.displayName}
          {isMe && ' (You)'}
          {player.isHost && ' 👑'}
        </Text>
        <Text style={styles.playerColor}>{colorInfo.name}</Text>
      </View>
      {!player.connected && (
        <View style={styles.disconnectedBadge}>
          <Text style={styles.disconnectedText}>Offline</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  container: {
    flexGrow: 1,
    padding: 20,
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
    backgroundColor: '#4a3a1a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  reconnectingText: {
    color: '#FDD835',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    marginBottom: 24,
  },
  leaveButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  leaveButtonText: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '600',
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 8,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  code: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 4,
    fontFamily: 'monospace',
  },
  shareButton: {
    padding: 8,
  },
  shareButtonText: {
    fontSize: 16,
  },
  playersCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#D4AF37',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#D4AF37',
    marginBottom: 16,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3a3a3a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#4a4a4a',
  },
  playerCardDisconnected: {
    opacity: 0.6,
    borderColor: '#666',
  },
  playerColorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#D4AF37',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  playerColor: {
    fontSize: 14,
    color: '#aaa',
  },
  disconnectedBadge: {
    backgroundColor: '#4a2020',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  disconnectedText: {
    color: '#ff6b6b',
    fontSize: 12,
    fontWeight: '600',
  },
  emptySlot: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#3a3a3a',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptySlotText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  rulesCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#3a3a3a',
  },
  ruleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ruleLabel: {
    fontSize: 14,
    color: '#ccc',
  },
  ruleValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: '#D4AF37',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonDisabled: {
    opacity: 0.5,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  waitingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  waitingText: {
    fontSize: 16,
    color: '#888',
    fontStyle: 'italic',
  },
});
