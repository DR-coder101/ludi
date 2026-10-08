import { Stack } from 'expo-router';
import { registerLiveKitGlobals } from '../src/livekit/registerGlobals';

registerLiveKitGlobals();

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Ludi' }} />
    </Stack>
  );
}
