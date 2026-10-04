-- Additive migration for existing Supabase projects.
-- Apply via SQL Editor (or future Supabase CLI). Safe to re-run.
--
-- Serves getUserMatches in server/src/services/matchHistory.ts:
--   .from('matches')
--   .select('*, match_players!inner(*)')
--   .eq('match_players.user_id', userId)
--   .order('started_at', { ascending: false })
--
-- match_players.user_id is already covered by idx_match_players_user.
-- This index covers the ORDER BY on matches.started_at.

CREATE INDEX IF NOT EXISTS idx_matches_started_at ON matches(started_at);
