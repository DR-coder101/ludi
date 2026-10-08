import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '../db/types.js';
import { ColorSchema, type Color, type HouseRules, type MatchHistory } from '@ludi/protocol';
import { createTtlCache, type TtlCache } from '../cache/ttlCache.js';
import { isPostgresUuid } from '../db/postgresUuid.js';

export interface MatchData {
  roomCode: string;
  startedAt: Date;
  endedAt: Date;
  winnerId: string | null;
  houseRules: HouseRules;
  players: Array<{
    userId: string | null;
    color: Color;
    finalPosition: number;
  }>;
}

export interface MatchHistoryService {
  saveMatch(match: MatchData): Promise<string>;
  getUserMatches(userId: string, limit?: number): Promise<MatchHistory[]>;
}

export const MATCH_HISTORY_CACHE_TTL_MS = 30_000;

export type MatchHistoryServiceOptions = {
  cache?: TtlCache<MatchHistory[]>;
  ttlMs?: number;
};

function historyCacheKey(userId: string, limit: number): string {
  return `match-history:${userId}:${limit}`;
}

function historyCachePrefix(userId: string): string {
  return `match-history:${userId}:`;
}

function houseRulesJson(rules: HouseRules): Json {
  return {
    maxConsecutiveSixes: rules.maxConsecutiveSixes,
    extraRollOnCapture: rules.extraRollOnCapture,
    blockadeCanMoveTogether: rules.blockadeCanMoveTogether,
    exactFinishBonus: rules.exactFinishBonus,
    playForPlacements: rules.playForPlacements,
  };
}

function placementsJson(players: MatchData['players']): Json {
  return players.map((player) => ({
    userId: isPostgresUuid(player.userId) ? player.userId : null,
    color: player.color,
    position: player.finalPosition,
  }));
}

type StoredPlacement = {
  userId: string | null;
  color: Color;
  position: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parsePlacements(raw: unknown): StoredPlacement[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const placements: StoredPlacement[] = [];
  for (const row of raw) {
    if (!isRecord(row)) {
      continue;
    }
    const color = ColorSchema.safeParse(row.color);
    if (!color.success) {
      continue;
    }
    if (typeof row.position !== 'number' || !Number.isFinite(row.position)) {
      continue;
    }
    if (row.userId !== null && typeof row.userId !== 'string') {
      continue;
    }
    placements.push({
      userId: row.userId,
      color: color.data,
      position: row.position,
    });
  }
  return placements;
}

function winnerIsBotFromPlacements(
  winnerId: string | null,
  placements: StoredPlacement[],
): boolean {
  if (isPostgresUuid(winnerId)) {
    return false;
  }
  const first = placements.find((placement) => placement.position === 1);
  if (!first) {
    return false;
  }
  return first.userId === null;
}

export function createMatchHistoryService(
  supabase: SupabaseClient<Database>,
  options: MatchHistoryServiceOptions = {}
): MatchHistoryService {
  const cache =
    options.cache ??
    createTtlCache<MatchHistory[]>({
      ttlMs: options.ttlMs ?? MATCH_HISTORY_CACHE_TTL_MS,
    });

  function invalidateUserHistory(userId: string): void {
    const prefix = historyCachePrefix(userId);
    cache.deleteWhere((key) => key.startsWith(prefix));
  }

  return {
    async saveMatch(match: MatchData) {
      let roomId: string | null = null;

      const { data: existingRoom } = await supabase
        .from('rooms')
        .select('id')
        .eq('code', match.roomCode)
        .single();

      if (existingRoom) {
        roomId = existingRoom.id;
      } else {
        const { data: newRoom, error: roomError } = await supabase
          .from('rooms')
          .insert({
            code: match.roomCode,
            house_rules: houseRulesJson(match.houseRules),
            status: 'finished',
          })
          .select()
          .single();

        if (roomError || !newRoom) {
          throw new Error('Failed to create room record');
        }

        roomId = newRoom.id;
      }

      const attributedPlayers = match.players.filter(
        (p): p is { userId: string; color: Color; finalPosition: number } => isPostgresUuid(p.userId),
      );
      const winnerId = isPostgresUuid(match.winnerId) ? match.winnerId : null;

      const { data: matchRecord, error: matchError } = await supabase
        .from('matches')
        .insert({
          room_id: roomId,
          started_at: match.startedAt.toISOString(),
          ended_at: match.endedAt.toISOString(),
          winner_id: winnerId,
          house_rules: houseRulesJson(match.houseRules),
          placements: placementsJson(match.players),
        })
        .select()
        .single();

      if (matchError || !matchRecord) {
        throw new Error('Failed to create match record');
      }

      const matchPlayers = attributedPlayers.map(p => ({
        match_id: matchRecord.id,
        user_id: p.userId,
        color: p.color,
        final_position: p.finalPosition,
      }));

      if (matchPlayers.length > 0) {
        const { error: playersError } = await supabase
          .from('match_players')
          .insert(matchPlayers);

        if (playersError) {
          throw new Error('Failed to save match players');
        }
      }

      for (const player of attributedPlayers) {
        invalidateUserHistory(player.userId);
      }

      return matchRecord.id;
    },

    async getUserMatches(userId: string, limit = 50) {
      const key = historyCacheKey(userId, limit);
      const cached = cache.get(key);
      if (cached) {
        return cached;
      }

      const { data, error } = await supabase
        .from('matches')
        .select('*, match_players!inner(*)')
        .eq('match_players.user_id', userId)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error('Failed to fetch match history');
      }

      const matchesWithPlayers: MatchHistory[] = await Promise.all(
        (data || []).map(async (match) => {
          const playerRows = [match.match_players].flat();
          const players = await Promise.all(
            playerRows.map(async (mp) => {
              const { data: user } = await supabase
                .from('users')
                .select('display_name')
                .eq('id', mp.user_id)
                .single();

              return {
                userId: mp.user_id,
                displayName: user?.display_name || 'Unknown',
                color: mp.color as Color,
                finalPosition: mp.final_position,
              };
            })
          );

          return {
            id: match.id,
            startedAt: match.started_at,
            endedAt: match.ended_at,
            winnerId: match.winner_id,
            winnerIsBot: winnerIsBotFromPlacements(
              match.winner_id,
              parsePlacements(match.placements),
            ),
            houseRules: match.house_rules as HouseRules,
            players,
          };
        })
      );

      cache.set(key, matchesWithPlayers);
      return matchesWithPlayers;
    },
  };
}
