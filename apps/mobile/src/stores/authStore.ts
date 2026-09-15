/**
 * Authentication state store
 * Manages user authentication state (guest or email account)
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/authService';

const AUTH_USER_ID_KEY = 'ludi_auth_user_id';
const AUTH_TOKEN_KEY = 'ludi_auth_token';

export interface AuthState {
  userId: string | null;
  accessToken: string | null;
  isGuest: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  initializeAuth: () => Promise<void>;
  createGuest: (displayName?: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  upgradeGuestToEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  immer((set, get) => ({
    userId: null,
    accessToken: null,
    isGuest: false,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    initializeAuth: async () => {
      try {
        const userId = await SecureStore.getItemAsync(AUTH_USER_ID_KEY);
        const accessToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);

        if (userId && accessToken) {
          set((state) => {
            state.userId = userId;
            state.accessToken = accessToken;
            state.isAuthenticated = true;
            state.isGuest = false;
          });
        }
      } catch (error) {
        console.error('[Auth] Failed to initialize auth:', error);
      }
    },

    createGuest: async (displayName = 'Guest') => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const { userId, accessToken } = await authService.createGuest(displayName);

        await SecureStore.setItemAsync(AUTH_USER_ID_KEY, userId);
        await SecureStore.setItemAsync(AUTH_TOKEN_KEY, accessToken);

        set((state) => {
          state.userId = userId;
          state.accessToken = accessToken;
          state.isGuest = true;
          state.isAuthenticated = true;
          state.isLoading = false;
        });
      } catch (error: any) {
        set((state) => {
          state.error = error.message || 'Failed to create guest account';
          state.isLoading = false;
        });
        throw error;
      }
    },

    signUpWithEmail: async (email: string, password: string, displayName = 'Player') => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const { userId, accessToken } = await authService.signUpWithEmail(email, password, displayName);

        await SecureStore.setItemAsync(AUTH_USER_ID_KEY, userId);
        await SecureStore.setItemAsync(AUTH_TOKEN_KEY, accessToken);

        set((state) => {
          state.userId = userId;
          state.accessToken = accessToken;
          state.isGuest = false;
          state.isAuthenticated = true;
          state.isLoading = false;
        });
      } catch (error: any) {
        set((state) => {
          state.error = error.message || 'Failed to sign up';
          state.isLoading = false;
        });
        throw error;
      }
    },

    signInWithEmail: async (email: string, password: string) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const { userId, accessToken } = await authService.signInWithEmail(email, password);

        await SecureStore.setItemAsync(AUTH_USER_ID_KEY, userId);
        await SecureStore.setItemAsync(AUTH_TOKEN_KEY, accessToken);

        set((state) => {
          state.userId = userId;
          state.accessToken = accessToken;
          state.isGuest = false;
          state.isAuthenticated = true;
          state.isLoading = false;
        });
      } catch (error: any) {
        set((state) => {
          state.error = error.message || 'Failed to sign in';
          state.isLoading = false;
        });
        throw error;
      }
    },

    upgradeGuestToEmail: async (email: string, password: string) => {
      const { userId, accessToken } = get();

      if (!userId || !accessToken) {
        throw new Error('No guest account to upgrade');
      }

      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const result = await authService.upgradeGuestToEmail(userId, accessToken, email, password);

        await SecureStore.setItemAsync(AUTH_USER_ID_KEY, result.userId);
        await SecureStore.setItemAsync(AUTH_TOKEN_KEY, result.accessToken);

        set((state) => {
          state.userId = result.userId;
          state.accessToken = result.accessToken;
          state.isGuest = false;
          state.isAuthenticated = true;
          state.isLoading = false;
        });
      } catch (error: any) {
        set((state) => {
          state.error = error.message || 'Failed to upgrade account';
          state.isLoading = false;
        });
        throw error;
      }
    },

    signOut: async () => {
      try {
        await SecureStore.deleteItemAsync(AUTH_USER_ID_KEY);
        await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);

        set((state) => {
          state.userId = null;
          state.accessToken = null;
          state.isGuest = false;
          state.isAuthenticated = false;
          state.error = null;
        });
      } catch (error) {
        console.error('[Auth] Failed to sign out:', error);
      }
    },

    clearError: () => {
      set((state) => {
        state.error = null;
      });
    },
  }))
);
