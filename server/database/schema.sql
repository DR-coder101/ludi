-- Ludi Database Schema
-- Supabase PostgreSQL schema for M5.1
-- Apply this to your Supabase project via the SQL editor

-- Users table (synced with Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Player',
  avatar_url TEXT,
  is_guest BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read any user's profile
CREATE POLICY "Users can view any profile"
  ON users FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Rooms table (persistent record of game rooms)
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  house_rules JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'lobby',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Matches table (completed game records)
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  winner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  placements JSONB NOT NULL DEFAULT '[]',
  house_rules JSONB NOT NULL DEFAULT '{}'
);

-- Enable Row Level Security
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Users can read matches they participated in
CREATE POLICY "Users can view their matches"
  ON matches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM match_players
      WHERE match_players.match_id = matches.id
      AND match_players.user_id = auth.uid()
    )
  );

-- Match players table (who played in each match)
CREATE TABLE IF NOT EXISTS match_players (
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  color TEXT NOT NULL CHECK (color IN ('red', 'green', 'yellow', 'blue')),
  final_position INTEGER,
  PRIMARY KEY (match_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;

-- Users can read match_players for matches they're in
CREATE POLICY "Users can view match players"
  ON match_players FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM match_players mp
      WHERE mp.match_id = match_players.match_id
      AND mp.user_id = auth.uid()
    )
  );

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_matches_winner ON matches(winner_id);
CREATE INDEX IF NOT EXISTS idx_match_players_user ON match_players(user_id);
CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);
