import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../db/types.js';
import type { Color, HouseRules, MatchHistory } from '@ludi/protocol';

export interface MatchData {
  roomCode: string;
  startedAt: Date;
  endedAt: Date;
  winnerId: string;
  houseRules: HouseRules;
  players: Array<{
    userId: string;
    color: Color;
    finalPosition: number;
  }>;
}

export interface MatchHistoryService {
  saveMatch(match: MatchData): Promise<string>;
  getUserMatches(userId: string, limit?: number): Promise<MatchHistory[]>;
}

export function createMatchHistoryService(supabase: SupabaseClient<Database>): MatchHistoryService {
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
            house_rules: match.houseRules as any,
            status: 'finished',
          })
          .select()
          .single();

        if (roomError || !newRoom) {
          throw new Error('Failed to create room record');
        }

        roomId = newRoom.id;
      }

      const { data: matchRecord, error: matchError } = await supabase
        .from('matches')
        .insert({
          room_id: roomId,
          started_at: match.startedAt.toISOString(),
          ended_at: match.endedAt.toISOString(),
          winner_id: match.winnerId,
          house_rules: match.houseRules as any,
          placements: match.players.map(p => ({
            userId: p.userId,
            color: p.color,
            position: p.finalPosition,
          })) as any,
        })
        .select()
        .single();

      if (matchError || !matchRecord) {
        throw new Error('Failed to create match record');
      }

      const matchPlayers = match.players.map(p => ({
        match_id: matchRecord.id,
        user_id: p.userId,
        color: p.color,
        final_position: p.finalPosition,
      }));

      const { error: playersError } = await supabase
        .from('match_players')
        .insert(matchPlayers);

      if (playersError) {
        throw new Error('Failed to save match players');
      }

      return matchRecord.id;
    },

    async getUserMatches(userId: string, limit = 50) {
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
        (data || []).map(async (match: any) => {
          const players = await Promise.all(
            match.match_players.map(async (mp: any) => {
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
            houseRules: match.house_rules as HouseRules,
            players,
          };
        })
      );

      return matchesWithPlayers;
    },
  };
}
