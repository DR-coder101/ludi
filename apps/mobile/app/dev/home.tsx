import { Platform } from 'react-native';
import { Redirect, Stack, useRouter } from 'expo-router';
import { HomeLanding } from '../../src/components/home/HomeLanding';
import { emptyLeaderboard } from '../../src/home/homeModel';

const PHONE_INSETS = { top: 47, bottom: 34 };
const ENABLED = __DEV__ || process.env.EXPO_PUBLIC_DEV_ROUTES === '1';

export default function HomePreview() {
  const router = useRouter();

  if (!ENABLED) return <Redirect href="/" />;

  return (
    <HomeLanding
      profile={{ name: 'Guest', title: null, level: 1, initials: 'GU' }}
      streakDays={null}
      hasUnread={false}
      onlineCount={0}
      ranked={false}
      leaderboard={emptyLeaderboard('weekly', null, '2026-W43')}
      leaderboardTab="weekly"
      hometown={null}
      tournamentNotify={false}
      insets={Platform.OS === 'web' ? PHONE_INSETS : undefined}
      onCreateRoom={() => router.push('/')}
      onOpenJoin={() => undefined}
      onCloseJoin={() => undefined}
      onJoinCodeChange={() => undefined}
      onJoinSubmit={() => undefined}
      onQuickMatch={() => router.push('/')}
      onVsBots={() => router.push('/')}
      onPassAndPlay={() => router.push('/game?colors=red,green,yellow,blue')}
      onLeaderboardTab={() => undefined}
      onNotifyTournaments={() => undefined}
      onOpenSettings={() => undefined}
      onCloseSettings={() => undefined}
      onPickHometown={() => undefined}
      onOpenNotes={() => undefined}
      onCloseNotes={() => undefined}
      onLobby={() => router.push('/dev/home')}
      onRanks={() => router.push('/dev/home')}
    >
      <Stack.Screen options={{ headerShown: false }} />
    </HomeLanding>
  );
}
