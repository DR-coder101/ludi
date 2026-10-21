import type {
  CasualMatchResponse,
  HomeFlagsResponse,
  InviteCreateResponse,
  Leaderboard,
  LeaderboardResponse,
  PlayerPrefs,
  PlayerPrefsResponse,
  PresenceResponse,
  TownId,
  UpdatePlayerPrefsPayload,
} from '@ludi/protocol';
import { resolveSocketServerUrl } from '../net/socketUrl';

const SERVER_URL = resolveSocketServerUrl();

function headers(playerId?: string | null): HeadersInit {
  const extra: Record<string, string> = { 'Content-Type': 'application/json' };
  if (playerId) {
    extra['x-ludi-player-id'] = playerId;
  }
  return extra;
}

export async function fetchPresence(): Promise<number> {
  const response = await fetch(`${SERVER_URL}/presence`);
  const data = (await response.json()) as PresenceResponse;
  if (!data.success || data.count == null) {
    return 0;
  }
  return data.count;
}

export async function fetchHomeFlags(): Promise<{ ranked: boolean }> {
  const response = await fetch(`${SERVER_URL}/home/flags`);
  const data = (await response.json()) as HomeFlagsResponse;
  return { ranked: data.success ? data.ranked : false };
}

export async function fetchLeaderboard(input: {
  scope: 'weekly' | 'town';
  town?: TownId | null;
  playerId?: string | null;
}): Promise<Leaderboard | null> {
  const url = new URL(`${SERVER_URL}/leaderboard`);
  url.searchParams.set('scope', input.scope);
  if (input.scope === 'town' && input.town) {
    url.searchParams.set('town', input.town);
  }
  const response = await fetch(url.toString(), { headers: headers(input.playerId) });
  const data = (await response.json()) as LeaderboardResponse;
  if (!data.success || !data.leaderboard) {
    return null;
  }
  return data.leaderboard;
}

export async function fetchPrefs(playerId: string): Promise<PlayerPrefs> {
  const response = await fetch(`${SERVER_URL}/prefs`, { headers: headers(playerId) });
  const data = (await response.json()) as PlayerPrefsResponse;
  if (!data.success || !data.prefs) {
    return { hometown: null, tournamentNotify: false };
  }
  return data.prefs;
}

export async function updatePrefs(playerId: string, patch: UpdatePlayerPrefsPayload): Promise<PlayerPrefs> {
  const response = await fetch(`${SERVER_URL}/prefs`, {
    method: 'PUT',
    headers: headers(playerId),
    body: JSON.stringify(patch),
  });
  const data = (await response.json()) as PlayerPrefsResponse;
  if (!data.success || !data.prefs) {
    throw new Error(data.error || 'Failed to save settings');
  }
  return data.prefs;
}

export async function createInviteRoom(displayName: string): Promise<InviteCreateResponse> {
  const response = await fetch(`${SERVER_URL}/invites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      displayName,
      houseRules: {
        maxConsecutiveSixes: 2,
        extraRollOnCapture: false,
        blockadeCanMoveTogether: false as const,
        exactFinishBonus: false,
        playForPlacements: false,
      },
    }),
  });
  return (await response.json()) as InviteCreateResponse;
}

export async function joinCasualMatch(displayName: string): Promise<CasualMatchResponse> {
  const response = await fetch(`${SERVER_URL}/matchmaking/casual`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName }),
  });
  return (await response.json()) as CasualMatchResponse;
}
