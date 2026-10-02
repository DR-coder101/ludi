/**
 * Game state store - manages authoritative game state from server
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { GameState, TokenPos, Color } from '@ludi/protocol';

interface OptimisticMove {
  tokenIndex: number;
  dieIndex: 0 | 1;
  from: TokenPos;
  to: TokenPos;
}

interface GameStore {
  gameState: GameState | null;
  optimisticMove: OptimisticMove | null;
  currentTurnPlayerId: string | null;
  turnDeadline: number | null;
  
  setGameState: (state: GameState) => void;
  setCurrentTurnPlayerId: (playerId: string | null) => void;
  setTurnDeadline: (deadlineTs: number | null) => void;
  
  // Optimistic update
  applyOptimisticMove: (move: OptimisticMove) => void;
  rollbackOptimisticMove: () => void;
  
  getMyColor: (myPlayerId: string) => Color | null;
  isMyTurn: (myPlayerId: string) => boolean;
  clear: () => void;
}

export const useGameStore = create<GameStore>()(
  immer((set, get) => ({
    gameState: null,
    optimisticMove: null,
    currentTurnPlayerId: null,
    turnDeadline: null,

    setGameState: (state) => set({ 
      gameState: state,
      optimisticMove: null, // Clear optimistic state on server update
    }),

    setCurrentTurnPlayerId: (playerId) => set({ currentTurnPlayerId: playerId }),

    setTurnDeadline: (deadlineTs) => set({ turnDeadline: deadlineTs }),

    applyOptimisticMove: (move) => set((state) => {
      if (!state.gameState) return;
      
      // Store optimistic move for rollback
      state.optimisticMove = move;
      
      // Optimistically update token position and spend the die
      const token = state.gameState.tokens[move.tokenIndex];
      if (token) {
        token.pos = move.to;
      }
      const die = state.gameState.dice?.[move.dieIndex];
      if (die) {
        die.used = true;
      }
    }),

    rollbackOptimisticMove: () => set((state) => {
      if (!state.gameState || !state.optimisticMove) return;
      
      const { tokenIndex, dieIndex, from } = state.optimisticMove;
      const token = state.gameState.tokens[tokenIndex];
      if (token) {
        token.pos = from;
      }
      const die = state.gameState.dice?.[dieIndex];
      if (die) {
        die.used = false;
      }
      
      state.optimisticMove = null;
    }),

    getMyColor: (myPlayerId) => {
      const { gameState } = get();
      if (!gameState) return null;
      
      // Find my color based on playerId mapping (this will be set from room state)
      // For now, we'll rely on the room store to provide this mapping
      return null;
    },

    isMyTurn: (myPlayerId) => {
      const { currentTurnPlayerId } = get();
      return currentTurnPlayerId === myPlayerId;
    },

    clear: () => set({
      gameState: null,
      optimisticMove: null,
      currentTurnPlayerId: null,
      turnDeadline: null,
    }),
  }))
);
