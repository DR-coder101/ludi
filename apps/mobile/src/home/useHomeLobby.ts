import { useCallback, useEffect, useState } from 'react';
import { Share } from 'react-native';
import { useRouter } from 'expo-router';
import type { Leaderboard, LeaderboardScope, TownId } from '@ludi/protocol';
import { copyText } from '../components/lobby/clipboard';
import { loadLocalGame } from '../game/localGame';
import { leaveAppOnlineSession } from '../net/leaveAppSession';
import { socketManager } from '../net/socket';
import { historyService } from '../services/historyService';
import {
  createInviteRoom,
  fetchHomeFlags,
  fetchLeaderboard,
  fetchPrefs,
  fetchPresence,
  joinCasualMatch,
  updatePrefs,
} from '../services/homeService';
import { profileService } from '../services/profileService';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { storage } from '../utils/storage';
import {
  emptyLeaderboard,
  initialsFromName,
  isJoinCode,
  normalizeJoinCode,
  playStreakDays,
  profileLevel,
  profileTitle,
  shareInviteMessage,
  winCount,
} from './homeModel';
import type { HomeProfileChip } from '../components/home/HomeLanding';

const HOUSE_RULES = {
  maxConsecutiveSixes: 2 as const,
  extraRollOnCapture: false,
  blockadeCanMoveTogether: false as const,
  exactFinishBonus: false,
  playForPlacements: false,
};

export function useHomeLobby() {
  const router = useRouter();
  const { userId, isAuthenticated, createGuest, initializeAuth } = useAuthStore();
  const showToast = useToastStore((state) => state.showToast);

  const [profile, setProfile] = useState<HomeProfileChip>({
    name: 'Guest',
    title: null,
    level: 1,
    initials: 'GU',
  });
  const [streakDays, setStreakDays] = useState<number | null>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [ranked, setRanked] = useState(false);
  const [tab, setTab] = useState<LeaderboardScope>('weekly');
  const [hometown, setHometown] = useState<TownId | null>(null);
  const [tournamentNotify, setTournamentNotify] = useState(false);
  const [leaderboard, setLeaderboard] = useState<Leaderboard>(emptyLeaderboard('weekly', null, ''));
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [matching, setMatching] = useState(false);
  const [notifying, setNotifying] = useState(false);

  const ensureName = useCallback(async (): Promise<{ playerId: string | null; displayName: string }> => {
    let id = userId;
    if (!isAuthenticated) {
      await createGuest('Guest');
      id = useAuthStore.getState().userId;
    }
    return { playerId: id, displayName: profile.name || 'Guest' };
  }, [createGuest, isAuthenticated, profile.name, userId]);

  const refresh = useCallback(async () => {
    const [count, flags] = await Promise.all([
      fetchPresence().catch(() => 0),
      fetchHomeFlags().catch(() => ({ ranked: false })),
    ]);
    setOnlineCount(count);
    setRanked(flags.ranked);

    const id = useAuthStore.getState().userId;
    if (!id) {
      setLeaderboard(emptyLeaderboard(tab, hometown, ''));
      return;
    }

    const [prefs, matches, user] = await Promise.all([
      fetchPrefs(id).catch(() => ({ hometown: null, tournamentNotify: false })),
      historyService.getUserMatches(id).catch(() => []),
      profileService.getProfile(id).catch(() => null),
    ]);
    const nextHometown = prefs.hometown;
    setHometown(nextHometown);
    setTournamentNotify(prefs.tournamentNotify);
    const name = user?.displayName || 'Guest';
    setProfile({
      name,
      title: profileTitle(nextHometown, winCount(matches, id)),
      level: profileLevel(matches.length),
      initials: initialsFromName(name),
    });
    const streak = playStreakDays(matches, new Date());
    setStreakDays(streak > 0 ? streak : null);

    const board = await fetchLeaderboard({
      scope: tab,
      town: tab === 'town' ? nextHometown : null,
      playerId: id,
    }).catch(() => null);
    setLeaderboard(board ?? emptyLeaderboard(tab, nextHometown, ''));
  }, [hometown, tab]);

  useEffect(() => {
    void initializeAuth();
    void loadLocalGame(storage).then((saved) => {
      if (saved && saved.state.phase !== 'finished') {
        router.replace(`/game?colors=${saved.colors.join(',')}&resume=1`);
      }
    });
  }, [initializeAuth, router]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const enterRoom = useCallback(
    async (code: string, sessionToken?: string, playerId?: string) => {
      await socketManager.initialize();
      if (sessionToken) {
        await socketManager.saveSessionToken(sessionToken);
      }
      if (playerId) {
        await socketManager.savePlayerId(playerId);
      }
      socketManager.connect();
      router.push(`/lobby/${code}`);
    },
    [router],
  );

  const onCreateRoom = useCallback(async () => {
    setCreatingRoom(true);
    try {
      const { displayName } = await ensureName();
      const created = await createInviteRoom(displayName);
      if (!created.success || !created.code || !created.shareUrl) {
        showToast(created.error || 'Could not create a room', 'error');
        return;
      }
      const message = shareInviteMessage(created.code, created.shareUrl);
      try {
        await Share.share({ message, url: created.shareUrl });
      } catch {
        if (await copyText(message)) {
          showToast('Invite copied', 'success');
        }
      }
      await enterRoom(created.code, created.sessionToken, created.playerId);
    } catch {
      showToast('Connection failed. Check the server is running.', 'error');
    } finally {
      setCreatingRoom(false);
    }
  }, [ensureName, enterRoom, showToast]);

  const onJoinSubmit = useCallback(async () => {
    const code = normalizeJoinCode(joinCode);
    if (!isJoinCode(code)) {
      showToast('Enter a 5-character room code', 'error');
      return;
    }
    try {
      const { displayName } = await ensureName();
      await socketManager.initialize();
      const socket = socketManager.connect();
      const storedToken = socketManager.getSessionToken();
      await new Promise<void>((resolve, reject) => {
        socket.emit(
          'room:join',
          { roomCode: code, displayName, sessionToken: storedToken || undefined },
          async (response) => {
            if (!response.success) {
              reject(new Error(response.error || 'Failed to join'));
              return;
            }
            if (response.sessionToken) {
              await socketManager.saveSessionToken(response.sessionToken);
            }
            if (response.playerId) {
              await socketManager.savePlayerId(response.playerId);
            }
            resolve();
          },
        );
      });
      setJoinOpen(false);
      router.push(`/lobby/${code}`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to join', 'error');
    }
  }, [ensureName, joinCode, router, showToast]);

  const onQuickMatch = useCallback(async () => {
    setMatching(true);
    try {
      const { displayName } = await ensureName();
      const seated = await joinCasualMatch(displayName);
      if (!seated.success || !seated.code) {
        showToast(seated.error || 'No casual room yet', 'error');
        return;
      }
      await enterRoom(seated.code, seated.sessionToken, seated.playerId);
    } catch {
      showToast('Connection failed. Check the server is running.', 'error');
    } finally {
      setMatching(false);
    }
  }, [ensureName, enterRoom, showToast]);

  const onVsBots = useCallback(async () => {
    try {
      const { displayName } = await ensureName();
      await socketManager.initialize();
      const socket = socketManager.connect();
      await new Promise<void>((resolve, reject) => {
        socket.emit('room:create', { displayName, houseRules: HOUSE_RULES }, async (response) => {
          if (!response.success || !response.roomCode) {
            reject(new Error(response.error || 'Could not start vs bots'));
            return;
          }
          if (response.sessionToken) {
            await socketManager.saveSessionToken(response.sessionToken);
          }
          if (response.playerId) {
            await socketManager.savePlayerId(response.playerId);
          }
          router.push(`/lobby/${response.roomCode}`);
          resolve();
        });
      });
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not start vs bots', 'error');
    }
  }, [ensureName, router, showToast]);

  const onPassAndPlay = useCallback(async () => {
    await leaveAppOnlineSession();
    router.push('/local');
  }, [router]);

  const onPickHometown = useCallback(
    async (town: TownId) => {
      const { playerId } = await ensureName();
      if (!playerId) {
        return;
      }
      const prefs = await updatePrefs(playerId, { hometown: town });
      setHometown(prefs.hometown);
      setSettingsOpen(false);
      void refresh();
    },
    [ensureName, refresh],
  );

  const onNotifyTournaments = useCallback(async () => {
    setNotifying(true);
    try {
      const { playerId } = await ensureName();
      if (!playerId) {
        return;
      }
      const prefs = await updatePrefs(playerId, { tournamentNotify: true });
      setTournamentNotify(prefs.tournamentNotify);
    } catch {
      showToast('Could not save notify preference', 'error');
    } finally {
      setNotifying(false);
    }
  }, [ensureName, showToast]);

  return {
    profile,
    streakDays,
    onlineCount,
    ranked,
    tab,
    setTab,
    hometown,
    tournamentNotify,
    leaderboard,
    joinOpen,
    setJoinOpen,
    joinCode,
    setJoinCode,
    settingsOpen,
    setSettingsOpen,
    notesOpen,
    setNotesOpen,
    creatingRoom,
    matching,
    notifying,
    onCreateRoom,
    onJoinSubmit,
    onQuickMatch,
    onVsBots,
    onPassAndPlay,
    onPickHometown,
    onNotifyTournaments,
    goLobby: () => router.replace('/'),
    goRanks: () => router.push('/ranks'),
  };
}
