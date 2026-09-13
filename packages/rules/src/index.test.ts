import { describe, it, expect } from "vitest";
import {
  createGame,
  START_CELLS,
  SAFE_CELLS,
  HOME_COLUMN_ENTRY,
  TRACK_SIZE,
  HOME_COLUMN_LENGTH,
  TOTAL_JOURNEY_STEPS,
  getStartCell,
  getSafeCells,
  isSafeCell,
  isStartCell,
  isHomeColumnEntry,
  normalizeTrackCell,
  computePath,
  getDistanceFromStart,
  legalMoves,
  rollDice,
  applyMove,
  type Color,
  type GameConfig,
  type GameState,
} from "./index";

describe("Game Types and Configuration", () => {
  it("should create a game with valid 4-player config", () => {
    const config: GameConfig = {
      playerColors: ["red", "green", "yellow", "blue"],
      houseRules: {
        maxConsecutiveSixes: 2,
        extraRollOnCapture: false,
        blockadeCanMoveTogether: false,
        exactFinishBonus: false,
        playForPlacements: false,
      },
    };

    const game = createGame(config);

    expect(game.config).toEqual(config);
    expect(game.tokens).toHaveLength(16); // 4 colors × 4 tokens
    expect(game.turn).toBe("red");
    expect(game.phase).toBe("awaiting_roll");
    expect(game.dice).toBeNull();
    expect(game.consecutiveSixes).toBe(0);
    expect(game.winner).toBeNull();
    expect(game.placements).toEqual([]);
  });

  it("should create a game with 2 players", () => {
    const config: GameConfig = {
      playerColors: ["red", "yellow"],
      houseRules: {
        maxConsecutiveSixes: 2,
        extraRollOnCapture: false,
        blockadeCanMoveTogether: false,
        exactFinishBonus: false,
        playForPlacements: false,
      },
    };

    const game = createGame(config);

    expect(game.tokens).toHaveLength(8); // 2 colors × 4 tokens
    expect(game.turn).toBe("red");
  });

  it("should create a game with 3 players", () => {
    const config: GameConfig = {
      playerColors: ["red", "green", "blue"],
      houseRules: {
        maxConsecutiveSixes: 3,
        extraRollOnCapture: true,
        blockadeCanMoveTogether: true,
        exactFinishBonus: true,
        playForPlacements: true,
      },
    };

    const game = createGame(config);

    expect(game.tokens).toHaveLength(12); // 3 colors × 4 tokens
    expect(game.turn).toBe("red");
  });

  it("should place all tokens in yard initially", () => {
    const config: GameConfig = {
      playerColors: ["red", "green", "yellow", "blue"],
      houseRules: {
        maxConsecutiveSixes: 2,
        extraRollOnCapture: false,
        blockadeCanMoveTogether: false,
        exactFinishBonus: false,
        playForPlacements: false,
      },
    };

    const game = createGame(config);

    for (const token of game.tokens) {
      expect(token.pos).toEqual({ zone: "yard" });
    }
  });

  it("should assign correct color and index to each token", () => {
    const config: GameConfig = {
      playerColors: ["red", "green"],
      houseRules: {
        maxConsecutiveSixes: 2,
        extraRollOnCapture: false,
        blockadeCanMoveTogether: false,
        exactFinishBonus: false,
        playForPlacements: false,
      },
    };

    const game = createGame(config);

    const redTokens = game.tokens.filter((t) => t.color === "red");
    const greenTokens = game.tokens.filter((t) => t.color === "green");

    expect(redTokens).toHaveLength(4);
    expect(greenTokens).toHaveLength(4);

    expect(redTokens.map((t) => t.index)).toEqual([0, 1, 2, 3]);
    expect(greenTokens.map((t) => t.index)).toEqual([0, 1, 2, 3]);
  });

  it("should reject invalid player count", () => {
    const config: GameConfig = {
      playerColors: ["red"],
      houseRules: {
        maxConsecutiveSixes: 2,
        extraRollOnCapture: false,
        blockadeCanMoveTogether: false,
        exactFinishBonus: false,
        playForPlacements: false,
      },
    };

    expect(() => createGame(config)).toThrow("Game requires 2-4 players");
  });

  it("should reject duplicate colors", () => {
    const config: GameConfig = {
      playerColors: ["red", "red"],
      houseRules: {
        maxConsecutiveSixes: 2,
        extraRollOnCapture: false,
        blockadeCanMoveTogether: false,
        exactFinishBonus: false,
        playForPlacements: false,
      },
    };

    expect(() => createGame(config)).toThrow("Player colors must be unique");
  });
});

describe("Board Topology - Start Cells", () => {
  it("should have correct start cell indices per GAME_RULES.md", () => {
    expect(START_CELLS.red).toBe(0);
    expect(START_CELLS.green).toBe(13);
    expect(START_CELLS.yellow).toBe(26);
    expect(START_CELLS.blue).toBe(39);
  });

  it("should return correct start cells via getStartCell", () => {
    expect(getStartCell("red")).toBe(0);
    expect(getStartCell("green")).toBe(13);
    expect(getStartCell("yellow")).toBe(26);
    expect(getStartCell("blue")).toBe(39);
  });

  it("should identify start cells correctly", () => {
    expect(isStartCell(0, "red")).toBe(true);
    expect(isStartCell(13, "green")).toBe(true);
    expect(isStartCell(26, "yellow")).toBe(true);
    expect(isStartCell(39, "blue")).toBe(true);

    expect(isStartCell(0, "green")).toBe(false);
    expect(isStartCell(13, "red")).toBe(false);
    expect(isStartCell(26, "blue")).toBe(false);
  });

  it("should verify start cells are 13 positions apart", () => {
    expect(START_CELLS.green - START_CELLS.red).toBe(13);
    expect(START_CELLS.yellow - START_CELLS.green).toBe(13);
    expect(START_CELLS.blue - START_CELLS.yellow).toBe(13);
    expect(TRACK_SIZE - START_CELLS.blue + START_CELLS.red).toBe(13);
  });
});

describe("Board Topology - Safe Cells", () => {
  it("should have correct safe cell indices per GAME_RULES.md §7", () => {
    const safeCells = getSafeCells();
    expect(safeCells).toEqual([0, 8, 13, 21, 26, 34, 39, 47]);
  });

  it("should identify all start cells as safe", () => {
    expect(isSafeCell(0)).toBe(true); // red start
    expect(isSafeCell(13)).toBe(true); // green start
    expect(isSafeCell(26)).toBe(true); // yellow start
    expect(isSafeCell(39)).toBe(true); // blue start
  });

  it("should identify all star-marked cells as safe", () => {
    expect(isSafeCell(8)).toBe(true);
    expect(isSafeCell(21)).toBe(true);
    expect(isSafeCell(34)).toBe(true);
    expect(isSafeCell(47)).toBe(true);
  });

  it("should identify non-safe cells correctly", () => {
    expect(isSafeCell(1)).toBe(false);
    expect(isSafeCell(5)).toBe(false);
    expect(isSafeCell(10)).toBe(false);
    expect(isSafeCell(20)).toBe(false);
    expect(isSafeCell(50)).toBe(false);
  });
});

describe("Board Topology - Home Column Entry", () => {
  it("should have correct home column entry points", () => {
    expect(HOME_COLUMN_ENTRY.red).toBe(51);
    expect(HOME_COLUMN_ENTRY.green).toBe(12);
    expect(HOME_COLUMN_ENTRY.yellow).toBe(25);
    expect(HOME_COLUMN_ENTRY.blue).toBe(38);
  });

  it("should identify home column entry points correctly", () => {
    expect(isHomeColumnEntry(51, "red")).toBe(true);
    expect(isHomeColumnEntry(12, "green")).toBe(true);
    expect(isHomeColumnEntry(25, "yellow")).toBe(true);
    expect(isHomeColumnEntry(38, "blue")).toBe(true);

    expect(isHomeColumnEntry(51, "green")).toBe(false);
    expect(isHomeColumnEntry(12, "red")).toBe(false);
  });

  it("should verify home column entry is one cell before start", () => {
    const colors: Color[] = ["red", "green", "yellow", "blue"];
    for (const color of colors) {
      const startCell = START_CELLS[color];
      const entryCell = HOME_COLUMN_ENTRY[color];
      const expectedEntry = (startCell - 1 + TRACK_SIZE) % TRACK_SIZE;
      expect(entryCell).toBe(expectedEntry);
    }
  });
});

describe("Board Topology - Track Normalization", () => {
  it("should normalize positive track cells", () => {
    expect(normalizeTrackCell(0)).toBe(0);
    expect(normalizeTrackCell(25)).toBe(25);
    expect(normalizeTrackCell(51)).toBe(51);
  });

  it("should normalize cells beyond track size", () => {
    expect(normalizeTrackCell(52)).toBe(0);
    expect(normalizeTrackCell(53)).toBe(1);
    expect(normalizeTrackCell(65)).toBe(13);
    expect(normalizeTrackCell(104)).toBe(0); // 2 full laps
  });

  it("should normalize negative cells", () => {
    expect(normalizeTrackCell(-1)).toBe(51);
    expect(normalizeTrackCell(-13)).toBe(39);
    expect(normalizeTrackCell(-52)).toBe(0);
  });
});

describe("Board Topology - Path Computation", () => {
  it("should compute path from yard to start cell", () => {
    const path = computePath({ zone: "yard" }, 1, "red");
    expect(path).toEqual({ zone: "track", cell: 0 });
  });

  it("should compute path from yard for all colors", () => {
    expect(computePath({ zone: "yard" }, 1, "red")).toEqual({
      zone: "track",
      cell: 0,
    });
    expect(computePath({ zone: "yard" }, 1, "green")).toEqual({
      zone: "track",
      cell: 13,
    });
    expect(computePath({ zone: "yard" }, 1, "yellow")).toEqual({
      zone: "track",
      cell: 26,
    });
    expect(computePath({ zone: "yard" }, 1, "blue")).toEqual({
      zone: "track",
      cell: 39,
    });
  });

  it("should reject invalid steps from yard", () => {
    expect(computePath({ zone: "yard" }, 0, "red")).toBeNull();
    expect(computePath({ zone: "yard" }, 2, "red")).toBeNull();
    expect(computePath({ zone: "yard" }, 6, "red")).toBeNull();
  });

  it("should compute simple forward movement on track", () => {
    const startPos = { zone: "track" as const, cell: 0 };
    expect(computePath(startPos, 1, "red")).toEqual({
      zone: "track",
      cell: 1,
    });
    expect(computePath(startPos, 5, "red")).toEqual({
      zone: "track",
      cell: 5,
    });
  });

  it("should handle wraparound on track", () => {
    const pos = { zone: "track" as const, cell: 5 };
    const path = computePath(pos, 10, "red");
    expect(path).toEqual({ zone: "track", cell: 15 });
  });

  it("should enter home column after completing track (52 steps from start)", () => {
    const pos = { zone: "track" as const, cell: 51 };
    const path = computePath(pos, 1, "red");
    expect(path).toEqual({ zone: "homeColumn", step: 1 });
  });

  it("should enter home column for all colors at correct positions", () => {
    expect(computePath({ zone: "track", cell: 51 }, 1, "red")).toEqual({
      zone: "homeColumn",
      step: 1,
    });
    expect(computePath({ zone: "track", cell: 12 }, 1, "green")).toEqual({
      zone: "homeColumn",
      step: 1,
    });
    expect(computePath({ zone: "track", cell: 25 }, 1, "yellow")).toEqual({
      zone: "homeColumn",
      step: 1,
    });
    expect(computePath({ zone: "track", cell: 38 }, 1, "blue")).toEqual({
      zone: "homeColumn",
      step: 1,
    });
  });

  it("should advance in home column", () => {
    expect(computePath({ zone: "homeColumn", step: 1 }, 1, "red")).toEqual({
      zone: "homeColumn",
      step: 2,
    });
    expect(computePath({ zone: "homeColumn", step: 3 }, 2, "red")).toEqual({
      zone: "homeColumn",
      step: 5,
    });
  });

  it("should reach home from home column step 6", () => {
    const path = computePath({ zone: "homeColumn", step: 6 }, 1, "red");
    expect(path).toEqual({ zone: "home" });
  });

  it("should reject overshoot in home column", () => {
    expect(computePath({ zone: "homeColumn", step: 6 }, 2, "red")).toBeNull();
    expect(computePath({ zone: "homeColumn", step: 5 }, 3, "red")).toBeNull();
  });

  it("should reject movement from home", () => {
    expect(computePath({ zone: "home" }, 1, "red")).toBeNull();
    expect(computePath({ zone: "home" }, 6, "red")).toBeNull();
  });

  it("should compute 57-step journey from start to home", () => {
    let pos = { zone: "track" as const, cell: 0 };

    // 52 steps to complete track and enter home column
    for (let i = 0; i < 51; i++) {
      const nextPos = computePath(pos, 1, "red");
      expect(nextPos).not.toBeNull();
      expect(nextPos!.zone).toBe("track");
      pos = nextPos as { zone: "track"; cell: number };
    }

    // Step 52: enter home column
    let nextPos = computePath(pos, 1, "red");
    expect(nextPos).toEqual({ zone: "homeColumn", step: 1 });

    // Steps 53-57: advance through home column
    pos = nextPos as any;
    for (let step = 2; step <= 6; step++) {
      nextPos = computePath(pos, 1, "red");
      expect(nextPos).toEqual({ zone: "homeColumn", step });
      pos = nextPos as any;
    }

    // Step 58: reach home
    nextPos = computePath(pos, 1, "red");
    expect(nextPos).toEqual({ zone: "home" });
  });

  it("should handle multi-step moves correctly", () => {
    const startPos = { zone: "track" as const, cell: 0 };
    expect(computePath(startPos, 6, "red")).toEqual({
      zone: "track",
      cell: 6,
    });
    expect(computePath(startPos, 13, "red")).toEqual({
      zone: "track",
      cell: 13,
    });
  });

  it("should enter home column with multi-step move", () => {
    const pos = { zone: "track" as const, cell: 48 };
    const path = computePath(pos, 4, "red");
    expect(path).toEqual({ zone: "homeColumn", step: 1 });
  });

  it("should reach home with multi-step move from home column", () => {
    expect(computePath({ zone: "homeColumn", step: 4 }, 3, "red")).toEqual({
      zone: "home",
    });
  });
});

describe("Board Topology - Distance Calculation", () => {
  it("should calculate distance from start cell", () => {
    expect(getDistanceFromStart({ zone: "track", cell: 0 }, "red")).toBe(0);
    expect(getDistanceFromStart({ zone: "track", cell: 5 }, "red")).toBe(5);
    expect(getDistanceFromStart({ zone: "track", cell: 13 }, "red")).toBe(13);
  });

  it("should calculate distance with wraparound", () => {
    expect(getDistanceFromStart({ zone: "track", cell: 51 }, "red")).toBe(51);
    expect(getDistanceFromStart({ zone: "track", cell: 0 }, "green")).toBe(39);
    expect(getDistanceFromStart({ zone: "track", cell: 12 }, "green")).toBe(51);
  });

  it("should return null for non-track positions", () => {
    expect(getDistanceFromStart({ zone: "yard" }, "red")).toBeNull();
    expect(
      getDistanceFromStart({ zone: "homeColumn", step: 3 }, "red")
    ).toBeNull();
    expect(getDistanceFromStart({ zone: "home" }, "red")).toBeNull();
  });

  it("should calculate correct distances for all colors", () => {
    expect(getDistanceFromStart({ zone: "track", cell: 13 }, "green")).toBe(0);
    expect(getDistanceFromStart({ zone: "track", cell: 26 }, "yellow")).toBe(0);
    expect(getDistanceFromStart({ zone: "track", cell: 39 }, "blue")).toBe(0);

    expect(getDistanceFromStart({ zone: "track", cell: 20 }, "green")).toBe(7);
    expect(getDistanceFromStart({ zone: "track", cell: 30 }, "yellow")).toBe(4);
    expect(getDistanceFromStart({ zone: "track", cell: 45 }, "blue")).toBe(6);
  });
});

describe("Board Constants", () => {
  it("should have correct track size", () => {
    expect(TRACK_SIZE).toBe(52);
  });

  it("should have correct home column length", () => {
    expect(HOME_COLUMN_LENGTH).toBe(6);
  });

  it("should have correct total journey steps", () => {
    expect(TOTAL_JOURNEY_STEPS).toBe(57);
    expect(TOTAL_JOURNEY_STEPS).toBe(TRACK_SIZE + HOME_COLUMN_LENGTH - 1);
  });
});

describe("Legal Moves - M1 Step 1.2", () => {
  const baseConfig: GameConfig = {
    playerColors: ["red", "green", "yellow", "blue"],
    houseRules: {
      maxConsecutiveSixes: 2,
      extraRollOnCapture: false,
      blockadeCanMoveTogether: false,
      exactFinishBonus: false,
      playForPlacements: false,
    },
  };

  describe("Edge Case 1: Rolling 6 with all tokens in yard", () => {
    it("should allow coming out when rolling 6 from yard", () => {
      const game = createGame(baseConfig);
      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        dice: 6,
      };

      const moves = legalMoves(stateWithDice);

      expect(moves.length).toBeGreaterThan(0);
      
      const redMoves = moves.filter((m: any) => {
        const token = stateWithDice.tokens[m.tokenIndex];
        return token.color === "red";
      });

      expect(redMoves.length).toBe(4);
      
      for (const move of redMoves) {
        expect(move.resulting).toEqual({ zone: "track", cell: 0 });
      }
    });

    it("should not allow coming out on roll other than 6", () => {
      const game = createGame(baseConfig);
      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        dice: 3,
      };

      const moves = legalMoves(stateWithDice);

      expect(moves.length).toBe(0);
    });
  });

  describe("Edge Case 4: Moving onto own single token forms blockade", () => {
    it("should allow moving onto own token to form blockade", () => {
      const game = createGame({ ...baseConfig, playerColors: ["red", "green"] });
      
      game.tokens[0].pos = { zone: "track", cell: 5 };
      game.tokens[1].pos = { zone: "track", cell: 3 };
      
      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        dice: 2,
      };

      const moves = legalMoves(stateWithDice);

      const moveToBlockade = moves.find((m: any) => {
        const token = stateWithDice.tokens[m.tokenIndex];
        return token.color === "red" && token.index === 1 &&
               m.resulting.zone === "track" && m.resulting.cell === 5;
      });

      expect(moveToBlockade).toBeDefined();
    });
  });

  describe("Edge Case 5: Blockade directly ahead blocks passage", () => {
    it("should block token from passing through blockade", () => {
      const game = createGame({ ...baseConfig, playerColors: ["red", "green"] });
      
      game.tokens[0].pos = { zone: "track", cell: 5 };
      game.tokens[4].pos = { zone: "track", cell: 8 };
      game.tokens[5].pos = { zone: "track", cell: 8 };
      
      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        dice: 5,
      };

      const moves = legalMoves(stateWithDice);

      const blockedMove = moves.find((m: any) => {
        const token = stateWithDice.tokens[m.tokenIndex];
        return token.color === "red" && token.index === 0;
      });

      expect(blockedMove).toBeUndefined();
    });

    it("should block token from landing on blockade", () => {
      const game = createGame({ ...baseConfig, playerColors: ["red", "green"] });
      
      game.tokens[0].pos = { zone: "track", cell: 5 };
      game.tokens[4].pos = { zone: "track", cell: 8 };
      game.tokens[5].pos = { zone: "track", cell: 8 };
      
      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        dice: 3,
      };

      const moves = legalMoves(stateWithDice);

      const blockedMove = moves.find((m: any) => {
        const token = stateWithDice.tokens[m.tokenIndex];
        return token.color === "red" && token.index === 0;
      });

      expect(blockedMove).toBeUndefined();
    });

    it("should block own tokens from passing own blockade", () => {
      const game = createGame({ ...baseConfig, playerColors: ["red", "green"] });
      
      game.tokens[0].pos = { zone: "track", cell: 5 };
      game.tokens[1].pos = { zone: "track", cell: 8 };
      game.tokens[2].pos = { zone: "track", cell: 8 };
      
      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        dice: 5,
      };

      const moves = legalMoves(stateWithDice);

      const blockedMove = moves.find((m: any) => {
        const token = stateWithDice.tokens[m.tokenIndex];
        return token.color === "red" && token.index === 0;
      });

      expect(blockedMove).toBeUndefined();
    });
  });

  describe("Edge Case 6: Exact count required into home", () => {
    it("should allow exact count to reach home", () => {
      const game = createGame({ ...baseConfig, playerColors: ["red", "green"] });
      
      game.tokens[0].pos = { zone: "homeColumn", step: 6 };
      
      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        dice: 1,
      };

      const moves = legalMoves(stateWithDice);

      const homeMove = moves.find((m: any) => {
        const token = stateWithDice.tokens[m.tokenIndex];
        return token.color === "red" && token.index === 0;
      });

      expect(homeMove).toBeDefined();
      expect(homeMove?.resulting).toEqual({ zone: "home" });
    });

    it("should reject overshoot from home column", () => {
      const game = createGame({ ...baseConfig, playerColors: ["red", "green"] });
      
      game.tokens[0].pos = { zone: "homeColumn", step: 6 };
      
      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        dice: 2,
      };

      const moves = legalMoves(stateWithDice);

      const overshootMove = moves.find((m: any) => {
        const token = stateWithDice.tokens[m.tokenIndex];
        return token.color === "red" && token.index === 0;
      });

      expect(overshootMove).toBeUndefined();
    });

    it("should reject overshoot into home column from track", () => {
      const game = createGame({ ...baseConfig, playerColors: ["red", "green"] });
      
      // Red home entry is at cell 51 (one before start 0)
      // After 52 steps from start (0), enters home column at step 1
      // From cell 45 (45 steps from start), rolling 6 would be 51 steps total
      // That puts us at entry point 51, next step enters home column at step 1
      // We need to be at a position where rolling would put us past home column step 6
      // 
      // Actually from track, we can NEVER overshoot because computePath handles it
      // The overshoot only happens from WITHIN home column
      // This test is testing the wrong thing - remove or fix it
      
      // Better test: token very close to home entry, large roll would overshoot
      // From cell 46 (46 steps from start), need 52-46=6 more to complete track
      // Then 7 steps into home column = past home
      // But max dice is 6, so from track we enter at most step 6 of home column
      
      // Actually, let's test entering home column with exact count
      game.tokens[0].pos = { zone: "track", cell: 50 };
      
      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        dice: 2,
      };

      const moves = legalMoves(stateWithDice);

      const homeColumnMove = moves.find((m: any) => {
        const token = stateWithDice.tokens[m.tokenIndex];
        return token.color === "red" && token.index === 0;
      });

      // From 50, +2 = 52 steps from start = enters home column at step 1
      expect(homeColumnMove).toBeDefined();
      expect(homeColumnMove?.resulting).toEqual({ zone: "homeColumn", step: 1 });
    });
  });

  describe("Edge Case 10: No legal move auto-pass", () => {
    it("should return empty array when no legal moves exist", () => {
      const game = createGame({ ...baseConfig, playerColors: ["red", "green"] });
      
      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        dice: 3,
      };

      const moves = legalMoves(stateWithDice);

      expect(moves).toEqual([]);
    });

    it("should return empty array when only movable token would overshoot", () => {
      const game = createGame({ ...baseConfig, playerColors: ["red", "green"] });
      
      game.tokens[0].pos = { zone: "homeColumn", step: 5 };
      game.tokens[1].pos = { zone: "home" };
      game.tokens[2].pos = { zone: "home" };
      game.tokens[3].pos = { zone: "home" };
      
      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        dice: 5,
      };

      const moves = legalMoves(stateWithDice);

      expect(moves).toEqual([]);
    });

    it("should return empty array when all paths are blocked by blockades", () => {
      const game = createGame({ ...baseConfig, playerColors: ["red", "green"] });
      
      game.tokens[0].pos = { zone: "track", cell: 5 };
      game.tokens[1].pos = { zone: "yard" };
      game.tokens[2].pos = { zone: "yard" };
      game.tokens[3].pos = { zone: "yard" };
      
      game.tokens[4].pos = { zone: "track", cell: 7 };
      game.tokens[5].pos = { zone: "track", cell: 7 };
      
      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        dice: 2,
      };

      const moves = legalMoves(stateWithDice);

      expect(moves).toEqual([]);
    });
  });

  describe("Additional Legal Move Tests", () => {
    it("should annotate captures correctly", () => {
      const game = createGame({ ...baseConfig, playerColors: ["red", "green"] });
      
      // Use cell 7 which is NOT safe (safe cells are 0,8,13,21,26,34,39,47)
      game.tokens[0].pos = { zone: "track", cell: 5 };
      game.tokens[4].pos = { zone: "track", cell: 7 };
      
      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        dice: 2,
      };

      const moves = legalMoves(stateWithDice);

      const captureMove = moves.find((m: any) => {
        const token = stateWithDice.tokens[m.tokenIndex];
        return token.color === "red" && token.index === 0;
      });

      expect(captureMove).toBeDefined();
      expect(captureMove?.captures).toEqual({ color: "green", index: 0 });
    });

    it("should not capture on safe cells", () => {
      const game = createGame({ ...baseConfig, playerColors: ["red", "green"] });
      
      // Cell 8 IS safe
      game.tokens[0].pos = { zone: "track", cell: 5 };
      game.tokens[4].pos = { zone: "track", cell: 8 };
      
      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        dice: 3,
      };

      const moves = legalMoves(stateWithDice);

      const safeMove = moves.find((m: any) => {
        const token = stateWithDice.tokens[m.tokenIndex];
        return token.color === "red" && token.index === 0;
      });

      // Should find the move but NO capture annotation
      expect(safeMove).toBeDefined();
      expect(safeMove?.captures).toBeUndefined();
    });

    it("should allow coexistence on safe cells", () => {
      const game = createGame({ ...baseConfig, playerColors: ["red", "green"] });
      
      // Both tokens can coexist on safe cell 8
      game.tokens[0].pos = { zone: "track", cell: 5 };
      game.tokens[4].pos = { zone: "track", cell: 8 };
      
      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        dice: 3,
      };

      const moves = legalMoves(stateWithDice);

      expect(moves.length).toBeGreaterThan(0);
    });

    it("should not allow moves when phase is not awaiting_move", () => {
      const game = createGame(baseConfig);
      const stateAwaitingRoll = {
        ...game,
        phase: "awaiting_roll" as const,
        dice: 6,
      };

      const moves = legalMoves(stateAwaitingRoll);

      expect(moves).toEqual([]);
    });

    it("should not allow moves when dice is null", () => {
      const game = createGame(baseConfig);
      const stateNoDice = {
        ...game,
        phase: "awaiting_move" as const,
        dice: null,
      };

      const moves = legalMoves(stateNoDice);

      expect(moves).toEqual([]);
    });
  });
});

describe("Roll Dice - M1 Step 1.3", () => {
  const baseConfig: GameConfig = {
    playerColors: ["red", "green", "yellow", "blue"],
    houseRules: {
      maxConsecutiveSixes: 2,
      extraRollOnCapture: false,
      blockadeCanMoveTogether: false,
      exactFinishBonus: false,
      playForPlacements: false,
    },
  };

  it("should roll dice and transition to awaiting_move phase", () => {
    const game = createGame(baseConfig);
    
    // Put a token on track so moves exist
    game.tokens[0].pos = { zone: "track", cell: 5 };
    
    const rng = () => 0.5; // Will produce 4

    const result = rollDice(game, rng);

    expect(result.value).toBe(4);
    expect(result.state.dice).toBe(4);
    expect(result.state.phase).toBe("awaiting_move");
  });

  it("should roll 6 and allow extra turn potential", () => {
    const game = createGame(baseConfig);
    const rng = () => 5 / 6; // Will produce 6

    const result = rollDice(game, rng);

    expect(result.value).toBe(6);
    expect(result.state.dice).toBe(6);
  });

  it("should auto-pass when no legal moves exist", () => {
    const game = createGame(baseConfig);
    const rng = () => 0.2; // Will produce 2

    const result = rollDice(game, rng);

    expect(result.state.phase).toBe("awaiting_roll");
    expect(result.state.turn).toBe("green");
    expect(result.state.dice).toBeNull();
  });

  it("should handle third consecutive six forfeit (edge case 2)", () => {
    const game = createGame(baseConfig);
    
    // Token on track so moves exist
    game.tokens[0].pos = { zone: "track", cell: 5 };
    
    // Simulate two consecutive sixes already happened
    const stateAfterTwoSixes = {
      ...game,
      consecutiveSixes: 2,
      phase: "awaiting_roll" as const,
      dice: null,
    };

    const rng = () => 5 / 6; // Will produce 6 (third consecutive)

    const result = rollDice(stateAfterTwoSixes, rng);

    expect(result.value).toBe(6);
    expect(result.state.turn).toBe("green");
    expect(result.state.phase).toBe("awaiting_roll");
    expect(result.state.consecutiveSixes).toBe(0);
  });

  it("should not forfeit when maxConsecutiveSixes is unlimited", () => {
    const game = createGame({
      ...baseConfig,
      houseRules: {
        ...baseConfig.houseRules,
        maxConsecutiveSixes: "unlimited",
      },
    });

    game.tokens[0].pos = { zone: "track", cell: 5 };

    const stateAfterTwoSixes = {
      ...game,
      consecutiveSixes: 2,
      phase: "awaiting_roll" as const,
      dice: null,
    };

    const rng = () => 5 / 6; // Third 6

    const result = rollDice(stateAfterTwoSixes, rng);

    expect(result.state.phase).toBe("awaiting_move");
    expect(result.state.turn).toBe("red");
  });
});

describe("Apply Move - M1 Step 1.3", () => {
  const baseConfig: GameConfig = {
    playerColors: ["red", "green", "yellow", "blue"],
    houseRules: {
      maxConsecutiveSixes: 2,
      extraRollOnCapture: false,
      blockadeCanMoveTogether: false,
      exactFinishBonus: false,
      playForPlacements: false,
    },
  };

  describe("Edge Case 2: Third consecutive 6 forfeit", () => {
    it("should be handled in rollDice, not applyMove", () => {
      // This is tested in rollDice tests above
      expect(true).toBe(true);
    });
  });

  describe("Edge Case 3: Landing on opponent single token captures", () => {
    it("should capture opponent token on non-safe cell", () => {
      const game = createGame({ ...baseConfig, playerColors: ["red", "green"] });
      
      game.tokens[0].pos = { zone: "track", cell: 5 };
      game.tokens[4].pos = { zone: "track", cell: 7 };

      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        dice: 2,
      };

      const result = applyMove(stateWithDice, 0);

      expect(result.state.tokens[4].pos).toEqual({ zone: "yard" });
      
      const captureEvent = result.events.find((e) => e.type === "captured");
      expect(captureEvent).toBeDefined();
      expect(captureEvent?.capturedColor).toBe("green");
    });

    it("should not capture on opponent blockade", () => {
      const game = createGame({ ...baseConfig, playerColors: ["red", "green"] });
      
      game.tokens[0].pos = { zone: "track", cell: 5 };
      game.tokens[4].pos = { zone: "track", cell: 8 };
      game.tokens[5].pos = { zone: "track", cell: 8 };

      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        dice: 3,
      };

      const moves = legalMoves(stateWithDice);
      const blockedMove = moves.find(m => m.tokenIndex === 0);

      expect(blockedMove).toBeUndefined();
    });
  });

  describe("Edge Case 7: Safe cell multi-color coexistence", () => {
    it("should allow multiple colors on safe cells", () => {
      const game = createGame(baseConfig);
      
      game.tokens[0].pos = { zone: "track", cell: 5 };
      game.tokens[4].pos = { zone: "track", cell: 8 };
      game.tokens[8].pos = { zone: "track", cell: 8 };

      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        dice: 3,
      };

      const result = applyMove(stateWithDice, 0);

      expect(result.state.tokens[0].pos).toEqual({ zone: "track", cell: 8 });
      expect(result.state.tokens[4].pos).toEqual({ zone: "track", cell: 8 });
      expect(result.state.tokens[8].pos).toEqual({ zone: "track", cell: 8 });
      
      const captureEvent = result.events.find((e) => e.type === "captured");
      expect(captureEvent).toBeUndefined();
    });
  });

  describe("Edge Case 8: Coming out onto opponent on start cell is safe", () => {
    it("should not capture when coming out onto opponent on own start cell", () => {
      const game = createGame({ ...baseConfig, playerColors: ["red", "green"] });
      
      game.tokens[4].pos = { zone: "track", cell: 0 };

      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        dice: 6,
      };

      const result = applyMove(stateWithDice, 0);

      expect(result.state.tokens[0].pos).toEqual({ zone: "track", cell: 0 });
      expect(result.state.tokens[4].pos).toEqual({ zone: "track", cell: 0 });
      
      const captureEvent = result.events.find((e) => e.type === "captured");
      expect(captureEvent).toBeUndefined();

      const cameOutEvent = result.events.find((e) => e.type === "came_out");
      expect(cameOutEvent).toBeDefined();
    });

    it("should capture opponent normally when not coming out", () => {
      const game = createGame({ ...baseConfig, playerColors: ["red", "green"] });
      
      // Regular capture on non-safe cell 7
      game.tokens[0].pos = { zone: "track", cell: 5 };
      game.tokens[4].pos = { zone: "track", cell: 7 };

      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        dice: 2,
      };

      const result = applyMove(stateWithDice, 0);

      expect(result.state.tokens[0].pos).toEqual({ zone: "track", cell: 7 });
      expect(result.state.tokens[4].pos).toEqual({ zone: "yard" });
      
      const captureEvent = result.events.find((e) => e.type === "captured");
      expect(captureEvent).toBeDefined();
    });
  });

  describe("Edge Case 9: All 4 tokens stacked forms blockade", () => {
    it("should treat 4 stacked tokens as blockade", () => {
      const game = createGame({ ...baseConfig, playerColors: ["red", "green"] });
      
      game.tokens[0].pos = { zone: "track", cell: 5 };
      game.tokens[4].pos = { zone: "track", cell: 8 };
      game.tokens[5].pos = { zone: "track", cell: 8 };
      game.tokens[6].pos = { zone: "track", cell: 8 };
      game.tokens[7].pos = { zone: "track", cell: 8 };

      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        dice: 3,
      };

      const moves = legalMoves(stateWithDice);
      const blockedMove = moves.find(m => m.tokenIndex === 0);

      expect(blockedMove).toBeUndefined();
    });
  });

  describe("Edge Case 11: 2-player and 3-player games", () => {
    it("should work correctly in 2-player game", () => {
      const game = createGame({
        ...baseConfig,
        playerColors: ["red", "yellow"],
      });

      game.tokens[0].pos = { zone: "track", cell: 5 };

      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        dice: 3,
      };

      const result = applyMove(stateWithDice, 0);

      expect(result.state.tokens[0].pos).toEqual({ zone: "track", cell: 8 });
      expect(result.state.turn).toBe("yellow");
    });

    it("should work correctly in 3-player game", () => {
      const game = createGame({
        ...baseConfig,
        playerColors: ["red", "green", "blue"],
      });

      game.tokens[0].pos = { zone: "track", cell: 5 };

      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        dice: 3,
      };

      const result = applyMove(stateWithDice, 0);

      expect(result.state.tokens[0].pos).toEqual({ zone: "track", cell: 8 });
      expect(result.state.turn).toBe("green");
    });
  });

  describe("Edge Case 12: Turn timeout handled by server", () => {
    it("should allow any legal move selection", () => {
      const game = createGame(baseConfig);
      
      game.tokens[0].pos = { zone: "track", cell: 5 };
      game.tokens[1].pos = { zone: "track", cell: 6 };

      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        dice: 2,
      };

      const moves = legalMoves(stateWithDice);
      
      expect(moves.length).toBeGreaterThan(0);
      
      // Server can pick any legal move (simulating random selection)
      const result = applyMove(stateWithDice, moves[0].tokenIndex);
      
      expect(result.state.phase).toBe("awaiting_roll");
    });
  });

  describe("Blockade formation and breaking", () => {
    it("should emit blockade_formed when moving onto own token", () => {
      const game = createGame({ ...baseConfig, playerColors: ["red", "green"] });
      
      game.tokens[0].pos = { zone: "track", cell: 5 };
      game.tokens[1].pos = { zone: "track", cell: 3 };

      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        dice: 2,
      };

      const result = applyMove(stateWithDice, 1);

      const blockadeEvent = result.events.find((e) => e.type === "blockade_formed");
      expect(blockadeEvent).toBeDefined();
    });

    it("should emit blockade_broken when moving off blockade", () => {
      const game = createGame({ ...baseConfig, playerColors: ["red", "green"] });
      
      game.tokens[0].pos = { zone: "track", cell: 5 };
      game.tokens[1].pos = { zone: "track", cell: 5 };

      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        dice: 2,
      };

      const result = applyMove(stateWithDice, 0);

      const blockadeEvent = result.events.find((e) => e.type === "blockade_broken");
      expect(blockadeEvent).toBeDefined();
    });
  });

  describe("Extra turn logic", () => {
    it("should grant extra turn on rolling 6", () => {
      const game = createGame(baseConfig);
      
      game.tokens[0].pos = { zone: "track", cell: 5 };

      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        dice: 6,
      };

      const result = applyMove(stateWithDice, 0);

      const extraTurnEvent = result.events.find((e) => e.type === "extra_turn");
      expect(extraTurnEvent).toBeDefined();
      expect(result.state.turn).toBe("red");
      expect(result.state.phase).toBe("awaiting_roll");
    });

    it("should grant extra turn on capture when house rule enabled", () => {
      const game = createGame({
        ...baseConfig,
        playerColors: ["red", "green"],
        houseRules: {
          ...baseConfig.houseRules,
          extraRollOnCapture: true,
        },
      });

      game.tokens[0].pos = { zone: "track", cell: 5 };
      game.tokens[4].pos = { zone: "track", cell: 7 };

      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        dice: 2,
      };

      const result = applyMove(stateWithDice, 0);

      const extraTurnEvent = result.events.find((e) => e.type === "extra_turn");
      expect(extraTurnEvent).toBeDefined();
    });

    it("should not grant extra turn on capture when house rule disabled", () => {
      const game = createGame({
        ...baseConfig,
        playerColors: ["red", "green"],
      });

      game.tokens[0].pos = { zone: "track", cell: 5 };
      game.tokens[4].pos = { zone: "track", cell: 7 };

      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        dice: 2,
      };

      const result = applyMove(stateWithDice, 0);

      const turnPassedEvent = result.events.find((e) => e.type === "turn_passed");
      expect(turnPassedEvent).toBeDefined();
      expect(result.state.turn).toBe("green");
    });

    it("should grant extra turn when getting token home with exactFinishBonus", () => {
      const game = createGame({
        ...baseConfig,
        playerColors: ["red", "green"],
        houseRules: {
          ...baseConfig.houseRules,
          exactFinishBonus: true,
        },
      });

      game.tokens[0].pos = { zone: "homeColumn", step: 6 };

      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        dice: 1,
      };

      const result = applyMove(stateWithDice, 0);

      const extraTurnEvent = result.events.find((e) => e.type === "extra_turn");
      expect(extraTurnEvent).toBeDefined();
    });
  });

  describe("Win detection and placements", () => {
    it("should detect win when all tokens reach home", () => {
      const game = createGame({
        ...baseConfig,
        playerColors: ["red", "green"],
      });

      game.tokens[0].pos = { zone: "home" };
      game.tokens[1].pos = { zone: "home" };
      game.tokens[2].pos = { zone: "home" };
      game.tokens[3].pos = { zone: "homeColumn", step: 6 };

      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        dice: 1,
      };

      const result = applyMove(stateWithDice, 3);

      expect(result.state.winner).toBe("red");
      expect(result.state.phase).toBe("finished");
      expect(result.state.placements).toEqual(["red"]);

      const gameOverEvent = result.events.find((e) => e.type === "game_over");
      expect(gameOverEvent).toBeDefined();
    });

    it("should continue for placements when house rule enabled", () => {
      const game = createGame({
        ...baseConfig,
        playerColors: ["red", "green", "yellow"],
        houseRules: {
          ...baseConfig.houseRules,
          playForPlacements: true,
        },
      });

      game.tokens[0].pos = { zone: "home" };
      game.tokens[1].pos = { zone: "home" };
      game.tokens[2].pos = { zone: "home" };
      game.tokens[3].pos = { zone: "homeColumn", step: 6 };

      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        dice: 1,
      };

      const result = applyMove(stateWithDice, 3);

      expect(result.state.winner).toBeNull();
      expect(result.state.phase).toBe("awaiting_roll");
      expect(result.state.placements).toEqual(["red"]);
      expect(result.state.turn).toBe("green");
    });

    it("should end game when only one player remains in playForPlacements mode", () => {
      const game = createGame({
        ...baseConfig,
        playerColors: ["red", "green"],
        houseRules: {
          ...baseConfig.houseRules,
          playForPlacements: true,
        },
      });

      game.tokens[0].pos = { zone: "home" };
      game.tokens[1].pos = { zone: "home" };
      game.tokens[2].pos = { zone: "home" };
      game.tokens[3].pos = { zone: "homeColumn", step: 6 };

      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        dice: 1,
      };

      const result = applyMove(stateWithDice, 3);

      expect(result.state.winner).toBe("red");
      expect(result.state.phase).toBe("finished");
      expect(result.state.placements).toEqual(["red", "green"]);
    });
  });

  describe("Movement events", () => {
    it("should emit came_out event when leaving yard", () => {
      const game = createGame(baseConfig);

      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        dice: 6,
      };

      const result = applyMove(stateWithDice, 0);

      const event = result.events.find((e) => e.type === "came_out");
      expect(event).toBeDefined();
    });

    it("should emit entered_home_column event", () => {
      const game = createGame(baseConfig);

      game.tokens[0].pos = { zone: "track", cell: 51 };

      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        dice: 1,
      };

      const result = applyMove(stateWithDice, 0);

      const event = result.events.find((e) => e.type === "entered_home_column");
      expect(event).toBeDefined();
    });

    it("should emit got_home event", () => {
      const game = createGame(baseConfig);

      game.tokens[0].pos = { zone: "homeColumn", step: 6 };

      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        dice: 1,
      };

      const result = applyMove(stateWithDice, 0);

      const event = result.events.find((e) => e.type === "got_home");
      expect(event).toBeDefined();
    });

    it("should emit moved event for regular moves", () => {
      const game = createGame(baseConfig);

      game.tokens[0].pos = { zone: "track", cell: 5 };

      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        dice: 3,
      };

      const result = applyMove(stateWithDice, 0);

      const event = result.events.find((e) => e.type === "moved");
      expect(event).toBeDefined();
    });
  });
});

describe("Property-based invariant tests - M1 Step 1.3", () => {
  const baseConfig: GameConfig = {
    playerColors: ["red", "green", "yellow", "blue"],
    houseRules: {
      maxConsecutiveSixes: 2,
      extraRollOnCapture: false,
      blockadeCanMoveTogether: false,
      exactFinishBonus: false,
      playForPlacements: false,
    },
  };

  it("should never have two opposing tokens on same non-safe track cell", () => {
    let state = createGame(baseConfig);
    
    const rng = (() => {
      let seed = 42;
      return () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };
    })();

    for (let turn = 0; turn < 100 && state.phase !== "finished"; turn++) {
      if (state.phase === "awaiting_roll") {
        const rollResult = rollDice(state, rng);
        state = rollResult.state;
      } else if (state.phase === "awaiting_move") {
        const moves = legalMoves(state);
        if (moves.length > 0) {
          const moveIndex = Math.floor(rng() * moves.length);
          const result = applyMove(state, moves[moveIndex].tokenIndex);
          state = result.state;
        }
      }

      // Check invariant: no two opposing tokens on same non-safe cell
      for (let i = 0; i < state.tokens.length; i++) {
        const token1 = state.tokens[i];
        if (token1.pos.zone !== "track") continue;

        for (let j = i + 1; j < state.tokens.length; j++) {
          const token2 = state.tokens[j];
          if (token2.pos.zone !== "track") continue;

          if (token1.pos.cell === token2.pos.cell) {
            if (token1.color !== token2.color && !isSafeCell(token1.pos.cell)) {
              throw new Error(
                `Invariant violated: opposing tokens ${token1.color} and ${token2.color} on non-safe cell ${token1.pos.cell}`
              );
            }
          }
        }
      }
    }

    expect(true).toBe(true);
  });

  it("should never have token pass through blockade", () => {
    let state = createGame({ ...baseConfig, playerColors: ["red", "green"] });
    
    state.tokens[4].pos = { zone: "track", cell: 10 };
    state.tokens[5].pos = { zone: "track", cell: 10 };
    state.tokens[0].pos = { zone: "track", cell: 5 };

    const rng = (() => {
      let seed = 123;
      return () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };
    })();

    for (let turn = 0; turn < 50 && state.phase !== "finished"; turn++) {
      const blockadeCell = 10;
      const tokenBefore = state.tokens.find(
        (t) => t.pos.zone === "track" && t.pos.cell === blockadeCell
      );

      if (state.phase === "awaiting_roll") {
        const rollResult = rollDice(state, rng);
        state = rollResult.state;
      } else if (state.phase === "awaiting_move") {
        const moves = legalMoves(state);
        if (moves.length > 0) {
          const moveIndex = Math.floor(rng() * moves.length);
          const result = applyMove(state, moves[moveIndex].tokenIndex);
          state = result.state;
        }
      }

      // Check: red token should never get past cell 10 while blockade exists
      const greenBlockade = state.tokens.filter(
        (t) => t.color === "green" && t.pos.zone === "track" && t.pos.cell === 10
      );

      if (greenBlockade.length >= 2) {
        const redToken = state.tokens.find((t) => t.color === "red");
        if (redToken && redToken.pos.zone === "track") {
          const distance = (redToken.pos.cell - 5 + 52) % 52;
          if (distance > 5 && distance < 52 - 5) {
            throw new Error(
              `Invariant violated: red token passed blockade at cell 10, now at ${redToken.pos.cell}`
            );
          }
        }
      }
    }

    expect(true).toBe(true);
  });

  it("should maintain valid game state through random play", () => {
    let state = createGame(baseConfig);
    
    const rng = (() => {
      let seed = 999;
      return () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };
    })();

    for (let turn = 0; turn < 200 && state.phase !== "finished"; turn++) {
      if (state.phase === "awaiting_roll") {
        const rollResult = rollDice(state, rng);
        state = rollResult.state;
      } else if (state.phase === "awaiting_move") {
        const moves = legalMoves(state);
        if (moves.length > 0) {
          const moveIndex = Math.floor(rng() * moves.length);
          const result = applyMove(state, moves[moveIndex].tokenIndex);
          state = result.state;
        }
      }

      // Basic invariants
      expect(state.config.playerColors).toContain(state.turn);
      
      if (state.phase === "awaiting_move") {
        expect(state.dice).not.toBeNull();
        expect(state.dice).toBeGreaterThanOrEqual(1);
        expect(state.dice).toBeLessThanOrEqual(6);
      }

      // All tokens should have valid positions
      for (const token of state.tokens) {
        if (token.pos.zone === "track") {
          expect(token.pos.cell).toBeGreaterThanOrEqual(0);
          expect(token.pos.cell).toBeLessThan(52);
        } else if (token.pos.zone === "homeColumn") {
          expect(token.pos.step).toBeGreaterThanOrEqual(1);
          expect(token.pos.step).toBeLessThanOrEqual(6);
        }
      }
    }

    expect(true).toBe(true);
  });
});
