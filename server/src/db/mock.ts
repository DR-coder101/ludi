import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types.js';

export interface MockSupabaseStorage {
  users: Map<string, Database['public']['Tables']['users']['Row']>;
  rooms: Map<string, Database['public']['Tables']['rooms']['Row']>;
  matches: Map<string, Database['public']['Tables']['matches']['Row']>;
  match_players: Array<Database['public']['Tables']['match_players']['Row']>;
}

export function createMockSupabaseClient(storage: MockSupabaseStorage): SupabaseClient<Database> {
  const mockClient = {
    from: (table: string) => {
      if (table === 'users') {
        return {
          select: (columns?: string) => ({
            eq: (column: string, value: any) => ({
              single: async () => {
                const user = Array.from(storage.users.values()).find(u => u.id === value);
                return user
                  ? { data: user, error: null }
                  : { data: null, error: { message: 'Not found' } };
              },
            }),
          }),
          insert: (data: any) => ({
            select: () => ({
              single: async () => {
                const user = { ...data, created_at: new Date().toISOString() };
                storage.users.set(user.id, user);
                return { data: user, error: null };
              },
            }),
          }),
          update: (data: any) => ({
            eq: (column: string, value: any) => ({
              select: () => ({
                single: async () => {
                  const existing = storage.users.get(value);
                  if (!existing) {
                    return { data: null, error: { message: 'Not found' } };
                  }
                  const updated = { ...existing, ...data };
                  storage.users.set(value, updated);
                  return { data: updated, error: null };
                },
              }),
            }),
          }),
          upsert: (data: any) => ({
            select: () => ({
              single: async () => {
                const existing = storage.users.get(data.id);
                const user = existing ? { ...existing, ...data } : { ...data, created_at: new Date().toISOString() };
                storage.users.set(user.id, user);
                return { data: user, error: null };
              },
            }),
          }),
        };
      }

      if (table === 'rooms') {
        return {
          insert: (data: any) => ({
            select: () => ({
              single: async () => {
                const room = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...data };
                storage.rooms.set(room.id, room);
                return { data: room, error: null };
              },
            }),
          }),
          select: (columns?: string) => ({
            eq: (column: string, value: any) => ({
              single: async () => {
                const room = Array.from(storage.rooms.values()).find(r => r.code === value);
                return room
                  ? { data: room, error: null }
                  : { data: null, error: { message: 'Not found' } };
              },
            }),
          }),
        };
      }

      if (table === 'matches') {
        return {
          insert: (data: any) => ({
            select: () => ({
              single: async () => {
                const match = { 
                  id: crypto.randomUUID(), 
                  started_at: new Date().toISOString(),
                  ended_at: null,
                  room_id: null,
                  winner_id: null,
                  placements: [],
                  house_rules: {},
                  ...data 
                };
                storage.matches.set(match.id, match);
                return { data: match, error: null };
              },
            }),
          }),
          select: (columns?: string) => ({
            eq: (column: string, value: any) => ({
              order: (orderColumn: string, options?: any) => ({
                limit: (limitNum: number) => (async () => {
                  const allMatches = Array.from(storage.matches.values());
                  let filtered = allMatches;
                  
                  if (columns === '*, match_players!inner(*)') {
                    filtered = allMatches.filter(m => 
                      storage.match_players.some(mp => mp.match_id === m.id && mp.user_id === value)
                    );
                  }
                  
                  filtered.sort((a, b) => {
                    const aTime = new Date(a.started_at).getTime();
                    const bTime = new Date(b.started_at).getTime();
                    return options?.ascending ? aTime - bTime : bTime - aTime;
                  });
                  
                  const limited = filtered.slice(0, limitNum);
                  
                  const withPlayers = limited.map(m => ({
                    ...m,
                    match_players: storage.match_players.filter(mp => mp.match_id === m.id)
                  }));
                  
                  return { data: withPlayers, error: null };
                })(),
              }),
            }),
          }),
        };
      }

      if (table === 'match_players') {
        return {
          insert: (data: any) => (async () => {
            const rows = Array.isArray(data) ? data : [data];
            storage.match_players.push(...rows);
            return { data: rows, error: null };
          })(),
        };
      }

      return {};
    },
    auth: {
      admin: {
        createUser: async (data: any) => {
          const userId = crypto.randomUUID();
          const user = {
            id: userId,
            email: data.email,
            email_confirmed_at: new Date().toISOString(),
            user_metadata: data.user_metadata || {},
          };
          return { data: { user }, error: null };
        },
        updateUserById: async (id: string, data: any) => {
          return { data: { user: { id, ...data } }, error: null };
        },
      },
      signInAnonymously: async () => {
        const userId = crypto.randomUUID();
        const user = {
          id: userId,
          is_anonymous: true,
          user_metadata: {},
        };
        storage.users.set(userId, {
          id: userId,
          display_name: 'Guest',
          avatar_url: null,
          is_guest: true,
          created_at: new Date().toISOString(),
        });
        return { data: { user, session: { access_token: 'mock-token' } }, error: null };
      },
    },
  };

  return mockClient as unknown as SupabaseClient<Database>;
}

export function createMockStorage(): MockSupabaseStorage {
  return {
    users: new Map(),
    rooms: new Map(),
    matches: new Map(),
    match_players: [],
  };
}
