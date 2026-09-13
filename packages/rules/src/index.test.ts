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
  type Color,
  type GameConfig,
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
