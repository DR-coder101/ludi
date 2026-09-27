/**
 * Home Screen - Dancehall Premium UI
 * Matches approved mockup with vinyl hero, glossy pieces, gold CTA
 */

import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import type { Color } from '@ludi/rules';
import { socketManager } from '../src/net/socket';
import { useAuthStore } from '../src/stores/authStore';
import { useToastStore } from '../src/stores/toastStore';
import { Toast } from '../src/components/Toast';
import { DancehallBackground } from '../src/components/DancehallBackground';
import { VinylHero } from '../src/components/home/VinylHero';
import { PieceChips } from '../src/components/home/PieceChips';
import { useDancehallFonts } from '../src/theme/fonts';
import { colors, typography, spacing, radii, shadows } from '../src/theme/tokens';
import { Feather } from '@expo/vector-icons';

const COLORS_ARRAY: Color[] = ['red', 'green', 'yellow', 'blue'];
const COLOR_DISPLAY: Record<Color, { name: string; hex: string }> = {
  yellow: { name: 'Montego Bay', hex: colors.places.montegoGold },
  green: { name: 'Ocho Rios', hex: colors.places.ochoGreen },
  blue: { name: 'Negril', hex: colors.places.negrilBlack },
  red: { name: 'Kingston', hex: colors.places.kingstonRed },
};

export default function HomeScreen() {
  const router = useRouter();
  const { fontsLoaded, fontError } = useDancehallFonts();
  const { isAuthenticated, createGuest, isLoading: isAuthLoading, initializeAuth } = useAuthStore();
  const { visible, message, type, duration, showToast, hideToast } = useToastStore();
  const [mode, setMode] = useState<'online' | 'local' | null>(null);
  
  // Local game state
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(2);
  const [selectedColors, setSelectedColors] = useState<Color[]>(['red', 'green']);

  // Online game state
  const [displayName, setDisplayName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    initializeAuth();
  }, []);

  const handlePlayerCountChange = (count: 2 | 3 | 4) => {
    setPlayerCount(count);
    const colors = COLORS_ARRAY.slice(0, count);
    setSelectedColors(colors);
  };

  const handleStartLocalGame = () => {
    const colorsParam = selectedColors.join(',');
    router.push(`/game?colors=${colorsParam}`);
  };

  const handleCreateRoom = async () => {
    if (!displayName.trim()) {
      showToast('Please enter your name', 'error');
      return;
    }

    setError('');
    setIsCreatingRoom(true);

    try {
      await socketManager.initialize();
      const socket = socketManager.connect();

      socket.emit('room:create', {
        displayName: displayName.trim(),
        houseRules: {
          maxConsecutiveSixes: 2,
          extraRollOnCapture: false,
          blockadeCanMoveTogether: false,
          exactFinishBonus: false,
          playForPlacements: false,
        },
      }, async (response) => {
        setIsCreatingRoom(false);
        
        if (response.success && response.roomCode) {
          if (response.sessionToken) {
            await socketManager.saveSessionToken(response.sessionToken);
          }
          if (response.playerId) {
            await socketManager.savePlayerId(response.playerId);
          }
          router.push(`/lobby/${response.roomCode}`);
        } else {
          showToast(response.error || 'Failed to create room', 'error');
        }
      });
    } catch (err) {
      setIsCreatingRoom(false);
      showToast('Connection failed. Check server is running.', 'error');
      console.error('Create room error:', err);
    }
  };

  const handleJoinRoom = async () => {
    if (!displayName.trim()) {
      showToast('Please enter your name', 'error');
      return;
    }
    if (!roomCode.trim() || roomCode.trim().length !== 6) {
      showToast('Please enter a valid 6-character room code', 'error');
      return;
    }

    setError('');
    setIsJoiningRoom(true);

    try {
      await socketManager.initialize();
      const socket = socketManager.connect();

      const storedToken = socketManager.getSessionToken();
      
      socket.emit('room:join', {
        roomCode: roomCode.trim().toUpperCase(),
        displayName: displayName.trim(),
        sessionToken: storedToken || undefined,
      }, async (response) => {
        setIsJoiningRoom(false);
        
        if (response.success) {
          if (response.sessionToken) {
            await socketManager.saveSessionToken(response.sessionToken);
          }
          if (response.playerId) {
            await socketManager.savePlayerId(response.playerId);
          }
          router.push(`/lobby/${roomCode.trim().toUpperCase()}`);
        } else {
          showToast(response.error || 'Failed to join room', 'error');
        }
      });
    } catch (err) {
      setIsJoiningRoom(false);
      showToast('Connection failed. Check server is running.', 'error');
      console.error('Join room error:', err);
    }
  };

  const handleQuickPlay = async () => {
    if (!isAuthenticated && !isAuthLoading) {
      try {
        await createGuest();
      } catch (err) {
        console.error('Failed to create guest account:', err);
      }
    }
    setMode('online');
  };

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  if (mode === null) {
    return (
      <DancehallBackground>
        <StatusBar barStyle="light-content" />
        <ScrollView contentContainerStyle={styles.container}>
          <Toast
            visible={visible}
            message={message}
            type={type}
            duration={duration}
            onDismiss={hideToast}
          />

          {/* Vinyl Hero with Wordmark */}
          <VinylHero />

          {/* Piece Chips */}
          <View style={styles.piecesContainer}>
            <PieceChips />
          </View>

          {/* Mode Cards */}
          <View style={styles.cardsContainer}>
            {/* Gold CTA - Online Multiplayer */}
            <TouchableOpacity style={styles.goldCard} onPress={handleQuickPlay}>
              {/* Halftone texture overlay */}
              <View style={styles.halftoneOverlay} />
              
              <View style={styles.cardIcon}>
                <Feather name="globe" size={26} color={colors.gold} />
              </View>
              
              <View style={styles.cardContent}>
                <Text style={styles.goldCardTitle}>ONLINE MULTIPLAYER</Text>
                <Text style={styles.goldCardSubtitle}>Private rooms · voice & video</Text>
              </View>
              
              <View style={styles.cardArrow}>
                <Feather name="chevron-right" size={22} color={colors.bg} />
              </View>
            </TouchableOpacity>

            {/* Dark Card - Local Pass & Play */}
            <TouchableOpacity style={styles.darkCard} onPress={() => setMode('local')}>
              {/* Halftone texture overlay */}
              <View style={styles.halftoneOverlayDark} />
              
              <View style={styles.cardIconDark}>
                <Feather name="smartphone" size={26} color={colors.greenBright} />
              </View>
              
              <View style={styles.cardContent}>
                <Text style={styles.darkCardTitle}>LOCAL PASS & PLAY</Text>
                <Text style={styles.darkCardSubtitle}>One phone, 2–4 players</Text>
              </View>
              
              <View style={styles.cardArrow}>
                <Feather name="chevron-right" size={22} color={colors.greenBright} />
              </View>
            </TouchableOpacity>

            {/* Account prompt */}
            {!isAuthenticated && (
              <View style={styles.accountPrompt}>
                <Text style={styles.accountText}>
                  <Text style={styles.accountBold}>Save your wins.</Text> Create an account to keep your stats & friends.
                </Text>
                <View style={styles.accountButtons}>
                  <TouchableOpacity 
                    style={styles.signInButton}
                    onPress={() => router.push('/auth/signin')}
                  >
                    <Text style={styles.signInText}>SIGN IN</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.signUpButton}
                    onPress={() => router.push('/auth/signup')}
                  >
                    <Text style={styles.signUpText}>SIGN UP</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </DancehallBackground>
    );
  }

  if (mode === 'online') {
    return (
      <DancehallBackground>
        <StatusBar barStyle="light-content" />
        <ScrollView contentContainerStyle={styles.container}>
          <Toast
            visible={visible}
            message={message}
            type={type}
            duration={duration}
            onDismiss={hideToast}
          />
          <TouchableOpacity onPress={() => setMode(null)} style={styles.backButton}>
            <Feather name="arrow-left" size={20} color={colors.cream} />
            <Text style={styles.backButtonText}>BACK</Text>
          </TouchableOpacity>

          <Text style={styles.pageTitle}>ONLINE PLAY</Text>

          <View style={styles.setupCard}>
            <Text style={styles.sectionTitle}>YOUR NAME</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor={colors.textMuted}
              value={displayName}
              onChangeText={setDisplayName}
              maxLength={50}
              autoCapitalize="words"
            />

            <TouchableOpacity
              style={[styles.primaryButton, isCreatingRoom && styles.buttonDisabled]}
              onPress={handleCreateRoom}
              disabled={isCreatingRoom}
            >
              {isCreatingRoom ? (
                <ActivityIndicator color={colors.bg} />
              ) : (
                <Text style={styles.primaryButtonText}>CREATE ROOM</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <Text style={styles.sectionTitle}>JOIN ROOM</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 6-character code"
              placeholderTextColor={colors.textMuted}
              value={roomCode}
              onChangeText={(text) => setRoomCode(text.toUpperCase())}
              maxLength={6}
              autoCapitalize="characters"
            />

            <TouchableOpacity
              style={[styles.secondaryButton, isJoiningRoom && styles.buttonDisabled]}
              onPress={handleJoinRoom}
              disabled={isJoiningRoom}
            >
              {isJoiningRoom ? (
                <ActivityIndicator color={colors.green} />
              ) : (
                <Text style={styles.secondaryButtonText}>JOIN ROOM</Text>
              )}
            </TouchableOpacity>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </DancehallBackground>
    );
  }

  // Local mode
  return (
    <DancehallBackground>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.container}>
        <Toast
          visible={visible}
          message={message}
          type={type}
          duration={duration}
          onDismiss={hideToast}
        />
        <TouchableOpacity onPress={() => setMode(null)} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={colors.cream} />
          <Text style={styles.backButtonText}>BACK</Text>
        </TouchableOpacity>

        <Text style={styles.pageTitle}>PASS & PLAY</Text>

        <View style={styles.setupCard}>
          <Text style={styles.sectionTitle}>NUMBER OF PLAYERS</Text>
          <View style={styles.buttonRow}>
            {([2, 3, 4] as const).map((count) => (
              <TouchableOpacity
                key={count}
                style={[
                  styles.playerButton,
                  playerCount === count && styles.playerButtonSelected,
                ]}
                onPress={() => handlePlayerCountChange(count)}
              >
                <Text
                  style={[
                    styles.playerButtonText,
                    playerCount === count && styles.playerButtonTextSelected,
                  ]}
                >
                  {count}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>PLAYERS</Text>
          <View style={styles.colorsContainer}>
            {selectedColors.map((color) => (
              <View key={color} style={styles.colorCard}>
                <View
                  style={[
                    styles.colorCircle,
                    { backgroundColor: COLOR_DISPLAY[color].hex },
                    color === 'blue' && styles.colorCircleNegril,
                  ]}
                />
                <Text style={styles.colorName}>{COLOR_DISPLAY[color].name}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleStartLocalGame}>
            <Text style={styles.primaryButtonText}>START GAME</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>HOUSE RULES</Text>
          <Text style={styles.infoText}>• Max 2 consecutive sixes</Text>
          <Text style={styles.infoText}>• No extra roll on capture</Text>
          <Text style={styles.infoText}>• Winner takes all</Text>
        </View>
      </ScrollView>
    </DancehallBackground>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flexGrow: 1,
    paddingBottom: spacing.screenPadding * 2,
  },
  piecesContainer: {
    marginTop: 376,
    alignItems: 'center',
  },
  cardsContainer: {
    marginTop: 32,
    paddingHorizontal: spacing.screenPadding,
    gap: 10,
  },
  goldCard: {
    height: 80,
    borderRadius: radii.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 18,
    gap: 14,
    overflow: 'hidden',
    // Gold gradient (approximated with solid + shadows)
    backgroundColor: colors.gold,
    ...shadows.gold,
    // Inner highlight
    borderTopWidth: Platform.OS === 'ios' ? 1 : 0,
    borderTopColor: 'rgba(255,255,255,0.6)',
  },
  halftoneOverlay: {
    position: 'absolute',
    right: -20,
    top: -20,
    width: 170,
    height: 130,
    backgroundColor: 'rgba(0,0,0,0.14)',
    borderRadius: 85,
  },
  halftoneOverlayDark: {
    position: 'absolute',
    right: -20,
    top: -20,
    width: 170,
    height: 130,
    backgroundColor: 'rgba(0,155,58,0.22)',
    borderRadius: 85,
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconDark: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,155,58,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(25,196,90,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
  },
  goldCardTitle: {
    fontFamily: typography.fonts.display,
    fontSize: 25,
    letterSpacing: 0.6,
    lineHeight: 25,
    color: colors.bg,
    textTransform: 'uppercase',
  },
  goldCardSubtitle: {
    fontSize: 12.5,
    marginTop: 5,
    fontWeight: '500',
    color: colors.bg,
  },
  darkCard: {
    height: 80,
    borderRadius: radii.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 18,
    gap: 14,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.green,
    shadowColor: 'rgba(0,0,0,0.6)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 26,
    elevation: 10,
  },
  darkCardTitle: {
    fontFamily: typography.fonts.display,
    fontSize: 25,
    letterSpacing: 0.6,
    lineHeight: 25,
    color: colors.cream,
    textTransform: 'uppercase',
  },
  darkCardSubtitle: {
    fontSize: 12.5,
    marginTop: 5,
    fontWeight: '500',
    color: colors.textMuted,
  },
  cardArrow: {
    marginLeft: 'auto',
  },
  accountPrompt: {
    marginTop: 4,
    borderRadius: radii.card,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor: colors.surfaceLine,
  },
  accountText: {
    fontSize: 13,
    color: 'rgba(246,239,217,0.78)',
    textAlign: 'center',
    fontWeight: '500',
  },
  accountBold: {
    color: colors.cream,
  },
  accountButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  signInButton: {
    flex: 1,
    height: 46,
    borderRadius: radii.button,
    borderWidth: 1.5,
    borderColor: 'rgba(246,239,217,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInText: {
    fontFamily: typography.fonts.sticker,
    fontSize: 13,
    letterSpacing: 1,
    color: colors.cream,
    textTransform: 'uppercase',
  },
  signUpButton: {
    flex: 1,
    height: 46,
    borderRadius: radii.button,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0,155,58,0.35)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 6,
    // Inner highlight
    borderTopWidth: Platform.OS === 'ios' ? 1 : 0,
    borderTopColor: 'rgba(255,255,255,0.25)',
  },
  signUpText: {
    fontFamily: typography.fonts.sticker,
    fontSize: 13,
    letterSpacing: 1,
    color: '#fff',
    textTransform: 'uppercase',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 60,
    paddingLeft: spacing.screenPadding,
    paddingBottom: spacing.md,
  },
  backButtonText: {
    fontFamily: typography.fonts.sticker,
    fontSize: 13,
    letterSpacing: 1,
    color: colors.cream,
  },
  pageTitle: {
    fontFamily: typography.fonts.display,
    fontSize: 48,
    letterSpacing: 1,
    color: colors.gold,
    textAlign: 'center',
    marginBottom: spacing.lg,
    textTransform: 'uppercase',
    textShadowColor: colors.greenDeep,
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 0,
  },
  setupCard: {
    marginHorizontal: spacing.screenPadding,
    padding: spacing.lg,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceLine,
  },
  sectionTitle: {
    fontFamily: typography.fonts.sticker,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.cream,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  input: {
    height: 48,
    borderRadius: radii.button,
    borderWidth: 1.5,
    borderColor: colors.surfaceLine,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    fontWeight: '500',
    color: colors.cream,
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginBottom: spacing.md,
  },
  primaryButton: {
    height: 52,
    borderRadius: radii.buttonLarge,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.gold,
  },
  primaryButtonText: {
    fontFamily: typography.fonts.sticker,
    fontSize: 15,
    letterSpacing: 1.2,
    color: colors.bg,
    textTransform: 'uppercase',
  },
  secondaryButton: {
    height: 52,
    borderRadius: radii.buttonLarge,
    borderWidth: 2,
    borderColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontFamily: typography.fonts.sticker,
    fontSize: 15,
    letterSpacing: 1.2,
    color: colors.green,
    textTransform: 'uppercase',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.surfaceLine,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  errorContainer: {
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: radii.button,
    backgroundColor: 'rgba(228,32,46,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(228,32,46,0.3)',
  },
  errorText: {
    color: colors.red,
    fontSize: 13,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  playerButton: {
    flex: 1,
    height: 48,
    borderRadius: radii.button,
    borderWidth: 2,
    borderColor: colors.surfaceLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerButtonSelected: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(254,209,0,0.1)',
  },
  playerButtonText: {
    fontFamily: typography.fonts.sticker,
    fontSize: 20,
    color: colors.textMuted,
  },
  playerButtonTextSelected: {
    color: colors.gold,
  },
  colorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  colorCard: {
    flex: 1,
    minWidth: '45%',
    padding: spacing.md,
    borderRadius: radii.card,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: colors.surfaceLine,
    alignItems: 'center',
    gap: spacing.sm,
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  colorCircleNegril: {
    borderWidth: 2,
    borderColor: colors.silver,
  },
  colorName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.cream,
    textAlign: 'center',
  },
  infoCard: {
    marginHorizontal: spacing.screenPadding,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.card,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: colors.surfaceLine,
  },
  infoTitle: {
    fontFamily: typography.fonts.sticker,
    fontSize: 13,
    letterSpacing: 2,
    color: colors.gold,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
    fontWeight: '500',
  },
});
