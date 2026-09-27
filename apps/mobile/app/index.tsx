import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import type { Color } from '@ludi/rules';
import { socketManager } from '../src/net/socket';
import { useAuthStore } from '../src/stores/authStore';
import { useToastStore } from '../src/stores/toastStore';
import { Toast } from '../src/components/Toast';
import { DancehallBackground } from '../src/components/DancehallBackground';
import { useDancehallFonts } from '../src/theme/fonts';
import { colors, typography, spacing, radii, shadows } from '../src/theme/tokens';

const COLORS_ARRAY: Color[] = ['red', 'green', 'yellow', 'blue'];
const COLOR_DISPLAY: Record<Color, { name: string; hex: string }> = {
  yellow: { name: 'Montego Bay', hex: colors.pieces.yellow },
  green: { name: 'Ocho Rios', hex: colors.pieces.green },
  blue: { name: 'Negril', hex: colors.pieces.blue },
  red: { name: 'Kingston', hex: colors.pieces.red },
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
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (mode === null) {
    return (
      <DancehallBackground>
        <ScrollView contentContainerStyle={styles.container}>
          <Toast
            visible={visible}
            message={message}
            type={type}
            duration={duration}
            onDismiss={hideToast}
          />
          <View style={styles.headerNav}>
            {isAuthenticated && (
              <>
                <TouchableOpacity
                  style={styles.navButton}
                  onPress={() => router.push('/profile')}
                >
                  <Text style={styles.navButtonText}>👤 Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.navButton}
                  onPress={() => router.push('/history')}
                >
                  <Text style={styles.navButtonText}>📜 History</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <Text style={styles.title}>LUDI</Text>
          <Text style={styles.subtitle}>Jamaican Dancehall Edition</Text>

          <View style={styles.modeContainer}>
            <TouchableOpacity
              style={styles.modeButton}
              onPress={handleQuickPlay}
            >
              <Text style={styles.modeButtonIcon}>🌐</Text>
              <Text style={styles.modeButtonText}>ONLINE PLAY</Text>
              <Text style={styles.modeButtonSubtext}>Link up with friends</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modeButton}
              onPress={() => setMode('local')}
            >
              <Text style={styles.modeButtonIcon}>👥</Text>
              <Text style={styles.modeButtonText}>PASS & PLAY</Text>
              <Text style={styles.modeButtonSubtext}>One device vibes</Text>
            </TouchableOpacity>
          </View>

          {!isAuthenticated && (
            <View style={styles.authPrompt}>
              <Text style={styles.authPromptText}>
                Sign up to save your progress and compete
              </Text>
              <View style={styles.authButtonRow}>
                <TouchableOpacity
                  style={styles.authButton}
                  onPress={() => router.push('/auth/signin')}
                >
                  <Text style={styles.authButtonText}>SIGN IN</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.authButton, styles.authButtonPrimary]}
                  onPress={() => router.push('/auth/signup')}
                >
                  <Text style={[styles.authButtonText, styles.authButtonTextPrimary]}>SIGN UP</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </DancehallBackground>
    );
  }

  if (mode === 'online') {
    return (
      <DancehallBackground>
        <ScrollView contentContainerStyle={styles.container}>
          <Toast
            visible={visible}
            message={message}
            type={type}
            duration={duration}
            onDismiss={hideToast}
          />
          <TouchableOpacity onPress={() => setMode(null)} style={styles.backButton}>
            <Text style={styles.backButtonText}>← BACK</Text>
          </TouchableOpacity>

          <Text style={styles.title}>ONLINE PLAY</Text>

          <View style={styles.setupCard}>
            <Text style={styles.sectionTitle}>YOUR NAME</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor={colors.textTertiary}
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
                <ActivityIndicator color={colors.textOnAccent} />
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
              placeholderTextColor={colors.textTertiary}
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
                <ActivityIndicator color={colors.accent} />
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
      <ScrollView contentContainerStyle={styles.container}>
        <Toast
          visible={visible}
          message={message}
          type={type}
          duration={duration}
          onDismiss={hideToast}
        />
        <TouchableOpacity onPress={() => setMode(null)} style={styles.backButton}>
          <Text style={styles.backButtonText}>← BACK</Text>
        </TouchableOpacity>

        <Text style={styles.title}>PASS & PLAY</Text>

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
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flexGrow: 1,
    padding: spacing.lg,
    alignItems: 'center',
  },
  headerNav: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  navButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  navButtonText: {
    color: colors.accent,
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fonts.bodySemiBold,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  backButtonText: {
    color: colors.accent,
    fontSize: typography.sizes.bodyMedium,
    fontFamily: typography.fonts.bodyBold,
    letterSpacing: typography.letterSpacing.wide,
  },
  title: {
    fontSize: typography.sizes.displayLarge,
    fontFamily: typography.fonts.display,
    textAlign: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    color: colors.accent,
    letterSpacing: typography.letterSpacing.widest,
    textShadowColor: colors.shadowGold,
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  subtitle: {
    fontSize: typography.sizes.bodyLarge,
    fontFamily: typography.fonts.bodySemiBold,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing['2xl'],
    letterSpacing: typography.letterSpacing.wider,
  },
  modeContainer: {
    width: '100%',
    maxWidth: 400,
    gap: spacing.md,
  },
  modeButton: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.accent,
    ...shadows.gold,
  },
  modeButtonIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  modeButtonText: {
    fontSize: typography.sizes.headingMedium,
    fontFamily: typography.fonts.heading,
    color: colors.accent,
    marginBottom: spacing.xs,
    letterSpacing: typography.letterSpacing.wider,
  },
  modeButtonSubtext: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fonts.body,
    color: colors.textSecondary,
  },
  setupCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.accent,
    ...shadows.gold,
  },
  sectionTitle: {
    fontSize: typography.sizes.bodyLarge,
    fontFamily: typography.fonts.heading,
    marginBottom: spacing.md,
    color: colors.accent,
    letterSpacing: typography.letterSpacing.wide,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    padding: spacing.md,
    fontSize: typography.sizes.bodyMedium,
    fontFamily: typography.fonts.body,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    alignItems: 'center',
    ...shadows.gold,
  },
  primaryButtonText: {
    fontSize: typography.sizes.bodyLarge,
    fontFamily: typography.fonts.heading,
    color: colors.textOnAccent,
    letterSpacing: typography.letterSpacing.wider,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.accent,
  },
  secondaryButtonText: {
    fontSize: typography.sizes.bodyLarge,
    fontFamily: typography.fonts.heading,
    color: colors.accent,
    letterSpacing: typography.letterSpacing.wider,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textTertiary,
    paddingHorizontal: spacing.md,
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fonts.bodySemiBold,
    letterSpacing: typography.letterSpacing.wider,
  },
  errorContainer: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fonts.body,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  playerButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  playerButtonSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  playerButtonText: {
    fontSize: typography.sizes.headingSmall,
    fontFamily: typography.fonts.heading,
    color: colors.textTertiary,
  },
  playerButtonTextSelected: {
    color: colors.textOnAccent,
  },
  colorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
    justifyContent: 'center',
  },
  colorCard: {
    alignItems: 'center',
    width: 100,
  },
  colorCircle: {
    width: 60,
    height: 60,
    borderRadius: radii.full,
    marginBottom: spacing.sm,
    borderWidth: 3,
    borderColor: colors.accent,
    ...shadows.md,
  },
  colorCircleNegril: {
    borderColor: colors.negrilSilver,
  },
  colorName: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fonts.bodySemiBold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  infoCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.border,
  },
  infoTitle: {
    fontSize: typography.sizes.bodyMedium,
    fontFamily: typography.fonts.heading,
    marginBottom: spacing.md,
    color: colors.accent,
    letterSpacing: typography.letterSpacing.wide,
  },
  infoText: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fonts.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  authPrompt: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginTop: spacing.lg,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  authPromptText: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fonts.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  authButtonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  authButton: {
    backgroundColor: 'transparent',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  authButtonPrimary: {
    backgroundColor: colors.accent,
  },
  authButtonText: {
    fontSize: typography.sizes.bodyMedium,
    fontFamily: typography.fonts.heading,
    color: colors.accent,
    letterSpacing: typography.letterSpacing.wide,
  },
  authButtonTextPrimary: {
    color: colors.textOnAccent,
  },
});
