import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import type { Color } from '@ludi/rules';
import { socketManager } from '../src/net/socket';
import { useAuthStore } from '../src/stores/authStore';
import { useToastStore } from '../src/stores/toastStore';
import { Toast } from '../src/components/Toast';

const COLORS_ARRAY: Color[] = ['red', 'green', 'yellow', 'blue'];
const COLOR_DISPLAY: Record<Color, { name: string; hex: string }> = {
  red: { name: 'Red', hex: '#E53935' },
  green: { name: 'Green', hex: '#43A047' },
  yellow: { name: 'Yellow', hex: '#FDD835' },
  blue: { name: 'Blue', hex: '#1E88E5' },
};

export default function HomeScreen() {
  const router = useRouter();
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

  if (mode === null) {
    return (
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

        <Text style={styles.title}>🎲 Ludi</Text>
        <Text style={styles.subtitle}>Caribbean Ludo</Text>

        <View style={styles.modeContainer}>
          <TouchableOpacity
            style={styles.modeButton}
            onPress={handleQuickPlay}
          >
            <Text style={styles.modeButtonIcon}>🌐</Text>
            <Text style={styles.modeButtonText}>Online Multiplayer</Text>
            <Text style={styles.modeButtonSubtext}>Play with friends online</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modeButton}
            onPress={() => setMode('local')}
          >
            <Text style={styles.modeButtonIcon}>👥</Text>
            <Text style={styles.modeButtonText}>Local Pass & Play</Text>
            <Text style={styles.modeButtonSubtext}>Play on one device</Text>
          </TouchableOpacity>
        </View>

        {!isAuthenticated && (
          <View style={styles.authPrompt}>
            <Text style={styles.authPromptText}>
              Create an account to save your progress
            </Text>
            <View style={styles.authButtonRow}>
              <TouchableOpacity
                style={styles.authButton}
                onPress={() => router.push('/auth/signin')}
              >
                <Text style={styles.authButtonText}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.authButton}
                onPress={() => router.push('/auth/signup')}
              >
                <Text style={styles.authButtonText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    );
  }

  if (mode === 'online') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Toast
          visible={visible}
          message={message}
          type={type}
          duration={duration}
          onDismiss={hideToast}
        />
        <TouchableOpacity onPress={() => setMode(null)} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>🌐 Online Play</Text>

        <View style={styles.setupCard}>
          <Text style={styles.sectionTitle}>Your Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            placeholderTextColor="#888"
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
              <ActivityIndicator color="#1a1a1a" />
            ) : (
              <Text style={styles.primaryButtonText}>Create Room</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <Text style={styles.sectionTitle}>Join Room</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter 6-character room code"
            placeholderTextColor="#888"
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
              <ActivityIndicator color="#D4AF37" />
            ) : (
              <Text style={styles.secondaryButtonText}>Join Room</Text>
            )}
          </TouchableOpacity>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    );
  }

  // Local mode
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Toast
        visible={visible}
        message={message}
        type={type}
        duration={duration}
        onDismiss={hideToast}
      />
      <TouchableOpacity onPress={() => setMode(null)} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>👥 Local Play</Text>

      <View style={styles.setupCard}>
        <Text style={styles.sectionTitle}>Number of Players</Text>
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

        <Text style={styles.sectionTitle}>Players</Text>
        <View style={styles.colorsContainer}>
          {selectedColors.map((color) => (
            <View key={color} style={styles.colorCard}>
              <View
                style={[
                  styles.colorCircle,
                  { backgroundColor: COLOR_DISPLAY[color].hex },
                ]}
              />
              <Text style={styles.colorName}>{COLOR_DISPLAY[color].name}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleStartLocalGame}>
          <Text style={styles.primaryButtonText}>Start Game</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>House Rules</Text>
        <Text style={styles.infoText}>• Max 2 consecutive sixes</Text>
        <Text style={styles.infoText}>• No extra roll on capture</Text>
        <Text style={styles.infoText}>• Winner takes all (no placements)</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
    alignItems: 'center',
  },
  headerNav: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    gap: 12,
    marginTop: 20,
    marginBottom: 10,
  },
  navButton: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  navButtonText: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginTop: 20,
    marginBottom: 10,
  },
  backButtonText: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
    color: '#D4AF37',
  },
  subtitle: {
    fontSize: 16,
    color: '#D4AF37',
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '500',
  },
  modeContainer: {
    width: '100%',
    maxWidth: 400,
    gap: 16,
  },
  modeButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D4AF37',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modeButtonIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  modeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 4,
  },
  modeButtonSubtext: {
    fontSize: 14,
    color: '#ccc',
  },
  setupCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#D4AF37',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#D4AF37',
  },
  input: {
    backgroundColor: '#3a3a3a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#4a4a4a',
  },
  primaryButton: {
    backgroundColor: '#D4AF37',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D4AF37',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#4a4a4a',
  },
  dividerText: {
    color: '#888',
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#4a2020',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E53935',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  playerButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#3a3a3a',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4a4a4a',
  },
  playerButtonSelected: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  playerButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#888',
  },
  playerButtonTextSelected: {
    color: '#1a1a1a',
  },
  colorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  colorCard: {
    alignItems: 'center',
    width: 80,
  },
  colorCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
    borderWidth: 3,
    borderColor: '#D4AF37',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  colorName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  infoCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#3a3a3a',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#D4AF37',
  },
  infoText: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 4,
  },
  authPrompt: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#3a3a3a',
    alignItems: 'center',
  },
  authPromptText: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 16,
  },
  authButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  authButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D4AF37',
  },
  authButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
});
