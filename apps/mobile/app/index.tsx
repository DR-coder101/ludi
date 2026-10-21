import { Stack } from 'expo-router';
import { Toast } from '../src/components/Toast';
import { HomeLanding } from '../src/components/home/HomeLanding';
import { useHomeLobby } from '../src/home/useHomeLobby';
import { normalizeJoinCode } from '../src/home/homeModel';
import { useToastStore } from '../src/stores/toastStore';

export default function HomeScreen() {
  const home = useHomeLobby();
  const toast = useToastStore();

  return (
    <HomeLanding
      profile={home.profile}
      streakDays={home.streakDays}
      hasUnread={false}
      onlineCount={home.onlineCount}
      ranked={home.ranked}
      leaderboard={home.leaderboard}
      leaderboardTab={home.tab}
      hometown={home.hometown}
      tournamentNotify={home.tournamentNotify}
      joinOpen={home.joinOpen}
      joinCode={home.joinCode}
      settingsOpen={home.settingsOpen}
      notesOpen={home.notesOpen}
      creatingRoom={home.creatingRoom}
      matching={home.matching}
      notifying={home.notifying}
      onCreateRoom={() => void home.onCreateRoom()}
      onOpenJoin={() => home.setJoinOpen(true)}
      onCloseJoin={() => home.setJoinOpen(false)}
      onJoinCodeChange={(value) => home.setJoinCode(normalizeJoinCode(value))}
      onJoinSubmit={() => void home.onJoinSubmit()}
      onQuickMatch={() => void home.onQuickMatch()}
      onVsBots={() => void home.onVsBots()}
      onPassAndPlay={() => void home.onPassAndPlay()}
      onLeaderboardTab={home.setTab}
      onNotifyTournaments={() => void home.onNotifyTournaments()}
      onOpenSettings={() => home.setSettingsOpen(true)}
      onCloseSettings={() => home.setSettingsOpen(false)}
      onPickHometown={(town) => void home.onPickHometown(town)}
      onOpenNotes={() => home.setNotesOpen(true)}
      onCloseNotes={() => home.setNotesOpen(false)}
      onLobby={home.goLobby}
      onRanks={home.goRanks}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        duration={toast.duration}
        onDismiss={toast.hideToast}
      />
    </HomeLanding>
  );
}
