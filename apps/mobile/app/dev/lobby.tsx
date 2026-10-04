import { useState } from 'react';
import { Platform } from 'react-native';
import { Redirect, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { LobbyRoom } from '../../src/components/lobby/LobbyRoom';
import { lobbySeats, roomNote, startCta } from '../../src/components/lobby/lobbyModel';
import { MOCKUP_LOBBY, ROOM_FIXTURE } from '../../src/dev/lobbyFixtures';

/** iPhone 14 safe area, so web screenshots line up with the 390×844 mockup. */
const PHONE_INSETS = { top: 47, bottom: 34 };
const ENABLED = __DEV__ || process.env.EXPO_PUBLIC_DEV_ROUTES === '1';

/**
 * Visual QA for the lobby: /dev/lobby is lobby.png as drawn; ?state=host and
 * ?state=guest run a server-shaped RoomState through the live screen's mapping.
 */
export default function LobbyPreview() {
  const router = useRouter();
  const params = useLocalSearchParams<{ state?: string }>();
  const [voice, setVoice] = useState(true);
  const [video, setVideo] = useState(true);
  const [houseRules, setHouseRules] = useState(ROOM_FIXTURE.houseRules);

  if (!ENABLED) return <Redirect href="/" />;

  const live = params.state === 'host' || params.state === 'guest';
  const me = params.state === 'guest' ? 'shanice' : 'dean';
  const host = !live || me === ROOM_FIXTURE.hostId;
  const view = live
    ? {
        code: ROOM_FIXTURE.roomCode,
        seats: lobbySeats(ROOM_FIXTURE, me),
        note: roomNote(ROOM_FIXTURE.players.length, true),
        start: startCta(ROOM_FIXTURE.players.length, host),
      }
    : MOCKUP_LOBBY;

  return (
    <LobbyRoom
      {...view}
      host={host}
      voice={{ on: voice, onToggle: () => setVoice((v) => !v) }}
      video={{ on: video, onToggle: () => setVideo((v) => !v) }}
      houseRules={houseRules}
      onHouseRulesChange={host ? setHouseRules : undefined}
      onBack={() => router.push('/')}
      onCopy={() => {}}
      onShare={() => {}}
      onStart={() => router.push('/game?colors=red,green,blue')}
      insets={Platform.OS === 'web' ? PHONE_INSETS : undefined}
    >
      <Stack.Screen options={{ headerShown: false }} />
    </LobbyRoom>
  );
}
