/**
 * Tests for lib/decoration-patterns.ts
 *
 * Tests decoration pattern positioning logic.
 * Ensures correct mathematical calculations for element positions.
 */

import { describe, it, expect } from "vitest";
import {
  getPatternPositions,
  getPatternLabel,
} from "@/lib/decoration-patterns";
import { DecorationPatterns } from "@/types/decoration";

describe("getPatternPositions", () => {
  describe("NONE pattern", () => {
    it("should return empty array", () => {
      const positions = getPatternPositions(DecorationPatterns.NONE);
      expect(positions).toEqual([]);
    });
  });

  describe("CORNERS pattern", () => {
    it("should return exactly 4 positions", () => {
      const positions = getPatternPositions(DecorationPatterns.CORNERS);
      expect(positions).toHaveLength(4);
    });

    it("should have correct corner positions", () => {
      const positions = getPatternPositions(DecorationPatterns.CORNERS);

      // Top-left
      expect(positions[0]).toEqual({ top: 16, left: 16, rotate: 0 });
      // Top-right
      expect(positions[1]).toEqual({ top: 16, right: 16, rotate: 90 });
      // Bottom-right
      expect(positions[2]).toEqual({ bottom: 16, right: 16, rotate: 180 });
      // Bottom-left
      expect(positions[3]).toEqual({ bottom: 16, left: 16, rotate: 270 });
    });

    it("should have unique rotations for each corner", () => {
      const positions = getPatternPositions(DecorationPatterns.CORNERS);
      const rotations = positions.map((p) => p.rotate);

      expect(new Set(rotations).size).toBe(4);
    });
  });

  describe("SCATTERED_GRID_ALT pattern", () => {
    it("should return 20 positions (5 rows × 4 cols)", () => {
      const positions = getPatternPositions(
        DecorationPatterns.SCATTERED_GRID_ALT,
      );
      expect(positions).toHaveLength(20);
    });

    it("should use percentage-based positioning", () => {
      const positions = getPatternPositions(
        DecorationPatterns.SCATTERED_GRID_ALT,
      );

      positions.forEach((pos) => {
        expect(typeof pos.top).toBe("string");
        expect(pos.top).toMatch(/%$/);
        expect(typeof pos.left).toBe("string");
        expect(pos.left).toMatch(/%$/);
      });
    });

    it("should alternate rotations in checkerboard pattern", () => {
      const positions = getPatternPositions(
        DecorationPatterns.SCATTERED_GRID_ALT,
      );

      // Check first row alternation (0, 45, 0, 45)
      expect(positions[0].rotate).toBe(0);
      expect(positions[1].rotate).toBe(45);
      expect(positions[2].rotate).toBe(0);
      expect(positions[3].rotate).toBe(45);

      // Second row should be opposite (45, 0, 45, 0)
      expect(positions[4].rotate).toBe(45);
      expect(positions[5].rotate).toBe(0);
    });
  });

  describe("SCATTERED_GRID_PROGRESSIVE pattern", () => {
    it("should return 20 positions (5 rows × 4 cols)", () => {
      const positions = getPatternPositions(
        DecorationPatterns.SCATTERED_GRID_PROGRESSIVE,
      );
      expect(positions).toHaveLength(20);
    });

    it("should have progressive rotation from -45° to 45°", () => {
      const positions = getPatternPositions(
        DecorationPatterns.SCATTERED_GRID_PROGRESSIVE,
      );

      // First element should be ~-45°
      expect(positions[0].rotate).toBeCloseTo(-45, 0);

      // Last element should be ~45°
      expect(positions[19].rotate).toBeCloseTo(45, 0);
    });

    it("should have increasing rotation values", () => {
      const positions = getPatternPositions(
        DecorationPatterns.SCATTERED_GRID_PROGRESSIVE,
      );

      // Check that rotations generally increase
      for (let i = 1; i < positions.length; i++) {
        expect(positions[i].rotate ?? 0).toBeGreaterThanOrEqual(
          positions[i - 1].rotate ?? 0,
        );
      }
    });
  });

  describe("SCATTERED_GRID_RADIAL pattern", () => {
    it("should return 20 positions (5 rows × 4 cols)", () => {
      const positions = getPatternPositions(
        DecorationPatterns.SCATTERED_GRID_RADIAL,
      );
      expect(positions).toHaveLength(20);
    });

    it("should calculate angles from center", () => {
      const positions = getPatternPositions(
        DecorationPatterns.SCATTERED_GRID_RADIAL,
      );

      // All positions should have rotation values
      positions.forEach((pos) => {
        expect(typeof pos.rotate).toBe("number");
        expect(pos.rotate).toBeGreaterThanOrEqual(-180);
        expect(pos.rotate).toBeLessThanOrEqual(180);
      });
    });

    it("should have different rotations based on angle from center", () => {
      const positions = getPatternPositions(
        DecorationPatterns.SCATTERED_GRID_RADIAL,
      );

      // Top-left and bottom-right should have different angles
      const topLeft = positions[0];
      const bottomRight = positions[19];

      // Both should have rotate values
      expect(topLeft.rotate).toBeDefined();
      expect(bottomRight.rotate).toBeDefined();

      // They should have different rotations (radial pattern from center)
      expect(topLeft.rotate).not.toBe(bottomRight.rotate);
    });
  });

  describe("BORDER_TOP pattern", () => {
    it("should return default 6 positions without options", () => {
      const positions = getPatternPositions(DecorationPatterns.BORDER_TOP);
      expect(positions).toHaveLength(6);
    });

    it("should calculate count based on container width", () => {
      const positions = getPatternPositions(DecorationPatterns.BORDER_TOP, {
        containerWidth: 1200,
        containerHeight: 800,
        elementSize: 40,
      });

      // 1200 / (40 * 1.5) = 20
      expect(positions).toHaveLength(20);
    });

    it("should use top positioning", () => {
      const positions = getPatternPositions(DecorationPatterns.BORDER_TOP);

      positions.forEach((pos) => {
        expect(pos).toHaveProperty("top");
        expect(pos).not.toHaveProperty("bottom");
      });
    });

    it("should have deterministic rotations (no randomness)", () => {
      const positions1 = getPatternPositions(DecorationPatterns.BORDER_TOP);
      const positions2 = getPatternPositions(DecorationPatterns.BORDER_TOP);

      expect(positions1).toEqual(positions2);
    });

    it("should distribute elements evenly across width", () => {
      const positions = getPatternPositions(DecorationPatterns.BORDER_TOP);

      // Extract left percentages
      const lefts = positions.map((p) => parseFloat(p.left as string));

      // Should be evenly spaced
      const spacing = lefts[1] - lefts[0];
      for (let i = 2; i < lefts.length; i++) {
        expect(lefts[i] - lefts[i - 1]).toBeCloseTo(spacing, 1);
      }
    });
  });

  describe("BORDER_BOTTOM pattern", () => {
    it("should return default 6 positions without options", () => {
      const positions = getPatternPositions(DecorationPatterns.BORDER_BOTTOM);
      expect(positions).toHaveLength(6);
    });

    it("should use bottom positioning", () => {
      const positions = getPatternPositions(DecorationPatterns.BORDER_BOTTOM);

      positions.forEach((pos) => {
        expect(pos).toHaveProperty("bottom");
        expect(pos).not.toHaveProperty("top");
      });
    });

    it("should have different rotations than BORDER_TOP", () => {
      const topPositions = getPatternPositions(DecorationPatterns.BORDER_TOP);
      const bottomPositions = getPatternPositions(
        DecorationPatterns.BORDER_BOTTOM,
      );

      // Rotations should be different due to different seed (i * 11 vs i * 7)
      // At least one rotation should differ (first element might be same due to modulo)
      const rotationsMatch = topPositions.every(
        (top, i) => top.rotate === bottomPositions[i].rotate,
      );
      expect(rotationsMatch).toBe(false);
    });
  });

  describe("BORDER_BOTH pattern", () => {
    it("should combine top and bottom borders", () => {
      const positions = getPatternPositions(DecorationPatterns.BORDER_BOTH);

      // Should be 12 (6 top + 6 bottom)
      expect(positions).toHaveLength(12);
    });

    it("should have half with top and half with bottom", () => {
      const positions = getPatternPositions(DecorationPatterns.BORDER_BOTH);

      const withTop = positions.filter((p) => "top" in p);
      const withBottom = positions.filter((p) => "bottom" in p);

      expect(withTop).toHaveLength(6);
      expect(withBottom).toHaveLength(6);
    });
  });

  describe("BORDER_LEFT pattern", () => {
    it("should return default 5 positions without options", () => {
      const positions = getPatternPositions(DecorationPatterns.BORDER_LEFT);
      expect(positions).toHaveLength(5);
    });

    it("should calculate count based on container height", () => {
      const positions = getPatternPositions(DecorationPatterns.BORDER_LEFT, {
        containerWidth: 1200,
        containerHeight: 900,
        elementSize: 40,
      });

      // 900 / (40 * 1.5) = 15
      expect(positions).toHaveLength(15);
    });

    it("should use left positioning", () => {
      const positions = getPatternPositions(DecorationPatterns.BORDER_LEFT);

      positions.forEach((pos) => {
        expect(pos).toHaveProperty("left");
        expect(pos).not.toHaveProperty("right");
      });
    });

    it("should distribute elements evenly across height", () => {
      const positions = getPatternPositions(DecorationPatterns.BORDER_LEFT);

      // Extract top percentages
      const tops = positions.map((p) => parseFloat(p.top as string));

      // Should be evenly spaced
      const spacing = tops[1] - tops[0];
      for (let i = 2; i < tops.length; i++) {
        expect(tops[i] - tops[i - 1]).toBeCloseTo(spacing, 1);
      }
    });
  });

  describe("BORDER_RIGHT pattern", () => {
    it("should return default 5 positions without options", () => {
      const positions = getPatternPositions(DecorationPatterns.BORDER_RIGHT);
      expect(positions).toHaveLength(5);
    });

    it("should use right positioning", () => {
      const positions = getPatternPositions(DecorationPatterns.BORDER_RIGHT);

      positions.forEach((pos) => {
        expect(pos).toHaveProperty("right");
        expect(pos).not.toHaveProperty("left");
      });
    });
  });

  describe("BORDER_SIDES pattern", () => {
    it("should combine left and right borders", () => {
      const positions = getPatternPositions(DecorationPatterns.BORDER_SIDES);

      // Should be 10 (5 left + 5 right)
      expect(positions).toHaveLength(10);
    });

    it("should have half with left and half with right", () => {
      const positions = getPatternPositions(DecorationPatterns.BORDER_SIDES);

      const withLeft = positions.filter((p) => "left" in p);
      const withRight = positions.filter((p) => "right" in p);

      expect(withLeft).toHaveLength(5);
      expect(withRight).toHaveLength(5);
    });
  });

  describe("CENTER pattern", () => {
    it("should return exactly 1 position", () => {
      const positions = getPatternPositions(DecorationPatterns.CENTER);
      expect(positions).toHaveLength(1);
    });

    it("should be centered at 50% 50%", () => {
      const positions = getPatternPositions(DecorationPatterns.CENTER);

      expect(positions[0]).toEqual({
        top: "50%",
        left: "50%",
        scale: 2.5,
        rotate: 0,
      });
    });

    it("should have larger scale", () => {
      const positions = getPatternPositions(DecorationPatterns.CENTER);

      expect(positions[0].scale).toBe(2.5);
    });
  });

  describe("TILED pattern", () => {
    it("should return empty array (handled by CSS)", () => {
      const positions = getPatternPositions(DecorationPatterns.TILED);
      expect(positions).toEqual([]);
    });
  });

  describe("options parameter", () => {
    it("should respect containerWidth for horizontal borders", () => {
      const small = getPatternPositions(DecorationPatterns.BORDER_TOP, {
        containerWidth: 300,
        containerHeight: 600,
        elementSize: 40,
      });

      const large = getPatternPositions(DecorationPatterns.BORDER_TOP, {
        containerWidth: 1200,
        containerHeight: 600,
        elementSize: 40,
      });

      expect(large.length).toBeGreaterThan(small.length);
    });

    it("should respect containerHeight for vertical borders", () => {
      const small = getPatternPositions(DecorationPatterns.BORDER_LEFT, {
        containerWidth: 1200,
        containerHeight: 300,
        elementSize: 40,
      });

      const large = getPatternPositions(DecorationPatterns.BORDER_LEFT, {
        containerWidth: 1200,
        containerHeight: 900,
        elementSize: 40,
      });

      expect(large.length).toBeGreaterThan(small.length);
    });

    it("should use elementSize for offset calculation", () => {
      const positions = getPatternPositions(DecorationPatterns.BORDER_TOP, {
        containerWidth: 1200,
        containerHeight: 800,
        elementSize: 60,
      });

      // Top offset should be elementSize / 2
      expect(positions[0].top).toBe(30);
    });
  });
});

describe("getPatternLabel", () => {
  it("should return labels for all pattern types", () => {
    const patterns = Object.values(DecorationPatterns);

    patterns.forEach((pattern) => {
      const label = getPatternLabel(pattern);
      expect(label).toBeTruthy();
      expect(typeof label).toBe("string");
    });
  });

  it("should return descriptive Spanish labels", () => {
    expect(getPatternLabel(DecorationPatterns.CORNERS)).toBe(
      "Esquinas (4 elementos)",
    );
    expect(getPatternLabel(DecorationPatterns.CENTER)).toBe("Centro (grande)");
    expect(getPatternLabel(DecorationPatterns.NONE)).toBe("Sin patrón");
  });

  it("should fallback to pattern value for unknown patterns", () => {
    const unknown = "UNKNOWN_PATTERN" as any;
    expect(getPatternLabel(unknown)).toBe("UNKNOWN_PATTERN");
  });

  it("should have unique labels for each pattern", () => {
    const patterns = Object.values(DecorationPatterns);
    const labels = patterns.map((p) => getPatternLabel(p));

    expect(new Set(labels).size).toBe(labels.length);
  });
});
