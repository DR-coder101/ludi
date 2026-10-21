import type { PlayerPrefs, TownId, UpdatePlayerPrefsPayload } from '@ludi/protocol';

export const EMPTY_PREFS: PlayerPrefs = {
  hometown: null,
  tournamentNotify: false,
};

export function createPlayerPrefsStore() {
  const byUser = new Map<string, PlayerPrefs>();

  function get(userId: string): PlayerPrefs {
    return byUser.get(userId) ?? { ...EMPTY_PREFS };
  }

  function put(userId: string, patch: UpdatePlayerPrefsPayload): PlayerPrefs {
    const current = get(userId);
    const next: PlayerPrefs = {
      hometown: patch.hometown !== undefined ? patch.hometown : current.hometown,
      tournamentNotify:
        patch.tournamentNotify !== undefined ? patch.tournamentNotify : current.tournamentNotify,
    };
    byUser.set(userId, next);
    return next;
  }

  function hometownOf(userId: string): TownId | null {
    return get(userId).hometown;
  }

  return { get, put, hometownOf };
}

export type PlayerPrefsStore = ReturnType<typeof createPlayerPrefsStore>;
