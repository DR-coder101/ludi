/**
 * Room state store - manages lobby and room lifecycle
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { RoomState, Player } from '@ludi/protocol';

interface RoomStore {
  roomState: RoomState | null;
  myPlayerId: string | null;
  
  setRoomState: (state: RoomState) => void;
  setMyPlayerId: (playerId: string) => void;
  updatePlayerConnection: (playerId: string, connected: boolean) => void;
  getMyPlayer: () => Player | null;
  isHost: () => boolean;
  clear: () => void;
}

export const useRoomStore = create<RoomStore>()(
  immer((set, get) => ({
    roomState: null,
    myPlayerId: null,

    setRoomState: (state) => set({ roomState: state }),

    setMyPlayerId: (playerId) => set({ myPlayerId: playerId }),

    updatePlayerConnection: (playerId, connected) => set((state) => {
      if (state.roomState) {
        const player = state.roomState.players.find(p => p.id === playerId);
        if (player) {
          player.connected = connected;
        }
      }
    }),

    getMyPlayer: () => {
      const { roomState, myPlayerId } = get();
      if (!roomState || !myPlayerId) return null;
      return roomState.players.find((p: Player) => p.id === myPlayerId) ?? null;
    },

    isHost: () => {
      const { roomState, myPlayerId } = get();
      return roomState?.hostId === myPlayerId;
    },

    clear: () => set({ roomState: null, myPlayerId: null }),
  }))
);
