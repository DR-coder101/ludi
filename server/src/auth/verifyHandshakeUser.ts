import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../db/types.js';

function readAccessToken(handshakeAuth: unknown): string | null {
  if (handshakeAuth === null || typeof handshakeAuth !== 'object') {
    return null;
  }
  if (!('accessToken' in handshakeAuth)) {
    return null;
  }
  const accessToken = handshakeAuth.accessToken;
  if (typeof accessToken !== 'string' || accessToken.length === 0) {
    return null;
  }
  return accessToken;
}

export async function verifyHandshakeUser(
  supabase: SupabaseClient<Database> | null,
  handshakeAuth: unknown,
): Promise<string | null> {
  if (!supabase) {
    return null;
  }
  const accessToken = readAccessToken(handshakeAuth);
  if (accessToken === null) {
    return null;
  }
  try {
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error || !data.user?.id) {
      return null;
    }
    return data.user.id;
  } catch {
    return null;
  }
}
