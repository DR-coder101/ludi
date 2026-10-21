import { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import type { Color } from '@ludi/rules';
import { leaveAppOnlineSession } from '../src/net/leaveAppSession';
import { useToastStore } from '../src/stores/toastStore';
import { Toast } from '../src/components/Toast';
import { color, font } from '../src/theme/tokens';

const COLORS_ARRAY: Color[] = ['red', 'green', 'yellow', 'blue'];
const COLOR_DISPLAY: Record<Color, { name: string; hex: string }> = {
  red: { name: 'Kingston', hex: '#E53935' },
  green: { name: 'Negril', hex: '#43A047' },
  yellow: { name: 'Montego Bay', hex: '#FDD835' },
  blue: { name: 'Ocho Rios', hex: '#1E88E5' },
};

export default function LocalPlayScreen() {
  const router = useRouter();
  const toast = useToastStore();
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(2);
  const [selectedColors, setSelectedColors] = useState<Color[]>(['red', 'green']);

  const handlePlayerCountChange = (count: 2 | 3 | 4) => {
    setPlayerCount(count);
    setSelectedColors(COLORS_ARRAY.slice(0, count));
  };

  const handleStart = async () => {
    await leaveAppOnlineSession();
    router.push(`/game?colors=${selectedColors.join(',')}`);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        duration={toast.duration}
        onDismiss={toast.hideToast}
      />
      <Pressable onPress={() => router.back()} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Back">
        <Text style={styles.backButtonText}>← Back</Text>
      </Pressable>
      <Text style={styles.title}>Pass & Play</Text>
      <View style={styles.setupCard}>
        <Text style={styles.sectionTitle}>Number of players</Text>
        <View style={styles.buttonRow}>
          {([2, 3, 4] as const).map((count) => (
            <Pressable
              key={count}
              style={[styles.playerButton, playerCount === count && styles.playerButtonSelected]}
              onPress={() => handlePlayerCountChange(count)}
            >
              <Text style={[styles.playerButtonText, playerCount === count && styles.playerButtonTextSelected]}>
                {count}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.sectionTitle}>Seats</Text>
        <View style={styles.colorsContainer}>
          {selectedColors.map((seat) => (
            <View key={seat} style={styles.colorCard}>
              <View style={[styles.colorCircle, { backgroundColor: COLOR_DISPLAY[seat].hex }]} />
              <Text style={styles.colorName}>{COLOR_DISPLAY[seat].name}</Text>
            </View>
          ))}
        </View>
        <Pressable style={styles.primaryButton} onPress={() => void handleStart()}>
          <Text style={styles.primaryButtonText}>Start game</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: color.bg,
    padding: 20,
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginTop: 20,
    marginBottom: 10,
  },
  backButtonText: {
    color: color.gold,
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontFamily: font.display,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
    color: color.gold,
  },
  setupCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: color.card,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: color.gold,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: color.gold,
  },
  primaryButton: {
    backgroundColor: color.gold,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: color.bg,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  playerButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: color.surface,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: color.line,
  },
  playerButtonSelected: {
    backgroundColor: color.gold,
    borderColor: color.gold,
  },
  playerButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#888',
  },
  playerButtonTextSelected: {
    color: color.bg,
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
    borderColor: color.gold,
  },
  colorName: {
    fontSize: 12,
    fontWeight: '500',
    color: color.white,
    textAlign: 'center',
  },
});
