import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../db/types.js';
import type { UserProfile } from '@ludi/protocol';

export interface ProfileService {
  getProfile(userId: string): Promise<UserProfile>;
  updateProfile(userId: string, updates: { displayName?: string; avatarUrl?: string | null }): Promise<UserProfile>;
}

export function createProfileService(supabase: SupabaseClient<Database>): ProfileService {
  return {
    async getProfile(userId: string) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        throw new Error('User not found');
      }

      return {
        id: data.id,
        displayName: data.display_name,
        avatarUrl: data.avatar_url,
        isGuest: data.is_guest,
        createdAt: data.created_at,
      };
    },

    async updateProfile(userId: string, updates: { displayName?: string; avatarUrl?: string | null }) {
      const updateData: any = {};
      if (updates.displayName !== undefined) {
        updateData.display_name = updates.displayName;
      }
      if (updates.avatarUrl !== undefined) {
        updateData.avatar_url = updates.avatarUrl;
      }

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error || !data) {
        throw new Error('Failed to update profile');
      }

      return {
        id: data.id,
        displayName: data.display_name,
        avatarUrl: data.avatar_url,
        isGuest: data.is_guest,
        createdAt: data.created_at,
      };
    },
  };
}
