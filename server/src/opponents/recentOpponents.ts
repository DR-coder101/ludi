import type { RecentOpponent } from '@ludi/protocol';

const DEFAULT_LIMIT = 20;

type OpponentRow = {
  id: string;
  displayName: string;
  lastPlayedAt: number;
};

export type RecentOpponentsStore = {
  recordMatch(playerIds: Array<{ id: string; displayName: string }>): void;
  list(viewerId: string, limit?: number): RecentOpponent[];
  block(viewerId: string, opponentId: string): boolean;
  remove(viewerId: string, opponentId: string): boolean;
};

export function createRecentOpponentsStore(): RecentOpponentsStore {
  const byViewer = new Map<string, OpponentRow[]>();
  const blocked = new Map<string, Set<string>>();
  const removed = new Map<string, Set<string>>();
  let recency = 0;

  function rowsFor(viewerId: string): OpponentRow[] {
    const existing = byViewer.get(viewerId);
    if (existing) {
      return existing;
    }
    const created: OpponentRow[] = [];
    byViewer.set(viewerId, created);
    return created;
  }

  function setFor(map: Map<string, Set<string>>, viewerId: string): Set<string> {
    const existing = map.get(viewerId);
    if (existing) {
      return existing;
    }
    const created = new Set<string>();
    map.set(viewerId, created);
    return created;
  }

  return {
    recordMatch(playerIds) {
      recency += 1;
      const playedAt = Date.now() + recency;
      for (const viewer of playerIds) {
        const rows = rowsFor(viewer.id);
        const gone = setFor(removed, viewer.id);
        let offset = 0;
        for (const other of playerIds) {
          if (other.id === viewer.id) {
            continue;
          }
          gone.delete(other.id);
          const at = playedAt + offset;
          offset += 1;
          const existing = rows.find((row) => row.id === other.id);
          if (existing) {
            existing.displayName = other.displayName;
            existing.lastPlayedAt = at;
          } else {
            rows.push({
              id: other.id,
              displayName: other.displayName,
              lastPlayedAt: at,
            });
          }
        }
      }
    },

    list(viewerId, limit = DEFAULT_LIMIT) {
      const gone = setFor(removed, viewerId);
      const blockedSet = setFor(blocked, viewerId);
      return rowsFor(viewerId)
        .filter((row) => !gone.has(row.id))
        .sort((a, b) => b.lastPlayedAt - a.lastPlayedAt)
        .slice(0, limit)
        .map((row) => ({
          id: row.id,
          displayName: row.displayName,
          blocked: blockedSet.has(row.id),
        }));
    },

    block(viewerId, opponentId) {
      const rows = rowsFor(viewerId);
      if (!rows.some((row) => row.id === opponentId)) {
        return false;
      }
      setFor(removed, viewerId).delete(opponentId);
      setFor(blocked, viewerId).add(opponentId);
      return true;
    },

    remove(viewerId, opponentId) {
      const rows = rowsFor(viewerId);
      if (!rows.some((row) => row.id === opponentId)) {
        return false;
      }
      setFor(removed, viewerId).add(opponentId);
      return true;
    },
  };
}
