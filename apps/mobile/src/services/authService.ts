/**
 * Authentication service
 * Wraps server auth API calls for guest and email authentication
 */

import type { AuthResponse } from '@ludi/protocol';

const SERVER_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3000';

export interface AuthService {
  createGuest(displayName?: string): Promise<{ userId: string; accessToken: string }>;
  signUpWithEmail(email: string, password: string, displayName?: string): Promise<{ userId: string; accessToken: string }>;
  signInWithEmail(email: string, password: string): Promise<{ userId: string; accessToken: string }>;
  upgradeGuestToEmail(guestUserId: string, guestToken: string, email: string, password: string): Promise<{ userId: string; accessToken: string }>;
}

class AuthServiceImpl implements AuthService {
  async createGuest(displayName = 'Guest'): Promise<{ userId: string; accessToken: string }> {
    const response = await fetch(`${SERVER_URL}/auth/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName }),
    });

    const data: AuthResponse = await response.json();

    if (!data.success || !data.userId || !data.accessToken) {
      throw new Error(data.error || 'Failed to create guest account');
    }

    return { userId: data.userId, accessToken: data.accessToken };
  }

  async signUpWithEmail(email: string, password: string, displayName = 'Player'): Promise<{ userId: string; accessToken: string }> {
    const response = await fetch(`${SERVER_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName }),
    });

    const data: AuthResponse = await response.json();

    if (!data.success || !data.userId || !data.accessToken) {
      throw new Error(data.error || 'Failed to sign up');
    }

    return { userId: data.userId, accessToken: data.accessToken };
  }

  async signInWithEmail(email: string, password: string): Promise<{ userId: string; accessToken: string }> {
    const response = await fetch(`${SERVER_URL}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data: AuthResponse = await response.json();

    if (!data.success || !data.userId || !data.accessToken) {
      throw new Error(data.error || 'Invalid email or password');
    }

    return { userId: data.userId, accessToken: data.accessToken };
  }

  async upgradeGuestToEmail(guestUserId: string, guestToken: string, email: string, password: string): Promise<{ userId: string; accessToken: string }> {
    const response = await fetch(`${SERVER_URL}/auth/upgrade`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${guestToken}`,
      },
      body: JSON.stringify({ email, password }),
    });

    const data: AuthResponse = await response.json();

    if (!data.success || !data.userId || !data.accessToken) {
      throw new Error(data.error || 'Failed to upgrade account');
    }

    return { userId: data.userId, accessToken: data.accessToken };
  }
}

export const authService = new AuthServiceImpl();
