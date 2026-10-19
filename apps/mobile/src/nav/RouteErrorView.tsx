import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ErrorBoundaryProps } from 'expo-router';
import { color, font } from '../theme/tokens';
import { describeRouteError } from './routeError';

export function RouteErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const message = describeRouteError(error);
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>SOMETHING BROKE</Text>
      <Text style={styles.body}>{message}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Try again"
        onPress={() => {
          void retry();
        }}
        style={styles.button}
      >
        <Text style={styles.buttonText}>TRY AGAIN</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  title: {
    fontFamily: font.sticker,
    fontSize: 18,
    letterSpacing: 1.2,
    color: color.gold,
    textAlign: 'center',
  },
  body: {
    fontFamily: font.body,
    fontSize: 14,
    color: color.cream,
    textAlign: 'center',
  },
  button: {
    backgroundColor: color.gold,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    fontFamily: font.sticker,
    fontSize: 12,
    letterSpacing: 1,
    color: color.bg,
  },
});
