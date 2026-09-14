/**
 * Game state store - manages authoritative game state from server
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { GameState, LegalMove, TokenPos, Color } from '@ludi/protocol';

interface OptimisticMove {
  tokenIndex: number;
  from: TokenPos;
  to: TokenPos;
}

interface GameStore {
  gameState: GameState | null;
  legalMoves: LegalMove[];
  optimisticMove: OptimisticMove | null;
  currentTurnPlayerId: string | null;
  turnDeadline: number | null;
  
  setGameState: (state: GameState) => void;
  setLegalMoves: (moves: LegalMove[]) => void;
  setCurrentTurnPlayerId: (playerId: string | null) => void;
  setTurnDeadline: (deadlineTs: number | null) => void;
  
  // Optimistic update
  applyOptimisticMove: (tokenIndex: number, from: TokenPos, to: TokenPos) => void;
  rollbackOptimisticMove: () => void;
  
  getMyColor: (myPlayerId: string) => Color | null;
  isMyTurn: (myPlayerId: string) => boolean;
  clear: () => void;
}

export const useGameStore = create<GameStore>()(
  immer((set, get) => ({
    gameState: null,
    legalMoves: [],
    optimisticMove: null,
    currentTurnPlayerId: null,
    turnDeadline: null,

    setGameState: (state) => set({ 
      gameState: state,
      optimisticMove: null, // Clear optimistic state on server update
    }),

    setLegalMoves: (moves) => set({ legalMoves: moves }),

    setCurrentTurnPlayerId: (playerId) => set({ currentTurnPlayerId: playerId }),

    setTurnDeadline: (deadlineTs) => set({ turnDeadline: deadlineTs }),

    applyOptimisticMove: (tokenIndex, from, to) => set((state) => {
      if (!state.gameState) return;
      
      // Store optimistic move for rollback
      state.optimisticMove = { tokenIndex, from, to };
      
      // Optimistically update token position
      const token = state.gameState.tokens[tokenIndex];
      if (token) {
        token.pos = to;
      }
    }),

    rollbackOptimisticMove: () => set((state) => {
      if (!state.gameState || !state.optimisticMove) return;
      
      const { tokenIndex, from } = state.optimisticMove;
      const token = state.gameState.tokens[tokenIndex];
      if (token) {
        token.pos = from;
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
      legalMoves: [],
      optimisticMove: null,
      currentTurnPlayerId: null,
      turnDeadline: null,
    }),
  }))
);
