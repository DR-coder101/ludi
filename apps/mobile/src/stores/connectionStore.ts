/**
 * Connection store - manages socket connection status
 */

import { create } from 'zustand';

interface ConnectionStore {
  isConnected: boolean;
  isReconnecting: boolean;
  
  setConnected: (connected: boolean) => void;
  setReconnecting: (reconnecting: boolean) => void;
}

export const useConnectionStore = create<ConnectionStore>((set) => ({
  isConnected: false,
  isReconnecting: false,

  setConnected: (connected) => set({ 
    isConnected: connected,
    isReconnecting: false,
  }),

  setReconnecting: (reconnecting) => set({ isReconnecting: reconnecting }),
}));
