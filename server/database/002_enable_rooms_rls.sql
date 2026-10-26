-- Additive migration for existing Supabase projects.
-- Apply via SQL Editor (or future Supabase CLI). Safe to re-run.
-- Do not apply from CI or an agent. Dean reviews and applies after merge.
--
-- public.rooms shipped with RLS off, so the anon key could CRUD every room.
-- The mobile client never queries this table. All writes use the service role.
-- Enable RLS and add no anon or authenticated policies.
--
-- users UPDATE already required auth.uid() = id. Anonymous guest JWTs could
-- still write their own row. Guest play and match saves stay on the server
-- service role, which bypasses RLS. matches and match_players have no write
-- policies, so those tables already deny client inserts, updates, and deletes.

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (
    auth.uid() = id
    AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  )
  WITH CHECK (
    auth.uid() = id
    AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  );
