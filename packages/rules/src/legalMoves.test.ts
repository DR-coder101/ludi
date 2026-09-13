/**
 * Tests for legalMoves implementation
 * Covering GAME_RULES.md §10 edge cases: 1, 4, 5, 6, 10
 */

import { describe, it, expect } from "vitest";
import { createGame } from "./game";
import { legalMoves } from "./legalMoves";
import type { GameState, TokenState, GameConfig } from "./types";
import { START_CELLS } from "./topology";

describe("legalMoves", () => {
  const defaultConfig: GameConfig = {
    playerColors: ["red", "green", "yellow", "blue"],
    houseRules: {
      maxConsecutiveSixes: 2,
      extraRollOnCapture: false,
      blockadeCanMoveTogether: false,
      exactFinishBonus: false,
      playForPlacements: false,
    },
  };

  describe("§10 Edge Case 1: Rolling 6 with all tokens in yard", () => {
    it("should only allow coming out moves when rolling 6 with all tokens in yard", () => {
      const state = createGame(defaultConfig);
      
      const stateWithDice: GameState = {
        ...state,
        phase: "awaiting_move",
        dice: 6,
      };

      const moves = legalMoves(stateWithDice);

      expect(moves.length).toBe(4);
      
      for (const move of moves) {
        const token = state.tokens[move.tokenIndex];
        expect(token.color).toBe("red");
        expect(move.resulting).toEqual({
          zone: "track",
          cell: START_CELLS.red,
        });
      }
    });

    it("should have no legal moves when rolling non-6 with all tokens in yard", () => {
      const state = createGame(defaultConfig);
      
      const stateWithDice: GameState = {
        ...state,
        phase: "awaiting_move",
        dice: 3,
      };

      const moves = legalMoves(stateWithDice);
      expect(moves).toEqual([]);
    });
  });

  describe("§10 Edge Case 4: Moving onto own single token forms blockade", () => {
    it("should allow moving onto own single token to form blockade", () => {
      const state = createGame(defaultConfig);
      
      state.tokens[0].pos = { zone: "track", cell: 5 };
      state.tokens[1].pos = { zone: "track", cell: 2 };

      const stateWithDice: GameState = {
        ...state,
        phase: "awaiting_move",
        dice: 3,
      };

      const moves = legalMoves(stateWithDice);
      
      const blockadeFormingMove = moves.find(
        (m) =>
          m.tokenIndex === 1 &&
          m.resulting.zone === "track" &&
          (m.resulting as any).cell === 5
      );

      expect(blockadeFormingMove).toBeDefined();
      expect(blockadeFormingMove?.resulting).toEqual({ zone: "track", cell: 5 });
    });

    it("should not allow adding to existing blockade", () => {
      const state = createGame(defaultConfig);
      
      state.tokens[0].pos = { zone: "track", cell: 10 };
      state.tokens[1].pos = { zone: "track", cell: 10 };
      state.tokens[2].pos = { zone: "track", cell: 7 };

      const stateWithDice: GameState = {
        ...state,
        phase: "awaiting_move",
        dice: 3,
      };

      const moves = legalMoves(stateWithDice);
      
      const tripleStackMove = moves.find(
        (m) =>
          m.tokenIndex === 2 &&
          m.resulting.zone === "track" &&
          (m.resulting as any).cell === 10
      );

      expect(tripleStackMove).toBeUndefined();
    });
  });

  describe("§10 Edge Case 5: Blockade directly ahead blocks movement", () => {
    it("should not allow passing through a blockade", () => {
      const state = createGame(defaultConfig);
      
      state.tokens[4].pos = { zone: "track", cell: 15 };
      state.tokens[5].pos = { zone: "track", cell: 15 };
      
      state.tokens[0].pos = { zone: "track", cell: 10 };

      const stateWithDice: GameState = {
        ...state,
        phase: "awaiting_move",
        dice: 5,
      };

      const moves = legalMoves(stateWithDice);
      
      const blockedMove = moves.find(
        (m) =>
          m.tokenIndex === 0 &&
          m.resulting.zone === "track" &&
          (m.resulting as any).cell === 15
      );

      expect(blockedMove).toBeUndefined();
    });

    it("should not allow landing on opponent blockade", () => {
      const state = createGame(defaultConfig);
      
      state.tokens[4].pos = { zone: "track", cell: 18 };
      state.tokens[5].pos = { zone: "track", cell: 18 };
      
      state.tokens[0].pos = { zone: "track", cell: 12 };

      const stateWithDice: GameState = {
        ...state,
        phase: "awaiting_move",
        dice: 6,
      };

      const moves = legalMoves(stateWithDice);
      
      const blockedMove = moves.find(
        (m) =>
          m.tokenIndex === 0 &&
          m.resulting.zone === "track" &&
          (m.resulting as any).cell === 18
      );

      expect(blockedMove).toBeUndefined();
    });

    it("should block even the blockade owner's other tokens", () => {
      const state = createGame(defaultConfig);
      
      state.tokens[0].pos = { zone: "track", cell: 20 };
      state.tokens[1].pos = { zone: "track", cell: 20 };
      
      state.tokens[2].pos = { zone: "track", cell: 16 };

      const stateWithDice: GameState = {
        ...state,
        phase: "awaiting_move",
        dice: 4,
      };

      const moves = legalMoves(stateWithDice);
      
      const ownBlockadeMove = moves.find(
        (m) =>
          m.tokenIndex === 2 &&
          m.resulting.zone === "track" &&
          (m.resulting as any).cell === 20
      );

      expect(ownBlockadeMove).toBeUndefined();
    });
  });

  describe("§10 Edge Case 6: Exact count required for home; overshoot is illegal", () => {
    it("should allow exact count into home", () => {
      const state = createGame(defaultConfig);
      
      state.tokens[0].pos = { zone: "homeColumn", step: 3 };

      const stateWithDice: GameState = {
        ...state,
        phase: "awaiting_move",
        dice: 3,
      };

      const moves = legalMoves(stateWithDice);
      
      const homeMove = moves.find((m) => m.tokenIndex === 0);
      expect(homeMove).toBeDefined();
      expect(homeMove?.resulting).toEqual({ zone: "home" });
    });

    it("should not allow overshooting home", () => {
      const state = createGame(defaultConfig);
      
      state.tokens[0].pos = { zone: "homeColumn", step: 3 };

      const stateWithDice: GameState = {
        ...state,
        phase: "awaiting_move",
        dice: 5,
      };

      const moves = legalMoves(stateWithDice);
      
      const overshootMove = moves.find((m) => m.tokenIndex === 0);
      expect(overshootMove).toBeUndefined();
    });

    it("should allow other tokens to move when one would overshoot", () => {
      const state = createGame(defaultConfig);
      
      state.tokens[0].pos = { zone: "homeColumn", step: 3 };
      state.tokens[1].pos = { zone: "track", cell: 10 };

      const stateWithDice: GameState = {
        ...state,
        phase: "awaiting_move",
        dice: 5,
      };

      const moves = legalMoves(stateWithDice);
      
      const overshootMove = moves.find((m) => m.tokenIndex === 0);
      expect(overshootMove).toBeUndefined();
      
      const validMove = moves.find((m) => m.tokenIndex === 1);
      expect(validMove).toBeDefined();
      expect(validMove?.resulting).toEqual({ zone: "track", cell: 15 });
    });

    it("should require exact count to advance in home column", () => {
      const state = createGame(defaultConfig);
      
      state.tokens[0].pos = { zone: "homeColumn", step: 5 };

      const stateWithDice: GameState = {
        ...state,
        phase: "awaiting_move",
        dice: 1,
      };

      const moves = legalMoves(stateWithDice);
      
      const exactMove = moves.find((m) => m.tokenIndex === 0);
      expect(exactMove).toBeDefined();
      expect(exactMove?.resulting).toEqual({ zone: "home" });
    });
  });

  describe("§10 Edge Case 10: No-legal-move auto-pass", () => {
    it("should return empty array when no tokens can move", () => {
      const state = createGame(defaultConfig);
      
      state.tokens[0].pos = { zone: "homeColumn", step: 5 };
      state.tokens[1].pos = { zone: "home" };
      state.tokens[2].pos = { zone: "home" };
      state.tokens[3].pos = { zone: "home" };

      const stateWithDice: GameState = {
        ...state,
        phase: "awaiting_move",
        dice: 5,
      };

      const moves = legalMoves(stateWithDice);
      expect(moves).toEqual([]);
    });

    it("should return empty array when only movable token would overshoot", () => {
      const state = createGame(defaultConfig);
      
      state.tokens[0].pos = { zone: "homeColumn", step: 2 };
      state.tokens[1].pos = { zone: "home" };
      state.tokens[2].pos = { zone: "home" };
      state.tokens[3].pos = { zone: "home" };

      const stateWithDice: GameState = {
        ...state,
        phase: "awaiting_move",
        dice: 6,
      };

      const moves = legalMoves(stateWithDice);
      expect(moves).toEqual([]);
    });

    it("should return empty array when all tokens blocked by blockades", () => {
      const state = createGame(defaultConfig);
      
      state.tokens[4].pos = { zone: "track", cell: 5 };
      state.tokens[5].pos = { zone: "track", cell: 5 };
      
      state.tokens[0].pos = { zone: "track", cell: 0 };
      state.tokens[1].pos = { zone: "track", cell: 1 };
      state.tokens[2].pos = { zone: "track", cell: 2 };
      state.tokens[3].pos = { zone: "track", cell: 3 };

      const stateWithDice: GameState = {
        ...state,
        phase: "awaiting_move",
        dice: 5,
      };

      const moves = legalMoves(stateWithDice);
      expect(moves).toEqual([]);
    });
  });

  describe("Capture detection", () => {
    it("should annotate captures when landing on single opponent token", () => {
      const state = createGame(defaultConfig);
      
      state.tokens[4].pos = { zone: "track", cell: 15 };
      state.tokens[0].pos = { zone: "track", cell: 10 };

      const stateWithDice: GameState = {
        ...state,
        phase: "awaiting_move",
        dice: 5,
      };

      const moves = legalMoves(stateWithDice);
      
      const captureMove = moves.find((m) => m.tokenIndex === 0);
      expect(captureMove).toBeDefined();
      expect(captureMove?.captures).toEqual({ color: "green", index: 0 });
    });

    it("should not annotate captures on safe cells", () => {
      const state = createGame(defaultConfig);
      
      state.tokens[4].pos = { zone: "track", cell: 8 };
      state.tokens[0].pos = { zone: "track", cell: 3 };

      const stateWithDice: GameState = {
        ...state,
        phase: "awaiting_move",
        dice: 5,
      };

      const moves = legalMoves(stateWithDice);
      
      const safeMove = moves.find((m) => m.tokenIndex === 0);
      expect(safeMove).toBeDefined();
      expect(safeMove?.captures).toBeUndefined();
    });

    it("should not annotate captures for blockades", () => {
      const state = createGame(defaultConfig);
      
      state.tokens[4].pos = { zone: "track", cell: 15 };
      state.tokens[5].pos = { zone: "track", cell: 15 };
      state.tokens[0].pos = { zone: "track", cell: 9 };

      const stateWithDice: GameState = {
        ...state,
        phase: "awaiting_move",
        dice: 6,
      };

      const moves = legalMoves(stateWithDice);
      
      const blockedMove = moves.find((m) => m.tokenIndex === 0);
      expect(blockedMove).toBeUndefined();
    });
  });

  describe("Coming out rules", () => {
    it("should allow coming out only on exactly 6", () => {
      const state = createGame(defaultConfig);

      for (let dice = 1; dice <= 6; dice++) {
        const stateWithDice: GameState = {
          ...state,
          phase: "awaiting_move",
          dice,
        };

        const moves = legalMoves(stateWithDice);

        if (dice === 6) {
          expect(moves.length).toBeGreaterThan(0);
          moves.forEach((m) => {
            expect(m.resulting).toEqual({
              zone: "track",
              cell: START_CELLS.red,
            });
          });
        } else {
          expect(moves).toEqual([]);
        }
      }
    });

    it("should allow coming out onto start cell even with opponent there (safe cell)", () => {
      const state = createGame(defaultConfig);
      
      state.tokens[4].pos = { zone: "track", cell: START_CELLS.red };

      const stateWithDice: GameState = {
        ...state,
        phase: "awaiting_move",
        dice: 6,
      };

      const moves = legalMoves(stateWithDice);
      
      const comingOutMoves = moves.filter(
        (m) =>
          m.resulting.zone === "track" &&
          (m.resulting as any).cell === START_CELLS.red
      );

      expect(comingOutMoves.length).toBe(4);
      
      comingOutMoves.forEach((m) => {
        expect(m.captures).toBeUndefined();
      });
    });
  });

  describe("Safe cell behavior", () => {
    it("should allow multiple colors on safe cells", () => {
      const state = createGame(defaultConfig);
      
      state.tokens[0].pos = { zone: "track", cell: 8 };
      state.tokens[4].pos = { zone: "track", cell: 8 };
      state.tokens[8].pos = { zone: "track", cell: 3 };
      state.turn = "yellow";

      const stateWithDice: GameState = {
        ...state,
        phase: "awaiting_move",
        dice: 5,
      };

      const moves = legalMoves(stateWithDice);
      
      const safeCellMove = moves.find((m) => m.tokenIndex === 8);
      expect(safeCellMove).toBeDefined();
      expect(safeCellMove?.resulting).toEqual({ zone: "track", cell: 8 });
    });

    it("should block on safe cells if blockade present", () => {
      const state = createGame(defaultConfig);
      
      state.tokens[4].pos = { zone: "track", cell: 8 };
      state.tokens[5].pos = { zone: "track", cell: 8 };
      state.tokens[0].pos = { zone: "track", cell: 3 };

      const stateWithDice: GameState = {
        ...state,
        phase: "awaiting_move",
        dice: 5,
      };

      const moves = legalMoves(stateWithDice);
      
      const blockedMove = moves.find((m) => m.tokenIndex === 0);
      expect(blockedMove).toBeUndefined();
    });
  });

  describe("Home column entry", () => {
    it("should enter home column after completing track", () => {
      const state = createGame(defaultConfig);
      
      state.tokens[0].pos = { zone: "track", cell: 51 };

      const stateWithDice: GameState = {
        ...state,
        phase: "awaiting_move",
        dice: 2,
      };

      const moves = legalMoves(stateWithDice);
      
      const homeColumnMove = moves.find((m) => m.tokenIndex === 0);
      expect(homeColumnMove).toBeDefined();
      expect(homeColumnMove?.resulting).toEqual({ zone: "homeColumn", step: 1 });
    });

    it("should handle exact count into home column", () => {
      const state = createGame(defaultConfig);
      
      state.tokens[0].pos = { zone: "track", cell: 51 };

      const stateWithDice: GameState = {
        ...state,
        phase: "awaiting_move",
        dice: 1,
      };

      const moves = legalMoves(stateWithDice);
      
      const exactMove = moves.find((m) => m.tokenIndex === 0);
      expect(exactMove).toBeDefined();
      expect(exactMove?.resulting).toEqual({ zone: "track", cell: 0 });
    });
  });

  describe("Phase and dice validation", () => {
    it("should return empty array if phase is not awaiting_move", () => {
      const state = createGame(defaultConfig);

      const stateWrongPhase: GameState = {
        ...state,
        phase: "awaiting_roll",
        dice: 6,
      };

      const moves = legalMoves(stateWrongPhase);
      expect(moves).toEqual([]);
    });

    it("should return empty array if dice is null", () => {
      const state = createGame(defaultConfig);

      const stateNoDice: GameState = {
        ...state,
        phase: "awaiting_move",
        dice: null,
      };

      const moves = legalMoves(stateNoDice);
      expect(moves).toEqual([]);
    });
  });
});
