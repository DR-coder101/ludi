import { describe, it, expect, beforeEach } from 'vitest';
import { createProfileService } from './services/profile.js';
import { createAuthService } from './services/auth.js';
import { createMockSupabaseClient, createMockStorage } from './db/mock.js';

describe('Profile Service', () => {
  let profileService: ReturnType<typeof createProfileService>;
  let authService: ReturnType<typeof createAuthService>;
  let storage: ReturnType<typeof createMockStorage>;

  beforeEach(() => {
    storage = createMockStorage();
    const mockSupabase = createMockSupabaseClient(storage);
    profileService = createProfileService(mockSupabase);
    authService = createAuthService(mockSupabase);
  });

  describe('getProfile', () => {
    it('should retrieve user profile', async () => {
      const { userId } = await authService.createGuest('TestGuest');

      const profile = await profileService.getProfile(userId);

      expect(profile.id).toBe(userId);
      expect(profile.displayName).toBe('TestGuest');
      expect(profile.isGuest).toBe(true);
      expect(profile.avatarUrl).toBeNull();
      expect(profile.createdAt).toBeDefined();
    });

    it('should throw error if user not found', async () => {
      await expect(profileService.getProfile('nonexistent-id')).rejects.toThrow('User not found');
    });
  });

  describe('updateProfile', () => {
    it('should update display name', async () => {
      const { userId } = await authService.createGuest('OldName');

      const updated = await profileService.updateProfile(userId, {
        displayName: 'NewName',
      });

      expect(updated.displayName).toBe('NewName');
      expect(updated.id).toBe(userId);
    });

    it('should update avatar URL', async () => {
      const { userId } = await authService.createGuest('User');

      const updated = await profileService.updateProfile(userId, {
        avatarUrl: 'https://example.com/avatar.png',
      });

      expect(updated.avatarUrl).toBe('https://example.com/avatar.png');
    });

    it('should update both display name and avatar', async () => {
      const { userId } = await authService.createGuest('User');

      const updated = await profileService.updateProfile(userId, {
        displayName: 'UpdatedUser',
        avatarUrl: 'https://example.com/avatar.png',
      });

      expect(updated.displayName).toBe('UpdatedUser');
      expect(updated.avatarUrl).toBe('https://example.com/avatar.png');
    });

    it('should throw error if user not found', async () => {
      await expect(
        profileService.updateProfile('nonexistent-id', { displayName: 'Name' })
      ).rejects.toThrow('Failed to update profile');
    });
  });
});
