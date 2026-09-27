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
import { DancehallBackground } from '../../src/components/DancehallBackground';
import { useDancehallFonts } from '../../src/theme/fonts';
import { colors, typography, spacing, radii, shadows, PLACE_NAMES } from '../../src/theme/tokens';
import type { EngineColor } from '../../src/theme/tokens';

const COLOR_DISPLAY: Record<EngineColor, { name: string; hex: string; shortName: string }> = {
  yellow: { name: PLACE_NAMES.yellow, hex: colors.places.montegoGold, shortName: 'MOBAY' },
  green: { name: PLACE_NAMES.green, hex: colors.places.ochoGreen, shortName: 'OCHI' },
  blue: { name: PLACE_NAMES.blue, hex: colors.places.negrilBlack, shortName: 'NEGRIL' },
  red: { name: PLACE_NAMES.red, hex: colors.places.kingstonRed, shortName: 'KINGSTON' },
};

export default function LobbyScreen() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();
  const roomCode = code?.toUpperCase() || '';
  const { fontsLoaded, fontError } = useDancehallFonts();

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
  const [selectedTab, setSelectedTab] = useState<'create' | 'join'>('create');

  useEffect(() => {
    const socket = socketManager.getSocket();
    if (!socket) {
      router.replace('/');
      return;
    }

    const storedPlayerId = socketManager.getPlayerId();
    if (storedPlayerId) {
      setMyPlayerId(storedPlayerId);
    }
    setConnected(socket.connected);

    socket.on('room:state', (state) => {
      console.log('[Lobby] Room state update:', state);
      setRoomState(state);
      
      const storedPlayerId = socketManager.getPlayerId();
      if (storedPlayerId && state.players.some(p => p.id === storedPlayerId)) {
        setMyPlayerId(storedPlayerId);
      }
    });

    socket.on('game:state', (gameState) => {
      console.log('[Lobby] Game started, navigating to game screen');
      router.replace(`/game/${roomCode}`);
    });

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

    socket.on('player:connectionChanged', (playerId, connected) => {
      console.log(`[Lobby] Player ${playerId} connection: ${connected}`);
      updatePlayerConnection(playerId, connected);
    });

    return () => {
      socket.off('room:state');
      socket.off('game:state');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('player:connectionChanged');
    };
  }, []);

  const handleSelectColor = (color: EngineColor) => {
    if (!myPlayer) return;
    
    const socket = socketManager.getSocket();
    if (!socket) return;

    socket.emit('room:selectColor', { color }, (response) => {
      if (!response.success) {
        console.error('Failed to select color:', response.error);
      }
    });
  };

  const handleStartGame = () => {
    if (!isHost) return;
    
    const socket = socketManager.getSocket();
    if (!socket) return;

    setIsStarting(true);
    socket.emit('room:startGame', {}, (response) => {
      setIsStarting(false);
      if (!response.success) {
        console.error('Failed to start game:', response.error);
      }
    });
  };

  const handleShareRoomCode = async () => {
    try {
      await Share.share({
        message: `Join my Ludi game! Room code: ${roomCode}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleLeave = () => {
    const socket = socketManager.getSocket();
    if (socket) {
      socket.emit('room:leave');
    }
    router.replace('/');
  };

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!roomState) {
    return (
      <DancehallBackground>
        <SafeAreaView style={styles.container}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>LOADING ROOM...</Text>
        </SafeAreaView>
      </DancehallBackground>
    );
  }

  const connectedPlayers = roomState.players.filter(p => p.connected);
  const canStart = isHost && connectedPlayers.length >= 2 && connectedPlayers.length <= 4;

  // Group players by corner for 2x2 layout
  const corners = {
    topLeft: roomState.players.find(p => p.color === 'yellow'),     // MONTEGO BAY
    topRight: roomState.players.find(p => p.color === 'green'),     // OCHO RIOS
    bottomLeft: roomState.players.find(p => p.color === 'blue'),    // NEGRIL
    bottomRight: roomState.players.find(p => p.color === 'red'),    // KINGSTON
  };

  return (
    <DancehallBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleLeave} style={styles.backButton}>
              <Text style={styles.backButtonText}>← LEAVE</Text>
            </TouchableOpacity>
            
            <View style={styles.roomCodeContainer}>
              <Text style={styles.roomCodeLabel}>ROOM CODE</Text>
              <View style={styles.roomCodeBox}>
                {roomCode.split('').map((char, index) => (
                  <View key={index} style={styles.codeTile}>
                    <Text style={styles.codeTileText}>{char}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity onPress={handleShareRoomCode} style={styles.shareButton}>
                <Text style={styles.shareButtonText}>SHARE CODE</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Connection Status */}
          {!isConnected && (
            <View style={styles.connectionBanner}>
              <Text style={styles.connectionBannerText}>⚠️ RECONNECTING...</Text>
            </View>
          )}

          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'create' && styles.tabActive]}
              onPress={() => setSelectedTab('create')}
            >
              <Text style={[styles.tabText, selectedTab === 'create' && styles.tabTextActive]}>
                SETUP
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'join' && styles.tabActive]}
              onPress={() => setSelectedTab('join')}
            >
              <Text style={[styles.tabText, selectedTab === 'join' && styles.tabTextActive]}>
                PLAYERS ({connectedPlayers.length}/4)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content based on tab */}
          {selectedTab === 'create' ? (
            <>
              {/* 2x2 Corner Picker */}
              <View style={styles.cornerPickerContainer}>
                <Text style={styles.sectionTitle}>PICK YOUR CORNER</Text>
                <View style={styles.cornerGrid}>
                  {/* Top row */}
                  <View style={styles.cornerRow}>
                    {/* Top-left: Montego Bay (yellow) */}
                    <TouchableOpacity
                      style={[
                        styles.cornerCell,
                        corners.topLeft && styles.cornerCellTaken,
                        corners.topLeft?.id === myPlayer?.id && styles.cornerCellMine,
                      ]}
                      onPress={() => handleSelectColor('yellow')}
                      disabled={!!corners.topLeft && corners.topLeft.id !== myPlayer?.id}
                    >
                      <View style={[styles.cornerIndicator, { backgroundColor: COLOR_DISPLAY.yellow.hex }]} />
                      <Text style={styles.cornerName}>{COLOR_DISPLAY.yellow.shortName}</Text>
                      {corners.topLeft && (
                        <Text style={styles.cornerPlayer}>{corners.topLeft.displayName}</Text>
                      )}
                      {!corners.topLeft && <Text style={styles.cornerEmpty}>AVAILABLE</Text>}
                    </TouchableOpacity>

                    {/* Top-right: Ocho Rios (green) */}
                    <TouchableOpacity
                      style={[
                        styles.cornerCell,
                        corners.topRight && styles.cornerCellTaken,
                        corners.topRight?.id === myPlayer?.id && styles.cornerCellMine,
                      ]}
                      onPress={() => handleSelectColor('green')}
                      disabled={!!corners.topRight && corners.topRight.id !== myPlayer?.id}
                    >
                      <View style={[styles.cornerIndicator, { backgroundColor: COLOR_DISPLAY.green.hex }]} />
                      <Text style={styles.cornerName}>{COLOR_DISPLAY.green.shortName}</Text>
                      {corners.topRight && (
                        <Text style={styles.cornerPlayer}>{corners.topRight.displayName}</Text>
                      )}
                      {!corners.topRight && <Text style={styles.cornerEmpty}>AVAILABLE</Text>}
                    </TouchableOpacity>
                  </View>

                  {/* Bottom row */}
                  <View style={styles.cornerRow}>
                    {/* Bottom-left: Negril (blue/black) */}
                    <TouchableOpacity
                      style={[
                        styles.cornerCell,
                        corners.bottomLeft && styles.cornerCellTaken,
                        corners.bottomLeft?.id === myPlayer?.id && styles.cornerCellMine,
                      ]}
                      onPress={() => handleSelectColor('blue')}
                      disabled={!!corners.bottomLeft && corners.bottomLeft.id !== myPlayer?.id}
                    >
                      <View style={[
                        styles.cornerIndicator,
                        { backgroundColor: COLOR_DISPLAY.blue.hex, borderColor: colors.negrilSilver }
                      ]} />
                      <Text style={styles.cornerName}>{COLOR_DISPLAY.blue.shortName}</Text>
                      {corners.bottomLeft && (
                        <Text style={styles.cornerPlayer}>{corners.bottomLeft.displayName}</Text>
                      )}
                      {!corners.bottomLeft && <Text style={styles.cornerEmpty}>AVAILABLE</Text>}
                    </TouchableOpacity>

                    {/* Bottom-right: Kingston (red) */}
                    <TouchableOpacity
                      style={[
                        styles.cornerCell,
                        corners.bottomRight && styles.cornerCellTaken,
                        corners.bottomRight?.id === myPlayer?.id && styles.cornerCellMine,
                      ]}
                      onPress={() => handleSelectColor('red')}
                      disabled={!!corners.bottomRight && corners.bottomRight.id !== myPlayer?.id}
                    >
                      <View style={[styles.cornerIndicator, { backgroundColor: COLOR_DISPLAY.red.hex }]} />
                      <Text style={styles.cornerName}>{COLOR_DISPLAY.red.shortName}</Text>
                      {corners.bottomRight && (
                        <Text style={styles.cornerPlayer}>{corners.bottomRight.displayName}</Text>
                      )}
                      {!corners.bottomRight && <Text style={styles.cornerEmpty}>AVAILABLE</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Host Controls */}
              {isHost && (
                <View style={styles.hostControls}>
                  <TouchableOpacity
                    style={[styles.startButton, !canStart && styles.startButtonDisabled]}
                    onPress={handleStartGame}
                    disabled={!canStart || isStarting}
                  >
                    {isStarting ? (
                      <ActivityIndicator color={colors.textOnAccent} />
                    ) : (
                      <Text style={styles.startButtonText}>
                        {canStart ? 'START GAME' : 'NEED 2-4 PLAYERS'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {!isHost && (
                <View style={styles.waitingContainer}>
                  <Text style={styles.waitingText}>Waiting for host to start...</Text>
                </View>
              )}
            </>
          ) : (
            /* Players List Tab */
            <View style={styles.playersListContainer}>
              <Text style={styles.sectionTitle}>PLAYERS IN LOBBY</Text>
              {roomState.players.map((player) => (
                <View key={player.id} style={styles.playerCard}>
                  <View style={styles.playerInfo}>
                    <View style={[
                      styles.playerColorDot,
                      { backgroundColor: player.color ? COLOR_DISPLAY[player.color as EngineColor].hex : colors.textTertiary }
                    ]} />
                    <Text style={styles.playerName}>{player.displayName}</Text>
                    {player.id === myPlayer?.id && (
                      <Text style={styles.youBadge}>YOU</Text>
                    )}
                    {player.id === roomState.hostId && (
                      <Text style={styles.hostBadge}>HOST</Text>
                    )}
                  </View>
                  <Text style={[
                    styles.playerStatus,
                    player.connected ? styles.playerStatusConnected : styles.playerStatusDisconnected
                  ]}>
                    {player.connected ? '● ONLINE' : '● OFFLINE'}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </DancehallBackground>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  header: {
    marginBottom: spacing.xl,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  backButtonText: {
    color: colors.accent,
    fontSize: typography.sizes.bodyMedium,
    fontFamily: typography.fonts.bodyBold,
    letterSpacing: typography.letterSpacing.wide,
  },
  roomCodeContainer: {
    alignItems: 'center',
  },
  roomCodeLabel: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fonts.heading,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    letterSpacing: typography.letterSpacing.wider,
  },
  roomCodeBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  codeTile: {
    width: 48,
    height: 60,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.gold,
  },
  codeTileText: {
    fontSize: typography.sizes.headingLarge,
    fontFamily: typography.fonts.heading,
    color: colors.accent,
    letterSpacing: typography.letterSpacing.wide,
  },
  shareButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  shareButtonText: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fonts.heading,
    color: colors.accent,
    letterSpacing: typography.letterSpacing.wide,
  },
  connectionBanner: {
    backgroundColor: colors.warning,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  connectionBannerText: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fonts.bodyBold,
    color: colors.textOnAccent,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: typography.sizes.bodyMedium,
    fontFamily: typography.fonts.heading,
    color: colors.accent,
    marginTop: spacing.md,
    letterSpacing: typography.letterSpacing.wider,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.accent,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.accent,
  },
  tabText: {
    fontSize: typography.sizes.bodyMedium,
    fontFamily: typography.fonts.heading,
    color: colors.accent,
    letterSpacing: typography.letterSpacing.wide,
  },
  tabTextActive: {
    color: colors.textOnAccent,
  },
  sectionTitle: {
    fontSize: typography.sizes.headingSmall,
    fontFamily: typography.fonts.heading,
    color: colors.accent,
    marginBottom: spacing.lg,
    textAlign: 'center',
    letterSpacing: typography.letterSpacing.wider,
  },
  cornerPickerContainer: {
    marginBottom: spacing.xl,
  },
  cornerGrid: {
    gap: spacing.md,
  },
  cornerRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cornerCell: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  cornerCellTaken: {
    borderColor: colors.accent,
  },
  cornerCellMine: {
    backgroundColor: colors.surfaceElevated,
    ...shadows.gold,
  },
  cornerIndicator: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    marginBottom: spacing.sm,
    borderWidth: 3,
    borderColor: colors.accent,
  },
  cornerName: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fonts.heading,
    color: colors.accent,
    marginBottom: spacing.xs,
    textAlign: 'center',
    letterSpacing: typography.letterSpacing.wide,
  },
  cornerPlayer: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fonts.bodySemiBold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  cornerEmpty: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fonts.body,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  hostControls: {
    marginTop: spacing.lg,
  },
  startButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.lg,
    borderRadius: radii.xl,
    alignItems: 'center',
    ...shadows.gold,
  },
  startButtonDisabled: {
    opacity: 0.5,
  },
  startButtonText: {
    fontSize: typography.sizes.headingSmall,
    fontFamily: typography.fonts.heading,
    color: colors.textOnAccent,
    letterSpacing: typography.letterSpacing.wider,
  },
  waitingContainer: {
    marginTop: spacing.xl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  waitingText: {
    fontSize: typography.sizes.bodyMedium,
    fontFamily: typography.fonts.body,
    color: colors.textSecondary,
  },
  playersListContainer: {
    marginTop: spacing.md,
  },
  playerCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  playerColorDot: {
    width: 24,
    height: 24,
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  playerName: {
    fontSize: typography.sizes.bodyMedium,
    fontFamily: typography.fonts.bodySemiBold,
    color: colors.textPrimary,
    flex: 1,
  },
  youBadge: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fonts.bodyBold,
    color: colors.accent,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: radii.sm,
  },
  hostBadge: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fonts.bodyBold,
    color: colors.textOnAccent,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: radii.sm,
  },
  playerStatus: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fonts.bodySemiBold,
  },
  playerStatusConnected: {
    color: colors.success,
  },
  playerStatusDisconnected: {
    color: colors.textTertiary,
  },
});
