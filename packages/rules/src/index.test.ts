import { describe, it, expect } from "vitest";
import {
  createGame,
  START_CELLS,
  SAFE_CELLS,
  HOME_COLUMN_ENTRY,
  TRACK_SIZE,
  ARM_LENGTH,
  HOME_COLUMN_LENGTH,
  HOME_ENTRY_DISTANCE,
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
  type TokenPos,
} from "./index";

/** awaiting_move fields for a throw with only `value` left to play (the other die already spent). */
function oneDie(value: number): Pick<GameState, "dice" | "extraRollEarned"> {
  return {
    dice: [
      { value, used: false },
      { value, used: true },
    ],
    extraRollEarned: value === 6,
  };
}

/** RNG that throws the given faces in order (1–6), then repeats the last. */
function faces(...values: number[]): () => number {
  let i = 0;
  return () => (values[Math.min(i++, values.length - 1)] - 1) / 6;
}

/** awaiting_move fields for a fresh throw of `a` and `b`. */
function throwOf(a: number, b: number): Pick<GameState, "dice" | "extraRollEarned"> {
  return {
    dice: [
      { value: a, used: false },
      { value: b, used: false },
    ],
    extraRollEarned: a === 6 || b === 6,
  };
}

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
    expect(START_CELLS.green).toBe(17);
    expect(START_CELLS.yellow).toBe(34);
    expect(START_CELLS.blue).toBe(51);
  });

  it("should return correct start cells via getStartCell", () => {
    expect(getStartCell("red")).toBe(0);
    expect(getStartCell("green")).toBe(17);
    expect(getStartCell("yellow")).toBe(34);
    expect(getStartCell("blue")).toBe(51);
  });

  it("should identify start cells correctly", () => {
    expect(isStartCell(0, "red")).toBe(true);
    expect(isStartCell(17, "green")).toBe(true);
    expect(isStartCell(34, "yellow")).toBe(true);
    expect(isStartCell(51, "blue")).toBe(true);

    expect(isStartCell(0, "green")).toBe(false);
    expect(isStartCell(17, "red")).toBe(false);
    expect(isStartCell(34, "blue")).toBe(false);
    expect(isStartCell(68, "red")).toBe(true); // wraps to 0
  });

  it("should verify start cells are 17 positions apart (one arm)", () => {
    expect(ARM_LENGTH).toBe(17);
    expect(START_CELLS.green - START_CELLS.red).toBe(17);
    expect(START_CELLS.yellow - START_CELLS.green).toBe(17);
    expect(START_CELLS.blue - START_CELLS.yellow).toBe(17);
    expect(TRACK_SIZE - START_CELLS.blue + START_CELLS.red).toBe(17);
  });
});

describe("Board Topology - Safe Cells", () => {
  it("should have safe cells only at the four start stars (GAME_RULES.md §7)", () => {
    expect(getSafeCells()).toEqual([0, 17, 34, 51]);
  });

  it("should identify all start cells as safe", () => {
    expect(isSafeCell(0)).toBe(true); // red start
    expect(isSafeCell(17)).toBe(true); // green start
    expect(isSafeCell(34)).toBe(true); // yellow start
    expect(isSafeCell(51)).toBe(true); // blue start
    expect(isSafeCell(68)).toBe(true); // wraps to red start
  });

  it("should not treat the old 52-track star cells as safe", () => {
    expect(isSafeCell(8)).toBe(false);
    expect(isSafeCell(21)).toBe(false);
    expect(isSafeCell(47)).toBe(false);
  });

  it("should identify non-safe cells correctly", () => {
    expect(isSafeCell(1)).toBe(false);
    expect(isSafeCell(5)).toBe(false);
    expect(isSafeCell(13)).toBe(false);
    expect(isSafeCell(26)).toBe(false);
    expect(isSafeCell(39)).toBe(false);
    expect(isSafeCell(66)).toBe(false); // red home entry
    expect(isSafeCell(67)).toBe(false);
  });

  it("should have exactly one safe cell per arm", () => {
    expect(SAFE_CELLS.size).toBe(4);
    for (let arm = 0; arm < 4; arm++) {
      const armCells = Array.from({ length: ARM_LENGTH }, (_, i) => arm * ARM_LENGTH + i);
      expect(armCells.filter((c) => isSafeCell(c))).toHaveLength(1);
    }
  });
});

describe("Board Topology - Home Column Entry", () => {
  it("should have correct home column entry points", () => {
    expect(HOME_COLUMN_ENTRY.red).toBe(66);
    expect(HOME_COLUMN_ENTRY.green).toBe(15);
    expect(HOME_COLUMN_ENTRY.yellow).toBe(32);
    expect(HOME_COLUMN_ENTRY.blue).toBe(49);
  });

  it("should identify home column entry points correctly", () => {
    expect(isHomeColumnEntry(66, "red")).toBe(true);
    expect(isHomeColumnEntry(15, "green")).toBe(true);
    expect(isHomeColumnEntry(32, "yellow")).toBe(true);
    expect(isHomeColumnEntry(49, "blue")).toBe(true);

    expect(isHomeColumnEntry(66, "green")).toBe(false);
    expect(isHomeColumnEntry(15, "red")).toBe(false);
    expect(isHomeColumnEntry(67, "red")).toBe(false);
  });

  it("should verify home column entry is two cells before start (arm end cell)", () => {
    const colors: Color[] = ["red", "green", "yellow", "blue"];
    for (const color of colors) {
      const startCell = START_CELLS[color];
      const entryCell = HOME_COLUMN_ENTRY[color];
      const expectedEntry = (startCell - 2 + TRACK_SIZE) % TRACK_SIZE;
      expect(entryCell).toBe(expectedEntry);
      expect(getDistanceFromStart({ zone: "track", cell: entryCell }, color)).toBe(HOME_ENTRY_DISTANCE);
    }
    expect(HOME_ENTRY_DISTANCE).toBe(66);
  });
});

describe("Board Topology - Track Normalization", () => {
  it("should normalize positive track cells", () => {
    expect(normalizeTrackCell(0)).toBe(0);
    expect(normalizeTrackCell(25)).toBe(25);
    expect(normalizeTrackCell(67)).toBe(67);
  });

  it("should normalize cells beyond track size", () => {
    expect(normalizeTrackCell(68)).toBe(0);
    expect(normalizeTrackCell(69)).toBe(1);
    expect(normalizeTrackCell(85)).toBe(17);
    expect(normalizeTrackCell(136)).toBe(0); // 2 full laps
  });

  it("should normalize negative cells", () => {
    expect(normalizeTrackCell(-1)).toBe(67);
    expect(normalizeTrackCell(-17)).toBe(51);
    expect(normalizeTrackCell(-68)).toBe(0);
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
      cell: 17,
    });
    expect(computePath({ zone: "yard" }, 1, "yellow")).toEqual({
      zone: "track",
      cell: 34,
    });
    expect(computePath({ zone: "yard" }, 1, "blue")).toEqual({
      zone: "track",
      cell: 51,
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
    expect(computePath({ zone: "track", cell: 5 }, 10, "red")).toEqual({ zone: "track", cell: 15 });
    expect(computePath({ zone: "track", cell: 65 }, 5, "green")).toEqual({ zone: "track", cell: 2 });
    expect(computePath({ zone: "track", cell: 67 }, 1, "blue")).toEqual({ zone: "track", cell: 0 });
  });

  it("should enter home column on the step after the entry cell (66 steps from start)", () => {
    const pos = { zone: "track" as const, cell: 66 };
    const path = computePath(pos, 1, "red");
    expect(path).toEqual({ zone: "homeColumn", step: 1 });
  });

  it("should enter home column for all colors at correct positions", () => {
    expect(computePath({ zone: "track", cell: 66 }, 1, "red")).toEqual({
      zone: "homeColumn",
      step: 1,
    });
    expect(computePath({ zone: "track", cell: 15 }, 1, "green")).toEqual({
      zone: "homeColumn",
      step: 1,
    });
    expect(computePath({ zone: "track", cell: 32 }, 1, "yellow")).toEqual({
      zone: "homeColumn",
      step: 1,
    });
    expect(computePath({ zone: "track", cell: 49 }, 1, "blue")).toEqual({
      zone: "homeColumn",
      step: 1,
    });
  });

  it("should let other colours run past a colour's entry and start − 1 cells", () => {
    expect(computePath({ zone: "track", cell: 66 }, 1, "green")).toEqual({ zone: "track", cell: 67 });
    expect(computePath({ zone: "track", cell: 15 }, 2, "red")).toEqual({ zone: "track", cell: 17 });
    expect(computePath({ zone: "track", cell: 32 }, 1, "blue")).toEqual({ zone: "track", cell: 33 });
  });

  it("should never route a colour onto its own start − 1 cell", () => {
    const colors: Color[] = ["red", "green", "yellow", "blue"];
    for (const color of colors) {
      const skipped = normalizeTrackCell(START_CELLS[color] - 1);
      for (let d = 0; d <= HOME_ENTRY_DISTANCE; d++) {
        const cell = normalizeTrackCell(START_CELLS[color] + d);
        for (let roll = 1; roll <= 6; roll++) {
          expect(computePath({ zone: "track", cell }, roll, color)).not.toEqual({ zone: "track", cell: skipped });
        }
      }
      expect(computePath({ zone: "track", cell: skipped }, 1, color)).toBeNull();
    }
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

  it("should advance onto the 7th (last) home column cell", () => {
    expect(computePath({ zone: "homeColumn", step: 6 }, 1, "red")).toEqual({
      zone: "homeColumn",
      step: 7,
    });
  });

  it("should reach home from home column step 7", () => {
    const path = computePath({ zone: "homeColumn", step: 7 }, 1, "red");
    expect(path).toEqual({ zone: "home" });
  });

  it("should reject overshoot in home column", () => {
    expect(computePath({ zone: "homeColumn", step: 7 }, 2, "red")).toBeNull();
    expect(computePath({ zone: "homeColumn", step: 6 }, 3, "red")).toBeNull();
    expect(computePath({ zone: "homeColumn", step: 1 }, 8, "red")).toBeNull();
  });

  it("should reject movement from home", () => {
    expect(computePath({ zone: "home" }, 1, "red")).toBeNull();
    expect(computePath({ zone: "home" }, 6, "red")).toBeNull();
  });

  it("should take exactly TOTAL_JOURNEY_STEPS (74) single steps from start to home", () => {
    const colors: Color[] = ["red", "green", "yellow", "blue"];
    for (const color of colors) {
      let pos: TokenPos = { zone: "track", cell: START_CELLS[color] };
      const visitedTrack = new Set<number>([START_CELLS[color]]);
      let steps = 0;

      while (pos.zone !== "home") {
        const next = computePath(pos, 1, color);
        expect(next).not.toBeNull();
        steps++;
        if (next!.zone === "homeColumn" && pos.zone === "track") {
          expect(pos.cell).toBe(HOME_COLUMN_ENTRY[color]);
          expect(next).toEqual({ zone: "homeColumn", step: 1 });
        }
        if (next!.zone === "track") visitedTrack.add(next!.cell);
        pos = next!;
      }

      expect(steps).toBe(TOTAL_JOURNEY_STEPS);
      expect(steps).toBe(74);
      // start..entry inclusive = 67 distinct track cells (all but start − 1)
      expect(visitedTrack.size).toBe(HOME_ENTRY_DISTANCE + 1);
      expect(visitedTrack.has(normalizeTrackCell(START_CELLS[color] - 1))).toBe(false);
    }
  });

  it("should break the 74-step journey into 66 track + 7 home column + 1 centre", () => {
    let pos: TokenPos = { zone: "track", cell: 0 };
    const zones: string[] = [];
    while (pos.zone !== "home") {
      pos = computePath(pos, 1, "red")!;
      zones.push(pos.zone);
    }
    expect(zones.filter((z) => z === "track")).toHaveLength(HOME_ENTRY_DISTANCE);
    expect(zones.filter((z) => z === "homeColumn")).toHaveLength(HOME_COLUMN_LENGTH);
    expect(zones.filter((z) => z === "home")).toHaveLength(1);
  });

  it("should agree between single-step and multi-step paths for every reachable position", () => {
    const colors: Color[] = ["red", "green", "yellow", "blue"];
    for (const color of colors) {
      const route: TokenPos[] = [{ zone: "track", cell: START_CELLS[color] }];
      while (route[route.length - 1].zone !== "home") {
        route.push(computePath(route[route.length - 1], 1, color)!);
      }
      for (let i = 0; i < route.length; i++) {
        for (let roll = 1; roll <= 6; roll++) {
          const expected = i + roll < route.length ? route[i + roll] : null;
          expect(computePath(route[i], roll, color)).toEqual(expected);
        }
      }
    }
  });

  it("should handle multi-step moves correctly", () => {
    const startPos = { zone: "track" as const, cell: 0 };
    expect(computePath(startPos, 6, "red")).toEqual({
      zone: "track",
      cell: 6,
    });
    expect(computePath(startPos, 17, "red")).toEqual({
      zone: "track",
      cell: 17,
    });
  });

  it("should enter home column with multi-step move", () => {
    expect(computePath({ zone: "track", cell: 63 }, 4, "red")).toEqual({ zone: "homeColumn", step: 1 });
    expect(computePath({ zone: "track", cell: 61 }, 6, "red")).toEqual({ zone: "homeColumn", step: 1 });
    expect(computePath({ zone: "track", cell: 66 }, 6, "red")).toEqual({ zone: "homeColumn", step: 6 });
    expect(computePath({ zone: "track", cell: 12 }, 6, "green")).toEqual({ zone: "homeColumn", step: 3 });
  });

  it("should reach home with multi-step move from home column", () => {
    expect(computePath({ zone: "homeColumn", step: 5 }, 3, "red")).toEqual({
      zone: "home",
    });
    expect(computePath({ zone: "homeColumn", step: 2 }, 6, "red")).toEqual({
      zone: "home",
    });
  });
});

describe("Board Topology - Distance Calculation", () => {
  it("should calculate distance from start cell", () => {
    expect(getDistanceFromStart({ zone: "track", cell: 0 }, "red")).toBe(0);
    expect(getDistanceFromStart({ zone: "track", cell: 5 }, "red")).toBe(5);
    expect(getDistanceFromStart({ zone: "track", cell: 17 }, "red")).toBe(17);
  });

  it("should calculate distance with wraparound", () => {
    expect(getDistanceFromStart({ zone: "track", cell: 66 }, "red")).toBe(66);
    expect(getDistanceFromStart({ zone: "track", cell: 0 }, "green")).toBe(51);
    expect(getDistanceFromStart({ zone: "track", cell: 15 }, "green")).toBe(66);
  });

  it("should return null for non-track positions", () => {
    expect(getDistanceFromStart({ zone: "yard" }, "red")).toBeNull();
    expect(
      getDistanceFromStart({ zone: "homeColumn", step: 3 }, "red")
    ).toBeNull();
    expect(getDistanceFromStart({ zone: "home" }, "red")).toBeNull();
  });

  it("should calculate correct distances for all colors", () => {
    expect(getDistanceFromStart({ zone: "track", cell: 17 }, "green")).toBe(0);
    expect(getDistanceFromStart({ zone: "track", cell: 34 }, "yellow")).toBe(0);
    expect(getDistanceFromStart({ zone: "track", cell: 51 }, "blue")).toBe(0);

    expect(getDistanceFromStart({ zone: "track", cell: 24 }, "green")).toBe(7);
    expect(getDistanceFromStart({ zone: "track", cell: 38 }, "yellow")).toBe(4);
    expect(getDistanceFromStart({ zone: "track", cell: 57 }, "blue")).toBe(6);
    expect(getDistanceFromStart({ zone: "track", cell: 49 }, "blue")).toBe(66);
  });
});

describe("Board Constants", () => {
  it("should have correct track size (4 arms × 17)", () => {
    expect(TRACK_SIZE).toBe(68);
    expect(TRACK_SIZE).toBe(ARM_LENGTH * 4);
  });

  it("should have correct home column length", () => {
    expect(HOME_COLUMN_LENGTH).toBe(7);
  });

  it("should have correct total journey steps", () => {
    expect(TOTAL_JOURNEY_STEPS).toBe(74);
    expect(TOTAL_JOURNEY_STEPS).toBe(HOME_ENTRY_DISTANCE + HOME_COLUMN_LENGTH + 1);
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
        ...oneDie(6),
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
        ...oneDie(3),
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
        ...oneDie(2),
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
        ...oneDie(5),
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
        ...oneDie(3),
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
        ...oneDie(5),
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
      
      game.tokens[0].pos = { zone: "homeColumn", step: 7 };
      
      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        ...oneDie(1),
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
      
      game.tokens[0].pos = { zone: "homeColumn", step: 7 };
      
      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        ...oneDie(2),
      };

      const moves = legalMoves(stateWithDice);

      const overshootMove = moves.find((m: any) => {
        const token = stateWithDice.tokens[m.tokenIndex];
        return token.color === "red" && token.index === 0;
      });

      expect(overshootMove).toBeUndefined();
    });

    it("should move from track into the home column past the entry cell", () => {
      // A single die (max 6) from the track reaches at most homeColumn step 6
      // (from the entry cell 66), so track moves can never overshoot home.
      const game = createGame({ ...baseConfig, playerColors: ["red", "green"] });
      
      game.tokens[0].pos = { zone: "track", cell: 65 };
      
      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        ...oneDie(2),
      };

      const moves = legalMoves(stateWithDice);

      const homeColumnMove = moves.find((m: any) => {
        const token = stateWithDice.tokens[m.tokenIndex];
        return token.color === "red" && token.index === 0;
      });

      // 65 → 66 (entry) → homeColumn step 1; red never lands on 67
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
        ...oneDie(3),
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
        ...oneDie(5),
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
        ...oneDie(2),
      };

      const moves = legalMoves(stateWithDice);

      expect(moves).toEqual([]);
    });
  });

  describe("Additional Legal Move Tests", () => {
    it("should annotate captures correctly", () => {
      const game = createGame({ ...baseConfig, playerColors: ["red", "green"] });
      
      // Cell 7 is NOT safe (safe cells are the start stars 0, 17, 34, 51)
      game.tokens[0].pos = { zone: "track", cell: 5 };
      game.tokens[4].pos = { zone: "track", cell: 7 };
      
      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        ...oneDie(2),
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
      
      // Cell 17 (green start star) IS safe
      game.tokens[0].pos = { zone: "track", cell: 14 };
      game.tokens[4].pos = { zone: "track", cell: 17 };
      
      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        ...oneDie(3),
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
      
      // Both tokens can coexist on safe cell 17
      game.tokens[0].pos = { zone: "track", cell: 14 };
      game.tokens[4].pos = { zone: "track", cell: 17 };
      
      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        ...oneDie(3),
      };

      const moves = legalMoves(stateWithDice);

      expect(moves.find((m) => m.tokenIndex === 0)?.resulting).toEqual({ zone: "track", cell: 17 });
    });

    it("should capture on a cell that was a star on the old 52 track", () => {
      const game = createGame({ ...baseConfig, playerColors: ["red", "green"] });

      game.tokens[0].pos = { zone: "track", cell: 5 };
      game.tokens[4].pos = { zone: "track", cell: 8 };

      const moves = legalMoves({ ...game, phase: "awaiting_move" as const, ...oneDie(3) });

      expect(moves.find((m) => m.tokenIndex === 0)?.captures).toEqual({ color: "green", index: 0 });
    });

    it("should not allow moves when phase is not awaiting_move", () => {
      const game = createGame(baseConfig);
      const stateAwaitingRoll = {
        ...game,
        phase: "awaiting_roll" as const,
        ...oneDie(6),
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

    expect(result.values).toEqual([4, 4]);
    expect(result.state.dice).toEqual([
      { value: 4, used: false },
      { value: 4, used: false },
    ]);
    expect(result.state.phase).toBe("awaiting_move");
    expect(result.state.extraRollEarned).toBe(false);
  });

  it("should throw two independent dice, one rng call each", () => {
    const game = createGame(baseConfig);
    game.tokens[0].pos = { zone: "track", cell: 5 };

    const result = rollDice(game, faces(2, 5));

    expect(result.values).toEqual([2, 5]);
    expect(result.state.dice!.map((d) => d.value)).toEqual([2, 5]);
  });

  it("should roll 6 and allow extra turn potential", () => {
    const game = createGame(baseConfig);
    const rng = () => 5 / 6; // Will produce 6

    const result = rollDice(game, rng);

    expect(result.values).toEqual([6, 6]);
    expect(result.state.extraRollEarned).toBe(true);
    expect(result.state.consecutiveSixes).toBe(1);
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

    expect(result.values).toEqual([6, 6]);
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
        ...oneDie(2),
      };

      const result = applyMove(stateWithDice, 0, 0);

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
        ...oneDie(3),
      };

      const moves = legalMoves(stateWithDice);
      const blockedMove = moves.find(m => m.tokenIndex === 0);

      expect(blockedMove).toBeUndefined();
    });
  });

  describe("Edge Case 7: Safe cell multi-color coexistence", () => {
    it("should allow multiple colors on safe cells", () => {
      const game = createGame(baseConfig);
      
      // Green start star (17) with green and yellow singles on it
      game.tokens[0].pos = { zone: "track", cell: 14 };
      game.tokens[4].pos = { zone: "track", cell: 17 };
      game.tokens[8].pos = { zone: "track", cell: 17 };

      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        ...oneDie(3),
      };

      const result = applyMove(stateWithDice, 0, 0);

      expect(result.state.tokens[0].pos).toEqual({ zone: "track", cell: 17 });
      expect(result.state.tokens[4].pos).toEqual({ zone: "track", cell: 17 });
      expect(result.state.tokens[8].pos).toEqual({ zone: "track", cell: 17 });
      
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
        ...oneDie(6),
      };

      const result = applyMove(stateWithDice, 0, 0);

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
        ...oneDie(2),
      };

      const result = applyMove(stateWithDice, 0, 0);

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
        ...oneDie(3),
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
        ...oneDie(3),
      };

      const result = applyMove(stateWithDice, 0, 0);

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
        ...oneDie(3),
      };

      const result = applyMove(stateWithDice, 0, 0);

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
        ...oneDie(2),
      };

      const moves = legalMoves(stateWithDice);
      
      expect(moves.length).toBeGreaterThan(0);
      
      // Server can pick any legal move (simulating random selection)
      const result = applyMove(stateWithDice, moves[0].tokenIndex, moves[0].dieIndex);
      
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
        ...oneDie(2),
      };

      const result = applyMove(stateWithDice, 1, 0);

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
        ...oneDie(2),
      };

      const result = applyMove(stateWithDice, 0, 0);

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
        ...oneDie(6),
      };

      const result = applyMove(stateWithDice, 0, 0);

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
        ...oneDie(2),
      };

      const result = applyMove(stateWithDice, 0, 0);

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
        ...oneDie(2),
      };

      const result = applyMove(stateWithDice, 0, 0);

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

      game.tokens[0].pos = { zone: "homeColumn", step: 7 };

      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        ...oneDie(1),
      };

      const result = applyMove(stateWithDice, 0, 0);

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
      game.tokens[3].pos = { zone: "homeColumn", step: 7 };

      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        ...oneDie(1),
      };

      const result = applyMove(stateWithDice, 3, 0);

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
      game.tokens[3].pos = { zone: "homeColumn", step: 7 };

      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        ...oneDie(1),
      };

      const result = applyMove(stateWithDice, 3, 0);

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
      game.tokens[3].pos = { zone: "homeColumn", step: 7 };

      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        ...oneDie(1),
      };

      const result = applyMove(stateWithDice, 3, 0);

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
        ...oneDie(6),
      };

      const result = applyMove(stateWithDice, 0, 0);

      const event = result.events.find((e) => e.type === "came_out");
      expect(event).toBeDefined();
    });

    it("should emit entered_home_column event", () => {
      const game = createGame(baseConfig);

      game.tokens[0].pos = { zone: "track", cell: HOME_COLUMN_ENTRY.red };

      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        ...oneDie(1),
      };

      const result = applyMove(stateWithDice, 0, 0);

      const event = result.events.find((e) => e.type === "entered_home_column");
      expect(event).toBeDefined();
    });

    it("should emit got_home event", () => {
      const game = createGame(baseConfig);

      game.tokens[0].pos = { zone: "homeColumn", step: 7 };

      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        ...oneDie(1),
      };

      const result = applyMove(stateWithDice, 0, 0);

      const event = result.events.find((e) => e.type === "got_home");
      expect(event).toBeDefined();
    });

    it("should emit moved event for regular moves", () => {
      const game = createGame(baseConfig);

      game.tokens[0].pos = { zone: "track", cell: 5 };

      const stateWithDice = {
        ...game,
        phase: "awaiting_move" as const,
        ...oneDie(3),
      };

      const result = applyMove(stateWithDice, 0, 0);

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
          const result = applyMove(state, moves[moveIndex].tokenIndex, moves[moveIndex].dieIndex);
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
          const result = applyMove(state, moves[moveIndex].tokenIndex, moves[moveIndex].dieIndex);
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
          const distance = (redToken.pos.cell - 5 + TRACK_SIZE) % TRACK_SIZE;
          if (distance > 5 && distance < TRACK_SIZE - 5) {
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
          const result = applyMove(state, moves[moveIndex].tokenIndex, moves[moveIndex].dieIndex);
          state = result.state;
        }
      }

      // Basic invariants
      expect(state.config.playerColors).toContain(state.turn);
      
      if (state.phase === "awaiting_move") {
        expect(state.dice).not.toBeNull();
        expect(state.dice!.some((d) => !d.used)).toBe(true);
        for (const die of state.dice!) {
          expect(die.value).toBeGreaterThanOrEqual(1);
          expect(die.value).toBeLessThanOrEqual(6);
        }
      } else {
        expect(state.dice).toBeNull();
      }

      // All tokens should have valid positions
      for (const token of state.tokens) {
        if (token.pos.zone === "track") {
          expect(token.pos.cell).toBeGreaterThanOrEqual(0);
          expect(token.pos.cell).toBeLessThan(TRACK_SIZE);
        } else if (token.pos.zone === "homeColumn") {
          expect(token.pos.step).toBeGreaterThanOrEqual(1);
          expect(token.pos.step).toBeLessThanOrEqual(HOME_COLUMN_LENGTH);
        }
      }
    }

    expect(true).toBe(true);
  });

  it("should play a seeded 4-player game to completion within 68/7 bounds", () => {
    let state = createGame(baseConfig);

    const rng = (() => {
      let seed = 2026;
      return () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };
    })();

    const reachedHomeStep = new Set<number>();
    for (let turn = 0; turn < 20000 && state.phase !== "finished"; turn++) {
      if (state.phase === "awaiting_roll") {
        state = rollDice(state, rng).state;
      } else {
        const moves = legalMoves(state);
        const move = moves[Math.floor(rng() * moves.length)];
        state = applyMove(state, move.tokenIndex, move.dieIndex).state;
      }

      for (const token of state.tokens) {
        if (token.pos.zone === "track") {
          expect(Number.isInteger(token.pos.cell)).toBe(true);
          expect(token.pos.cell).toBeGreaterThanOrEqual(0);
          expect(token.pos.cell).toBeLessThan(TRACK_SIZE);
          expect(token.pos.cell).not.toBe(normalizeTrackCell(START_CELLS[token.color] - 1));
        } else if (token.pos.zone === "homeColumn") {
          expect(token.pos.step).toBeGreaterThanOrEqual(1);
          expect(token.pos.step).toBeLessThanOrEqual(HOME_COLUMN_LENGTH);
          reachedHomeStep.add(token.pos.step);
        }
      }
    }

    expect(state.phase).toBe("finished");
    expect(state.winner).not.toBeNull();
    expect(state.tokens.filter((t) => t.color === state.winner).every((t) => t.pos.zone === "home")).toBe(true);
    expect(Math.max(...reachedHomeStep)).toBe(HOME_COLUMN_LENGTH);
  });
});

describe("Two dice (GAME_RULES.md §2-§4, §8)", () => {
  const rules: GameConfig["houseRules"] = {
    maxConsecutiveSixes: 2,
    extraRollOnCapture: false,
    blockadeCanMoveTogether: false,
    exactFinishBonus: false,
    playForPlacements: false,
  };
  /** red tokens 0–3, green tokens 4–7 */
  const twoPlayer = (houseRules: Partial<GameConfig["houseRules"]> = {}) =>
    createGame({ playerColors: ["red", "green"], houseRules: { ...rules, ...houseRules } });
  const track = (cell: number): TokenPos => ({ zone: "track", cell });
  const rolled = (game: GameState, a: number, b: number): GameState => ({
    ...game,
    phase: "awaiting_move",
    ...throwOf(a, b),
  });

  describe("legalMoves", () => {
    it("lists one move per token per unused die, tagged with dieIndex and steps", () => {
      const game = twoPlayer();
      game.tokens[0].pos = track(5);

      const moves = legalMoves(rolled(game, 2, 4));

      expect(moves).toEqual([
        { tokenIndex: 0, dieIndex: 0, steps: 2, resulting: track(7), captures: undefined },
        { tokenIndex: 0, dieIndex: 1, steps: 4, resulting: track(9), captures: undefined },
      ]);
    });

    it("lists both dice separately when they show the same value", () => {
      const game = twoPlayer();
      game.tokens[0].pos = track(5);

      const moves = legalMoves(rolled(game, 3, 3));

      expect(moves.map((m) => m.dieIndex)).toEqual([0, 1]);
      expect(moves.every((m) => m.steps === 3)).toBe(true);
    });

    it("offers nothing for a spent die", () => {
      const game = twoPlayer();
      game.tokens[0].pos = track(5);
      const state: GameState = {
        ...rolled(game, 2, 4),
        dice: [
          { value: 2, used: true },
          { value: 4, used: false },
        ],
      };

      expect(legalMoves(state).map((m) => m.dieIndex)).toEqual([1]);
    });

    it("only the die showing 6 can bring a token out", () => {
      const moves = legalMoves(rolled(twoPlayer(), 3, 6));

      expect(moves).toHaveLength(4);
      expect(moves.every((m) => m.dieIndex === 1 && m.resulting.zone === "track")).toBe(true);
    });
  });

  describe("playing a throw", () => {
    it("6 + 3 from the yard: come out with the 6, then move that token 3", () => {
      const state = rolled(twoPlayer(), 6, 3);

      const first = applyMove(state, 0, 0);
      expect(first.events.map((e) => e.type)).toEqual(["came_out"]);
      expect(first.state.phase).toBe("awaiting_move");
      expect(first.state.turn).toBe("red");
      expect(first.state.dice).toEqual([
        { value: 6, used: true },
        { value: 3, used: false },
      ]);
      expect(legalMoves(first.state)).toEqual([
        { tokenIndex: 0, dieIndex: 1, steps: 3, resulting: track(3), captures: undefined },
      ]);

      const second = applyMove(first.state, 0, 1);
      expect(second.state.tokens[0].pos).toEqual(track(3));
      // The throw showed a 6: bonus roll for red
      expect(second.events.map((e) => e.type)).toEqual(["moved", "extra_turn"]);
      expect(second.state).toMatchObject({ turn: "red", phase: "awaiting_roll", dice: null, extraRollEarned: false });
    });

    it("splits the dice between two tokens", () => {
      const game = twoPlayer();
      game.tokens[0].pos = track(5);
      game.tokens[1].pos = track(20);

      const first = applyMove(rolled(game, 2, 4), 0, 0);
      const second = applyMove(first.state, 1, 1);

      expect(second.state.tokens[0].pos).toEqual(track(7));
      expect(second.state.tokens[1].pos).toEqual(track(24));
      expect(second.state.turn).toBe("green");
      expect(second.events.at(-1)).toEqual({ type: "turn_passed", color: "green" });
    });

    it("moves one token by the total as two landings, in either order", () => {
      const game = twoPlayer();
      game.tokens[0].pos = track(5);

      const aThenB = applyMove(applyMove(rolled(game, 2, 4), 0, 0).state, 0, 1).state;
      const bThenA = applyMove(applyMove(rolled(game, 2, 4), 0, 1).state, 0, 0).state;

      expect(aThenB.tokens[0].pos).toEqual(track(11));
      expect(bThenA.tokens[0].pos).toEqual(track(11));
    });

    it("the intermediate landing of a total move is real: it captures", () => {
      const game = twoPlayer();
      game.tokens[0].pos = track(5);
      game.tokens[4].pos = track(7);

      const first = applyMove(rolled(game, 2, 4), 0, 0);
      expect(first.events.map((e) => e.type)).toEqual(["captured", "moved"]);
      expect(first.state.tokens[4].pos).toEqual({ zone: "yard" });

      const second = applyMove(first.state, 0, 1);
      expect(second.state.tokens[0].pos).toEqual(track(11));
    });

    it("a total move cannot hop a blockade; the unplayable die is forfeited", () => {
      const game = twoPlayer();
      game.tokens[0].pos = track(5);
      game.tokens[4].pos = track(9);
      game.tokens[5].pos = track(9);
      const state = rolled(game, 2, 3);

      // 3 lands on 8, 2 lands on 7; after either, the other die would pass cell 9
      expect(legalMoves(state).map((m) => m.dieIndex)).toEqual([0, 1]);
      const result = applyMove(state, 0, 0);

      expect(result.state.tokens[0].pos).toEqual(track(7));
      expect(result.events.at(-1)).toEqual({ type: "turn_passed", color: "green" });
      expect(result.state.dice).toBeNull();
    });

    it("forfeits the second die when only overshoots remain", () => {
      const game = twoPlayer();
      game.tokens[0].pos = { zone: "homeColumn", step: 6 };
      game.tokens[1].pos = { zone: "home" };
      game.tokens[2].pos = { zone: "home" };
      game.tokens[3].pos = { zone: "home" };
      const state = rolled(game, 1, 5);

      expect(legalMoves(state).map((m) => m.dieIndex)).toEqual([0]);
      const result = applyMove(state, 0, 0);

      expect(result.state.tokens[0].pos).toEqual({ zone: "homeColumn", step: 7 });
      expect(result.state.turn).toBe("green");
    });

    it("6-6 can bring two tokens out, then earns one bonus roll", () => {
      const first = applyMove(rolled(twoPlayer(), 6, 6), 0, 0);
      expect(first.state.phase).toBe("awaiting_move");

      const second = applyMove(first.state, 1, 1);

      expect(second.state.tokens[0].pos).toEqual(track(0));
      expect(second.state.tokens[1].pos).toEqual(track(0));
      expect(second.events.map((e) => e.type)).toEqual(["came_out", "blockade_formed", "extra_turn"]);
      expect(second.state).toMatchObject({ turn: "red", phase: "awaiting_roll" });
    });

    it("a capture bonus waits until the second die is played", () => {
      const game = twoPlayer({ extraRollOnCapture: true });
      game.tokens[0].pos = track(5);
      game.tokens[1].pos = track(20);
      game.tokens[4].pos = track(7);

      const first = applyMove(rolled(game, 2, 4), 0, 0);
      expect(first.state).toMatchObject({ phase: "awaiting_move", extraRollEarned: true });

      const second = applyMove(first.state, 1, 1);
      expect(second.events.map((e) => e.type)).toEqual(["moved", "extra_turn"]);
      expect(second.state.turn).toBe("red");
    });

    it("finishing with a die left ends the game and clears the dice", () => {
      const game = twoPlayer();
      game.tokens[0].pos = { zone: "homeColumn", step: 7 };
      game.tokens[1].pos = { zone: "home" };
      game.tokens[2].pos = { zone: "home" };
      game.tokens[3].pos = { zone: "home" };

      const result = applyMove(rolled(game, 1, 4), 0, 0);

      expect(result.state).toMatchObject({ phase: "finished", winner: "red", dice: null });
      expect(result.events.at(-1)).toMatchObject({ type: "game_over", color: "red", placement: 1 });
    });

    it("finishing mid-throw while playing for placements passes the turn", () => {
      const game = createGame({
        playerColors: ["red", "green", "yellow"],
        houseRules: { ...rules, playForPlacements: true },
      });
      game.tokens[0].pos = { zone: "homeColumn", step: 7 };
      game.tokens[1].pos = { zone: "home" };
      game.tokens[2].pos = { zone: "home" };
      game.tokens[3].pos = { zone: "home" };
      game.tokens[4].pos = track(20);

      const result = applyMove(rolled(game, 1, 6), 0, 0);

      expect(result.state.placements).toEqual(["red"]);
      expect(result.state).toMatchObject({ turn: "green", phase: "awaiting_roll", dice: null, consecutiveSixes: 0 });
    });

    it("does not mutate the input state", () => {
      const game = twoPlayer();
      game.tokens[0].pos = track(5);
      const state = rolled(game, 2, 4);
      const snapshot = JSON.parse(JSON.stringify(state));

      applyMove(state, 0, 0);

      expect(state).toEqual(snapshot);
    });

    it("rejects a spent die, a bad die index, and a token the die cannot move", () => {
      const game = twoPlayer();
      game.tokens[0].pos = track(5);
      const first = applyMove(rolled(game, 2, 4), 0, 0).state;

      expect(() => applyMove(first, 0, 0)).toThrow(/already been played/);
      expect(() => applyMove(first, 0, 2)).toThrow(/Invalid die index/);
      expect(() => applyMove(first, 1, 1)).toThrow(/not legal/);
    });
  });

  describe("rolling", () => {
    it("a 6 on either die earns a bonus roll and extends the streak", () => {
      const game = twoPlayer();
      game.tokens[0].pos = track(5);

      const result = rollDice(game, faces(2, 6));

      expect(result.state).toMatchObject({ extraRollEarned: true, consecutiveSixes: 1 });
    });

    it("a throw without a 6 resets the streak", () => {
      const game = twoPlayer();
      game.tokens[0].pos = track(5);

      const result = rollDice({ ...game, consecutiveSixes: 2 }, faces(2, 3));

      expect(result.state).toMatchObject({ extraRollEarned: false, consecutiveSixes: 0, phase: "awaiting_move" });
    });

    it("a third consecutive throw showing a 6 forfeits even with one six", () => {
      const game = twoPlayer();
      game.tokens[0].pos = track(5);

      const result = rollDice({ ...game, consecutiveSixes: 2 }, faces(6, 2));

      expect(result.values).toEqual([6, 2]);
      expect(result.events).toEqual([{ type: "turn_passed", color: "green" }]);
      expect(result.state).toMatchObject({ turn: "green", phase: "awaiting_roll", dice: null, consecutiveSixes: 0 });
    });

    it("maxConsecutiveSixes 3 allows the third throw and forfeits the fourth", () => {
      const game = twoPlayer({ maxConsecutiveSixes: 3 });
      game.tokens[0].pos = track(5);

      expect(rollDice({ ...game, consecutiveSixes: 2 }, faces(6, 1)).state.phase).toBe("awaiting_move");
      expect(rollDice({ ...game, consecutiveSixes: 3 }, faces(6, 1)).state.turn).toBe("green");
    });

    it("the streak carries through bonus rolls within a turn", () => {
      const game = twoPlayer();
      const afterFirst = rollDice(game, faces(6, 6)).state;
      const bonus = applyMove(applyMove(afterFirst, 0, 0).state, 1, 1).state;

      expect(bonus).toMatchObject({ turn: "red", phase: "awaiting_roll", consecutiveSixes: 1 });

      const second = rollDice(bonus, faces(6, 1)).state;
      expect(second.consecutiveSixes).toBe(2);
    });

    it("no playable die with a 6 thrown: the bonus roll still stands", () => {
      const game = twoPlayer();
      // Own blockade on the start cell blocks coming out; green blockade on 1 blocks the pair
      game.tokens[0].pos = track(0);
      game.tokens[1].pos = track(0);
      game.tokens[4].pos = track(1);
      game.tokens[5].pos = track(1);

      const result = rollDice(game, faces(6, 1));

      expect(result.events).toEqual([{ type: "extra_turn", color: "red" }]);
      expect(result.state).toMatchObject({ turn: "red", phase: "awaiting_roll", dice: null, consecutiveSixes: 1 });
    });

    it("no playable die without a 6: the turn passes at once", () => {
      const result = rollDice(twoPlayer(), faces(2, 5));

      expect(result.events).toEqual([{ type: "turn_passed", color: "green" }]);
      expect(result.state).toMatchObject({ turn: "green", phase: "awaiting_roll", dice: null });
    });

    it("skips finished players when the turn passes", () => {
      const game = createGame({
        playerColors: ["red", "green", "yellow"],
        houseRules: { ...rules, playForPlacements: true },
      });

      const result = rollDice({ ...game, placements: ["green"] }, faces(1, 2));

      expect(result.state.turn).toBe("yellow");
    });
  });
});
