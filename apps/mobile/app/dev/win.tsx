import { Platform } from 'react-native';
import { Redirect, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import type { Color } from '@ludi/rules';
import { WinScreen } from '../../src/components/win/WinScreen';
import { winView } from '../../src/components/win/winModel';
import { MOCKUP_ROOM, winFixture } from '../../src/dev/winFixtures';

/** iPhone 14 safe area, so web screenshots line up with the 390×844 mockup. */
const PHONE_INSETS = { top: 47, bottom: 34 };
const ENABLED = __DEV__ || process.env.EXPO_PUBLIC_DEV_ROUTES === '1';
const WINNERS: Color[] = ['red', 'green', 'yellow', 'blue'];

/**
 * Visual QA for the results screen. /dev/win is win.png as drawn (Dean wins for Kingston).
 * ?winner=green|yellow|blue puts another town on the poster, ?players=2|3 trims the table,
 * and ?room=none shows the pass-and-play kicker.
 */
export default function WinPreview() {
  const router = useRouter();
  const params = useLocalSearchParams<{ winner?: string; players?: string; room?: string }>();

  if (!ENABLED) return <Redirect href="/" />;

  const winner = WINNERS.find((c) => c === params.winner) ?? 'red';
  const players = Math.min(4, Math.max(2, Number(params.players) || 4));
  const fixture = winFixture(winner, players);
  const view = winView({ ...fixture, roomCode: params.room === 'none' ? null : MOCKUP_ROOM })!;

  return (
    <WinScreen
      view={view}
      onRematch={() => router.push('/game?colors=red,green,yellow,blue')}
      onLobby={() => router.push('/')}
      insets={Platform.OS === 'web' ? PHONE_INSETS : undefined}
    >
      <Stack.Screen options={{ headerShown: false }} />
    </WinScreen>
  );
}
