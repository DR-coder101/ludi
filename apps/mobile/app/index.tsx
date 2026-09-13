import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import type { Color } from '@ludi/rules';

const COLORS_ARRAY: Color[] = ['red', 'green', 'yellow', 'blue'];
const COLOR_DISPLAY: Record<Color, { name: string; hex: string }> = {
  red: { name: 'Red', hex: '#E53935' },
  green: { name: 'Green', hex: '#43A047' },
  yellow: { name: 'Yellow', hex: '#FDD835' },
  blue: { name: 'Blue', hex: '#1E88E5' },
};

export default function HomeScreen() {
  const router = useRouter();
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(2);
  const [selectedColors, setSelectedColors] = useState<Color[]>(['red', 'green']);

  const handlePlayerCountChange = (count: 2 | 3 | 4) => {
    setPlayerCount(count);
    const colors = COLORS_ARRAY.slice(0, count);
    setSelectedColors(colors);
  };

  const handleStartGame = () => {
    const colorsParam = selectedColors.join(',');
    router.push(`/game?colors=${colorsParam}`);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🎲 Ludi</Text>
      <Text style={styles.subtitle}>Caribbean Ludo - Local Pass & Play</Text>

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

        <TouchableOpacity style={styles.startButton} onPress={handleStartGame}>
          <Text style={styles.startButtonText}>Start Game</Text>
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
    backgroundColor: '#f5f5f5',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  setupCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
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
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
  },
  playerButtonSelected: {
    backgroundColor: '#2196F3',
  },
  playerButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
  },
  playerButtonTextSelected: {
    color: '#fff',
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
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  colorName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});
