/**
 * Cross-platform secure storage
 * Uses SecureStore on native (iOS/Android) and localStorage on web
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage === 'undefined') {
          console.warn('[Storage] localStorage not available');
          return null;
        }
        return localStorage.getItem(key);
      } else {
        return await SecureStore.getItemAsync(key);
      }
    } catch (error) {
      console.error(`[Storage] Failed to get item ${key}:`, error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage === 'undefined') {
          console.warn('[Storage] localStorage not available');
          return;
        }
        localStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error(`[Storage] Failed to set item ${key}:`, error);
      throw error;
    }
  },

  async deleteItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage === 'undefined') {
          console.warn('[Storage] localStorage not available');
          return;
        }
        localStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error(`[Storage] Failed to delete item ${key}:`, error);
      throw error;
    }
  },
};
