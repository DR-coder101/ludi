import { describe, it, expect, beforeEach } from 'vitest';
import { createAuthService } from './services/auth.js';
import { createMockSupabaseClient, createMockStorage } from './db/mock.js';

describe('Auth Service', () => {
  let authService: ReturnType<typeof createAuthService>;
  let storage: ReturnType<typeof createMockStorage>;

  beforeEach(() => {
    storage = createMockStorage();
    const mockSupabase = createMockSupabaseClient(storage);
    authService = createAuthService(mockSupabase);
  });

  describe('createGuest', () => {
    it('should create a guest user with default display name', async () => {
      const result = await authService.createGuest();

      expect(result.userId).toBeDefined();
      expect(result.accessToken).toBeDefined();

      const user = storage.users.get(result.userId);
      expect(user).toBeDefined();
      expect(user?.display_name).toBe('Guest');
      expect(user?.is_guest).toBe(true);
    });

    it('should create a guest user with custom display name', async () => {
      const result = await authService.createGuest('CustomGuest');

      expect(result.userId).toBeDefined();

      const user = storage.users.get(result.userId);
      expect(user?.display_name).toBe('CustomGuest');
      expect(user?.is_guest).toBe(true);
    });
  });

  describe('signUpWithEmail', () => {
    it('should create an email user', async () => {
      const result = await authService.signUpWithEmail('test@example.com', 'password123', 'TestUser');

      expect(result.userId).toBeDefined();
      expect(result.accessToken).toBeDefined();

      const user = storage.users.get(result.userId);
      expect(user).toBeDefined();
      expect(user?.display_name).toBe('TestUser');
      expect(user?.is_guest).toBe(false);
    });

    it('should use default display name if not provided', async () => {
      const result = await authService.signUpWithEmail('test@example.com', 'password123');

      const user = storage.users.get(result.userId);
      expect(user?.display_name).toBe('Player');
    });
  });

  describe('upgradeGuestToEmail', () => {
    it('should upgrade a guest user to email account', async () => {
      const guestResult = await authService.createGuest('TempGuest');
      const guestId = guestResult.userId;

      const user = storage.users.get(guestId);
      expect(user?.is_guest).toBe(true);

      const upgradeResult = await authService.upgradeGuestToEmail(
        guestId,
        'upgraded@example.com',
        'newpassword'
      );

      expect(upgradeResult.userId).toBe(guestId);

      const upgradedUser = storage.users.get(guestId);
      expect(upgradedUser?.is_guest).toBe(false);
      expect(upgradedUser?.display_name).toBe('TempGuest');
    });

    it('should throw error if user is not a guest', async () => {
      const emailResult = await authService.signUpWithEmail('email@example.com', 'password', 'EmailUser');

      await expect(
        authService.upgradeGuestToEmail(emailResult.userId, 'new@example.com', 'newpass')
      ).rejects.toThrow('User is not a guest');
    });

    it('should throw error if guest user not found', async () => {
      await expect(
        authService.upgradeGuestToEmail('nonexistent-id', 'email@example.com', 'password')
      ).rejects.toThrow('Guest user not found');
    });
  });
});
