import { Stack } from 'expo-router';
import { useLudiFonts } from '../src/theme/fonts';

export default function RootLayout() {
  const fontsReady = useLudiFonts();
  if (!fontsReady) return null;

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Ludi' }} />
    </Stack>
  );
}
