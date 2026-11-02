import type { ProfileResponse, UserProfile } from '@ludi/protocol';
import { authHeaders } from '../net/authHeaders';
import { resolveSocketServerUrl } from '../net/socketUrl';

const SERVER_URL = resolveSocketServerUrl();

export interface ProfileService {
  getProfile(userId: string): Promise<UserProfile>;
  updateProfile(userId: string, updates: { displayName?: string; avatarUrl?: string | null }): Promise<UserProfile>;
}

class ProfileServiceImpl implements ProfileService {
  async getProfile(userId: string): Promise<UserProfile> {
    const response = await fetch(`${SERVER_URL}/profile/${userId}`, {
      method: 'GET',
      headers: authHeaders(),
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
      headers: authHeaders(),
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
