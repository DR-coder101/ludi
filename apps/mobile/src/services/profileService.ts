/**
 * Profile service
 * Wraps server profile API calls for user profile management
 */

import type { ProfileResponse, UserProfile } from '@ludi/protocol';

const SERVER_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3000';

export interface ProfileService {
  getProfile(userId: string): Promise<UserProfile>;
  updateProfile(userId: string, updates: { displayName?: string; avatarUrl?: string | null }): Promise<UserProfile>;
}

class ProfileServiceImpl implements ProfileService {
  async getProfile(userId: string): Promise<UserProfile> {
    const response = await fetch(`${SERVER_URL}/profile/${userId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const data: ProfileResponse = await response.json();

    if (!data.success || !data.profile) {
      throw new Error(data.error || 'Failed to fetch profile');
    }

    return data.profile;
  }

  async updateProfile(userId: string, updates: { displayName?: string; avatarUrl?: string | null }): Promise<UserProfile> {
    const response = await fetch(`${SERVER_URL}/profile/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    const data: ProfileResponse = await response.json();

    if (!data.success || !data.profile) {
      throw new Error(data.error || 'Failed to update profile');
    }

    return data.profile;
  }
}

export const profileService = new ProfileServiceImpl();
