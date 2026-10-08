import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types.js';

const SERVICE_ROLE_AUTH = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
} as const;

let supabaseClient: SupabaseClient<Database> | null = null;

function readServiceRoleConfig(): { url: string; serviceKey: string } {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  }

  return { url, serviceKey };
}

export function getSupabaseClient(): SupabaseClient<Database> {
  if (supabaseClient) {
    return supabaseClient;
  }

  const { url, serviceKey } = readServiceRoleConfig();
  supabaseClient = createClient<Database>(url, serviceKey, SERVICE_ROLE_AUTH);
  return supabaseClient;
}

export function createThrowawayAuthClient(): SupabaseClient<Database> {
  const { url, serviceKey } = readServiceRoleConfig();
  return createClient<Database>(url, serviceKey, SERVICE_ROLE_AUTH);
}

export function resetSupabaseClient(): void {
  supabaseClient = null;
}
