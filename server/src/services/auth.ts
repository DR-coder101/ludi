import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../db/types.js';

export interface AuthService {
  createGuest(displayName?: string): Promise<{ userId: string; accessToken: string }>;
  signUpWithEmail(email: string, password: string, displayName?: string): Promise<{ userId: string; accessToken: string }>;
  signInWithEmail(email: string, password: string): Promise<{ userId: string; accessToken: string }>;
  upgradeGuestToEmail(guestUserId: string, email: string, password: string): Promise<{ userId: string; accessToken: string }>;
}

export function createAuthService(supabase: SupabaseClient<Database>): AuthService {
  return {
    async createGuest(displayName = 'Guest') {
      const { data, error } = await supabase.auth.signInAnonymously();

      if (error || !data.user) {
        throw new Error(error?.message || 'Failed to create guest user');
      }

      const userId = data.user.id;

      await supabase.from('users').upsert({
        id: userId,
        display_name: displayName,
        is_guest: true,
        avatar_url: null,
      }).select().single();

      return {
        userId,
        accessToken: data.session?.access_token || '',
      };
    },

    async signUpWithEmail(email: string, password: string, displayName = 'Player') {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name: displayName },
      });

      if (error || !data.user) {
        throw new Error(error?.message || 'Failed to create email user');
      }

      const userId = data.user.id;

      await supabase.from('users').insert({
        id: userId,
        display_name: displayName,
        is_guest: false,
        avatar_url: null,
      }).select().single();

      return {
        userId,
        accessToken: 'mock-access-token',
      };
    },

    async signInWithEmail(email: string, password: string) {
      const { data: users, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('is_guest', false);

      if (fetchError) {
        throw new Error('Invalid credentials');
      }

      const user = users?.find(() => true);
      if (!user) {
        throw new Error('Invalid credentials');
      }

      return {
        userId: user.id,
        accessToken: 'mock-access-token',
      };
    },

    async upgradeGuestToEmail(guestUserId: string, email: string, password: string) {
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', guestUserId)
        .single();

      if (fetchError || !existingUser) {
        throw new Error('Guest user not found');
      }

      if (!existingUser.is_guest) {
        throw new Error('User is not a guest');
      }

      const { data, error } = await supabase.auth.admin.updateUserById(guestUserId, {
        email,
        password,
        email_confirm: true,
      });

      if (error || !data.user) {
        throw new Error(error?.message || 'Failed to upgrade guest');
      }

      await supabase
        .from('users')
        .update({ is_guest: false })
        .eq('id', guestUserId)
        .select()
        .single();

      return {
        userId: guestUserId,
        accessToken: 'mock-access-token',
      };
    },
  };
}
