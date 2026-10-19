import '../src/polyfills/weakref';
import { Stack } from 'expo-router';
import type { ErrorBoundaryProps } from 'expo-router';
import { registerLiveKitGlobals } from '../src/livekit/registerGlobals';
import { RouteErrorBoundary } from '../src/nav/RouteErrorView';

registerLiveKitGlobals();

export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <RouteErrorBoundary {...props} />;
}

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Ludi' }} />
    </Stack>
  );
}
