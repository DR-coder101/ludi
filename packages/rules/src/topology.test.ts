/**
 * Tests for topology helpers
 * Verifying board layout constants and position advancement
 */

import { describe, it, expect } from "vitest";
import {
  START_CELLS,
  STAR_CELLS,
  isSafeCell,
  isStartCell,
  getHomeColumnEntranceCell,
  advancePosition,
  positionsEqual,
  TRACK_SIZE,
  HOME_COLUMN_LENGTH,
} from "./topology";

describe("topology", () => {
  describe("constants", () => {
    it("should have correct start cells per GAME_RULES §1", () => {
      expect(START_CELLS.red).toBe(0);
      expect(START_CELLS.green).toBe(13);
      expect(START_CELLS.yellow).toBe(26);
      expect(START_CELLS.blue).toBe(39);
    });

    it("should have correct star safe cells", () => {
      expect(STAR_CELLS).toEqual([8, 21, 34, 47]);
    });

    it("should have correct track and home column sizes", () => {
      expect(TRACK_SIZE).toBe(52);
      expect(HOME_COLUMN_LENGTH).toBe(6);
    });
  });

  describe("isSafeCell", () => {
    it("should return true for start cells", () => {
      expect(isSafeCell(0)).toBe(true);
      expect(isSafeCell(13)).toBe(true);
      expect(isSafeCell(26)).toBe(true);
      expect(isSafeCell(39)).toBe(true);
    });

    it("should return true for star cells", () => {
      expect(isSafeCell(8)).toBe(true);
      expect(isSafeCell(21)).toBe(true);
      expect(isSafeCell(34)).toBe(true);
      expect(isSafeCell(47)).toBe(true);
    });

    it("should return false for non-safe cells", () => {
      expect(isSafeCell(1)).toBe(false);
      expect(isSafeCell(15)).toBe(false);
      expect(isSafeCell(30)).toBe(false);
    });
  });

  describe("isStartCell", () => {
    it("should return true only for color's own start cell", () => {
      expect(isStartCell(0, "red")).toBe(true);
      expect(isStartCell(13, "red")).toBe(false);
      expect(isStartCell(13, "green")).toBe(true);
      expect(isStartCell(26, "yellow")).toBe(true);
      expect(isStartCell(39, "blue")).toBe(true);
    });
  });

  describe("getHomeColumnEntranceCell", () => {
    it("should return correct entrance cell for each color", () => {
      expect(getHomeColumnEntranceCell("red")).toBe(51);
      expect(getHomeColumnEntranceCell("green")).toBe(12);
      expect(getHomeColumnEntranceCell("yellow")).toBe(25);
      expect(getHomeColumnEntranceCell("blue")).toBe(38);
    });
  });

  describe("advancePosition", () => {
    describe("from yard", () => {
      it("should move to start cell on exactly 6", () => {
        const result = advancePosition({ zone: "yard" }, 6, "red");
        expect(result).toEqual({ zone: "track", cell: 0 });
      });

      it("should return null on non-6 from yard", () => {
        expect(advancePosition({ zone: "yard" }, 1, "red")).toBeNull();
        expect(advancePosition({ zone: "yard" }, 5, "red")).toBeNull();
      });
    });

    describe("on track", () => {
      it("should advance by dice value", () => {
        const result = advancePosition({ zone: "track", cell: 5 }, 3, "red");
        expect(result).toEqual({ zone: "track", cell: 8 });
      });

      it("should wrap around track", () => {
        const result = advancePosition({ zone: "track", cell: 10 }, 5, "red");
        expect(result).toEqual({ zone: "track", cell: 15 });
      });

      it("should enter home column for red at cell 51", () => {
        const result = advancePosition({ zone: "track", cell: 51 }, 3, "red");
        expect(result).toEqual({ zone: "homeColumn", step: 2 });
      });

      it("should enter home column for green at cell 12", () => {
        const result = advancePosition({ zone: "track", cell: 12 }, 4, "green");
        expect(result).toEqual({ zone: "homeColumn", step: 3 });
      });

      it("should return null if would overshoot home column", () => {
        const result = advancePosition({ zone: "track", cell: 51 }, 10, "red");
        expect(result).toBeNull();
      });

      it("should handle entering home column with exact count", () => {
        const result = advancePosition({ zone: "track", cell: 45 }, 6, "red");
        expect(result).toEqual({ zone: "track", cell: 51 });
      });
    });

    describe("in home column", () => {
      it("should advance within home column", () => {
        const result = advancePosition({ zone: "homeColumn", step: 2 }, 3, "red");
        expect(result).toEqual({ zone: "homeColumn", step: 5 });
      });

      it("should reach home with exact count", () => {
        const result = advancePosition({ zone: "homeColumn", step: 3 }, 3, "red");
        expect(result).toEqual({ zone: "home" });
      });

      it("should return null on overshoot", () => {
        const result = advancePosition({ zone: "homeColumn", step: 3 }, 5, "red");
        expect(result).toBeNull();
      });

      it("should handle final step to home", () => {
        const result = advancePosition({ zone: "homeColumn", step: 5 }, 1, "red");
        expect(result).toEqual({ zone: "home" });
      });
    });

    describe("from home", () => {
      it("should return null (cannot move from home)", () => {
        const result = advancePosition({ zone: "home" }, 5, "red");
        expect(result).toBeNull();
      });
    });

    describe("zero steps", () => {
      it("should return same position for 0 steps", () => {
        const pos = { zone: "track" as const, cell: 10 };
        const result = advancePosition(pos, 0, "red");
        expect(result).toEqual(pos);
      });
    });
  });

  describe("positionsEqual", () => {
    it("should return true for identical yard positions", () => {
      expect(positionsEqual({ zone: "yard" }, { zone: "yard" })).toBe(true);
    });

    it("should return true for identical home positions", () => {
      expect(positionsEqual({ zone: "home" }, { zone: "home" })).toBe(true);
    });

    it("should return true for identical track positions", () => {
      expect(
        positionsEqual({ zone: "track", cell: 5 }, { zone: "track", cell: 5 })
      ).toBe(true);
    });

    it("should return true for identical home column positions", () => {
      expect(
        positionsEqual(
          { zone: "homeColumn", step: 3 },
          { zone: "homeColumn", step: 3 }
        )
      ).toBe(true);
    });

    it("should return false for different zones", () => {
      expect(positionsEqual({ zone: "yard" }, { zone: "home" })).toBe(false);
    });

    it("should return false for different track cells", () => {
      expect(
        positionsEqual({ zone: "track", cell: 5 }, { zone: "track", cell: 6 })
      ).toBe(false);
    });

    it("should return false for different home column steps", () => {
      expect(
        positionsEqual(
          { zone: "homeColumn", step: 2 },
          { zone: "homeColumn", step: 3 }
        )
      ).toBe(false);
    });
  });
});
