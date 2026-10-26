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

export function readBearerAccessToken(authorization: string | undefined): string | null {
  if (typeof authorization !== 'string') {
    return null;
  }
  const match = /^Bearer\s+(\S+)/i.exec(authorization);
  return match?.[1] ?? null;
}

export async function verifyAccessToken(
  supabase: SupabaseClient<Database> | null,
  accessToken: string | null,
): Promise<string | null> {
  if (!supabase || accessToken === null) {
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

export async function verifyHandshakeUser(
  supabase: SupabaseClient<Database> | null,
  handshakeAuth: unknown,
): Promise<string | null> {
  return verifyAccessToken(supabase, readAccessToken(handshakeAuth));
}
