/**
 * Chat store - manages in-game text chat
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface ChatMessage {
  playerId: string;
  text: string;
  timestamp: number;
}

interface ChatStore {
  messages: ChatMessage[];
  isOpen: boolean;
  unreadCount: number;
  
  addMessage: (playerId: string, text: string) => void;
  toggleChat: () => void;
  openChat: () => void;
  closeChat: () => void;
  markAllRead: () => void;
  clear: () => void;
}

export const useChatStore = create<ChatStore>()(
  immer((set, get) => ({
    messages: [],
    isOpen: false,
    unreadCount: 0,

    addMessage: (playerId, text) => set((state) => {
      state.messages.push({
        playerId,
        text,
        timestamp: Date.now(),
      });
      
      // Increment unread count if chat is closed
      if (!state.isOpen) {
        state.unreadCount += 1;
      }
    }),

    toggleChat: () => set((state) => {
      state.isOpen = !state.isOpen;
      if (state.isOpen) {
        state.unreadCount = 0;
      }
    }),

    openChat: () => set((state) => {
      state.isOpen = true;
      state.unreadCount = 0;
    }),

    closeChat: () => set({ isOpen: false }),

    markAllRead: () => set({ unreadCount: 0 }),

    clear: () => set({
      messages: [],
      isOpen: false,
      unreadCount: 0,
    }),
  }))
);
