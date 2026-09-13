import { StyleSheet, Text, View, ScrollView, useWindowDimensions } from 'react-native';
import { LudiBoard } from '../src/components/board/LudiBoard';

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const boardWidth = Math.min(width - 32, 500);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🎲 Ludi</Text>
      <Text style={styles.subtitle}>Caribbean Ludo - M2 Board Rendering</Text>
      
      <View style={styles.boardContainer}>
        <LudiBoard width={boardWidth} />
      </View>

      <Text style={styles.infoText}>
        Static board with 16 tokens in yards
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  boardContainer: {
    marginVertical: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
  },
});
