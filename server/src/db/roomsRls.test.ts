import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { afterEach, describe, expect, it } from 'vitest';

const databaseDir = join(dirname(fileURLToPath(import.meta.url)), '../../database');
const schemaSql = readFileSync(join(databaseDir, 'schema.sql'), 'utf8');
const migrationSql = readFileSync(join(databaseDir, '002_enable_rooms_rls.sql'), 'utf8');
const roomsPolicy = /CREATE POLICY\s+"[^"]+"\s+ON rooms/i;

const ANON_ROLE = 'ludi_anon';
const SERVICE_ROLE = 'ludi_service';

const BOOTSTRAP_SQL = `
CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE auth.users (
  id uuid PRIMARY KEY
);

CREATE FUNCTION auth.jwt() RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
$$;

CREATE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(auth.jwt() ->> 'sub', '')::uuid
$$;

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Player',
  avatar_url TEXT,
  is_guest BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view any profile"
  ON users FOR SELECT
  USING (true);

CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  house_rules JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'lobby',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  winner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  placements JSONB NOT NULL DEFAULT '[]',
  house_rules JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE match_players (
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  color TEXT NOT NULL CHECK (color IN ('red', 'green', 'yellow', 'blue')),
  final_position INTEGER,
  PRIMARY KEY (match_id, user_id)
);
`;

const ROLE_SQL = `
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${ANON_ROLE}') THEN
    CREATE ROLE ${ANON_ROLE} NOLOGIN NOSUPERUSER NOBYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${SERVICE_ROLE}') THEN
    CREATE ROLE ${SERVICE_ROLE} NOLOGIN NOSUPERUSER BYPASSRLS;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO ${ANON_ROLE}, ${SERVICE_ROLE};
GRANT USAGE ON SCHEMA auth TO ${ANON_ROLE}, ${SERVICE_ROLE};
GRANT EXECUTE ON FUNCTION auth.jwt() TO ${ANON_ROLE}, ${SERVICE_ROLE};
GRANT EXECUTE ON FUNCTION auth.uid() TO ${ANON_ROLE}, ${SERVICE_ROLE};
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${ANON_ROLE}, ${SERVICE_ROLE};
`;

async function openProofDatabase(): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(BOOTSTRAP_SQL);
  await db.exec(migrationSql);
  await db.exec(ROLE_SQL);
  return db;
}

async function asRole<T>(
  db: PGlite,
  role: string,
  work: () => Promise<T>,
): Promise<T> {
  await db.exec(`SET ROLE ${role}`);
  try {
    return await work();
  } finally {
    await db.exec('RESET ROLE');
  }
}

describe('rooms row level security', () => {
  let db: PGlite | undefined;

  afterEach(async () => {
    if (db) {
      await db.close();
      db = undefined;
    }
  });

  it('enables rooms RLS in schema.sql and the additive migration with no client policies', () => {
    expect(schemaSql).toContain('ALTER TABLE rooms ENABLE ROW LEVEL SECURITY');
    expect(migrationSql).toContain('ALTER TABLE rooms ENABLE ROW LEVEL SECURITY');
    expect(schemaSql).not.toMatch(roomsPolicy);
    expect(migrationSql).not.toMatch(roomsPolicy);
  });

  it('keeps rooms hidden from anon and writable by a bypass role', async () => {
    db = await openProofDatabase();
    const client = db;

    const seeded = await asRole(client, SERVICE_ROLE, () =>
      client.query<{ id: string }>(
        `INSERT INTO rooms (code, status) VALUES ($1, $2) RETURNING id`,
        ['ABCD1', 'lobby'],
      ),
    );
    expect(seeded.rows).toEqual([{ id: expect.any(String) }]);
    const roomId = seeded.rows[0].id;

    const anonSelect = await asRole(client, ANON_ROLE, () =>
      client.query<{ count: string }>('SELECT count(*)::text AS count FROM rooms'),
    );
    expect(anonSelect.rows).toEqual([{ count: '0' }]);

    await expect(
      asRole(client, ANON_ROLE, () =>
        client.query(`INSERT INTO rooms (code, status) VALUES ($1, $2)`, ['LEAK1', 'lobby']),
      ),
    ).rejects.toThrow(/row-level security/i);

    const anonUpdate = await asRole(client, ANON_ROLE, () =>
      client.query(`UPDATE rooms SET status = $1 WHERE id = $2 RETURNING id`, ['hacked', roomId]),
    );
    expect(anonUpdate.rows).toEqual([]);

    const anonDelete = await asRole(client, ANON_ROLE, () =>
      client.query(`DELETE FROM rooms WHERE id = $1 RETURNING id`, [roomId]),
    );
    expect(anonDelete.rows).toEqual([]);

    const afterAnonWrites = await asRole(client, SERVICE_ROLE, () =>
      client.query<{ code: string; status: string }>('SELECT code, status FROM rooms'),
    );
    expect(afterAnonWrites.rows).toEqual([{ code: 'ABCD1', status: 'lobby' }]);

    const serviceUpdate = await asRole(client, SERVICE_ROLE, () =>
      client.query<{ status: string }>(
        `UPDATE rooms SET status = $1 WHERE id = $2 RETURNING status`,
        ['finished', roomId],
      ),
    );
    expect(serviceUpdate.rows).toEqual([{ status: 'finished' }]);

    const serviceInsert = await asRole(client, SERVICE_ROLE, () =>
      client.query<{ code: string }>(
        `INSERT INTO rooms (code, status) VALUES ($1, $2) RETURNING code`,
        ['EFGH2', 'lobby'],
      ),
    );
    expect(serviceInsert.rows).toEqual([{ code: 'EFGH2' }]);

    const serviceDelete = await asRole(client, SERVICE_ROLE, () =>
      client.query<{ code: string }>(`DELETE FROM rooms WHERE code = $1 RETURNING code`, ['EFGH2']),
    );
    expect(serviceDelete.rows).toEqual([{ code: 'EFGH2' }]);

    const remaining = await asRole(client, SERVICE_ROLE, () =>
      client.query<{ count: string }>('SELECT count(*)::text AS count FROM rooms'),
    );
    expect(remaining.rows).toEqual([{ count: '1' }]);
  }, 30000);

  it('rejects anonymous jwt profile writes and still allows the service role', async () => {
    db = await openProofDatabase();
    const client = db;

    const userId = '11111111-1111-1111-1111-111111111111';
    await client.exec(`INSERT INTO auth.users (id) VALUES ('${userId}')`);
    await asRole(client, SERVICE_ROLE, () =>
      client.query(`INSERT INTO users (id, display_name, is_guest) VALUES ($1, $2, $3)`, [
        userId,
        'Guest',
        true,
      ]),
    );

    await client.exec(
      `SELECT set_config('request.jwt.claims', '${JSON.stringify({
        sub: userId,
        is_anonymous: true,
      })}', false)`,
    );
    const guestUpdate = await asRole(client, ANON_ROLE, () =>
      client.query(`UPDATE users SET display_name = $1 WHERE id = $2 RETURNING display_name`, [
        'Hacked',
        userId,
      ]),
    );
    expect(guestUpdate.rows).toEqual([]);
    const stillGuest = await asRole(client, SERVICE_ROLE, () =>
      client.query<{ display_name: string }>(`SELECT display_name FROM users WHERE id = $1`, [
        userId,
      ]),
    );
    expect(stillGuest.rows).toEqual([{ display_name: 'Guest' }]);

    await client.exec(
      `SELECT set_config('request.jwt.claims', '${JSON.stringify({
        sub: userId,
        is_anonymous: false,
      })}', false)`,
    );
    const signedInUpdate = await asRole(client, ANON_ROLE, () =>
      client.query<{ display_name: string }>(
        `UPDATE users SET display_name = $1 WHERE id = $2 RETURNING display_name`,
        ['Pat', userId],
      ),
    );
    expect(signedInUpdate.rows).toEqual([{ display_name: 'Pat' }]);
    await client.exec(`SELECT set_config('request.jwt.claims', '', false)`);

    const serviceUpdate = await asRole(client, SERVICE_ROLE, () =>
      client.query<{ display_name: string; is_guest: boolean }>(
        `UPDATE users SET display_name = $1 WHERE id = $2 RETURNING display_name, is_guest`,
        ['GuestSaved', userId],
      ),
    );
    expect(serviceUpdate.rows).toEqual([{ display_name: 'GuestSaved', is_guest: true }]);
  }, 30000);
});
