/**
 * Tests for components/providers/ThemeStyleTag.tsx
 *
 * Only testing pure functions — no React rendering needed.
 * All functions are exported for testability.
 */

import { describe, it, expect } from "vitest";
import {
  hexToHslComponents,
  getContrastForeground,
  deriveContentLayers,
  buildCustomThemeCss,
} from "@/components/providers/ThemeStyleTag";

// ─── hexToHslComponents ───────────────────────────────────────────────────────

describe("hexToHslComponents", () => {
  it("converts pure white to '0 0% 100%'", () => {
    expect(hexToHslComponents("#ffffff")).toBe("0 0% 100%");
  });

  it("converts pure black to '0 0% 0%'", () => {
    expect(hexToHslComponents("#000000")).toBe("0 0% 0%");
  });

  it("converts pure red to '0 100% 50%'", () => {
    expect(hexToHslComponents("#ff0000")).toBe("0 100% 50%");
  });

  it("converts pure green to '120 100% 50%'", () => {
    expect(hexToHslComponents("#00ff00")).toBe("120 100% 50%");
  });

  it("converts pure blue to '240 100% 50%'", () => {
    expect(hexToHslComponents("#0000ff")).toBe("240 100% 50%");
  });

  it("returns bare components with no hsl() wrapper", () => {
    const result = hexToHslComponents("#ff0000");

    expect(result).not.toContain("hsl(");
    expect(result).not.toContain(")");
  });

  it("format is 'H S% L%' with percentage signs on S and L", () => {
    const result = hexToHslComponents("#ff0000");
    const parts = result.split(" ");

    expect(parts).toHaveLength(3);
    expect(parts[1]).toMatch(/%$/);
    expect(parts[2]).toMatch(/%$/);
  });

  it("handles Catppuccin Mocha base (#1e1e2e) — dark purple-blue", () => {
    const result = hexToHslComponents("#1e1e2e");
    const parts = result.split(" ");

    // Hue should be in blue-purple range (240°)
    const h = parseFloat(parts[0]);
    expect(h).toBeGreaterThanOrEqual(230);
    expect(h).toBeLessThanOrEqual(250);

    // Lightness should be low (dark color)
    const l = parseFloat(parts[2]);
    expect(l).toBeLessThan(20);
  });

  it("handles Catppuccin Mocha mauve (#cba6f7) — lavender primary", () => {
    const result = hexToHslComponents("#cba6f7");
    const parts = result.split(" ");

    // Hue in purple range
    const h = parseFloat(parts[0]);
    expect(h).toBeGreaterThanOrEqual(260);
    expect(h).toBeLessThanOrEqual(280);

    // High lightness (pastel)
    const l = parseFloat(parts[2]);
    expect(l).toBeGreaterThan(70);
  });
});

// ─── getContrastForeground ────────────────────────────────────────────────────

describe("getContrastForeground", () => {
  it("returns #000000 for white background", () => {
    expect(getContrastForeground("#ffffff")).toBe("#000000");
  });

  it("returns #ffffff for black background", () => {
    expect(getContrastForeground("#000000")).toBe("#ffffff");
  });

  it("returns #ffffff for Catppuccin Mocha base (dark background)", () => {
    expect(getContrastForeground("#1e1e2e")).toBe("#ffffff");
  });

  it("returns #000000 for Catppuccin Mocha mauve (light pastel)", () => {
    // #cba6f7 is a light lavender — dark text reads better on it
    expect(getContrastForeground("#cba6f7")).toBe("#000000");
  });

  it("returns #ffffff for a very dark blue (#030970)", () => {
    expect(getContrastForeground("#030970")).toBe("#ffffff");
  });

  it("returns #000000 for a light yellow (#fffff0)", () => {
    expect(getContrastForeground("#fffff0")).toBe("#000000");
  });

  it("only returns one of the two valid values", () => {
    const result = getContrastForeground("#888888");

    expect(["#000000", "#ffffff"]).toContain(result);
  });
});

// ─── deriveContentLayers ──────────────────────────────────────────────────────

describe("deriveContentLayers", () => {
  it("returns 4 content layers", () => {
    const bgHsl = hexToHslComponents("#1e1e2e");
    const result = deriveContentLayers(bgHsl, true);

    expect(result).toHaveProperty("content1");
    expect(result).toHaveProperty("content2");
    expect(result).toHaveProperty("content3");
    expect(result).toHaveProperty("content4");
  });

  it("dark mode: each layer is progressively lighter than the previous", () => {
    const bgHsl = hexToHslComponents("#1e1e2e");
    const { content1, content2, content3, content4 } = deriveContentLayers(
      bgHsl,
      true,
    );

    const l1 = parseFloat(content1.split(" ")[2]);
    const l2 = parseFloat(content2.split(" ")[2]);
    const l3 = parseFloat(content3.split(" ")[2]);
    const l4 = parseFloat(content4.split(" ")[2]);

    expect(l2).toBeGreaterThan(l1);
    expect(l3).toBeGreaterThan(l2);
    expect(l4).toBeGreaterThan(l3);
  });

  it("light mode: each layer is progressively darker than the previous", () => {
    const bgHsl = hexToHslComponents("#ffffff");
    const { content1, content2, content3, content4 } = deriveContentLayers(
      bgHsl,
      false,
    );

    const l1 = parseFloat(content1.split(" ")[2]);
    const l2 = parseFloat(content2.split(" ")[2]);
    const l3 = parseFloat(content3.split(" ")[2]);
    const l4 = parseFloat(content4.split(" ")[2]);

    expect(l2).toBeLessThan(l1);
    expect(l3).toBeLessThan(l2);
    expect(l4).toBeLessThan(l3);
  });

  it("clamps lightness to [0, 100] — never produces invalid values", () => {
    // Pure black dark mode — lightness near 0, stepping up is fine
    const darkBg = hexToHslComponents("#000000");
    const darkLayers = deriveContentLayers(darkBg, true);

    // Pure white light mode — lightness at 100, stepping down is fine
    const lightBg = hexToHslComponents("#ffffff");
    const lightLayers = deriveContentLayers(lightBg, false);

    for (const layer of Object.values(darkLayers)) {
      const l = parseFloat(layer.split(" ")[2]);
      expect(l).toBeGreaterThanOrEqual(0);
      expect(l).toBeLessThanOrEqual(100);
    }

    for (const layer of Object.values(lightLayers)) {
      const l = parseFloat(layer.split(" ")[2]);
      expect(l).toBeGreaterThanOrEqual(0);
      expect(l).toBeLessThanOrEqual(100);
    }
  });

  it("preserves hue and saturation from the background", () => {
    const bgHsl = hexToHslComponents("#1e1e2e");
    const [bgH, bgS] = bgHsl.split(" ");
    const { content1 } = deriveContentLayers(bgHsl, true);
    const [c1H, c1S] = content1.split(" ");

    expect(c1H).toBe(bgH);
    expect(c1S).toBe(bgS);
  });
});

// ─── buildCustomThemeCss ──────────────────────────────────────────────────────

describe("buildCustomThemeCss", () => {
  const mochaColors = {
    background: "#1e1e2e",
    foreground: "#cdd6f4",
    primary: "#cba6f7",
    secondary: "#313244",
    accent: "#f38ba8",
  };

  const lightColors = {
    background: "#ffffff",
    foreground: "#111111",
    primary: "#6366f1",
    secondary: "#a5b4fc",
    accent: "#818cf8",
  };

  it("output contains :root selector for SSR first paint", () => {
    const css = buildCustomThemeCss(lightColors);

    expect(css).toContain(":root");
  });

  it("output contains .custom selector for client-side navigation", () => {
    const css = buildCustomThemeCss(lightColors);

    expect(css).toContain(".custom");
  });

  it("sets color-scheme: dark for a dark background", () => {
    const css = buildCustomThemeCss(mochaColors);

    expect(css).toContain("color-scheme:dark");
  });

  it("sets color-scheme: light for a light background", () => {
    const css = buildCustomThemeCss(lightColors);

    expect(css).toContain("color-scheme:light");
  });

  it("includes all required --heroui-* variables", () => {
    const css = buildCustomThemeCss(mochaColors);

    expect(css).toContain("--heroui-background:");
    expect(css).toContain("--heroui-foreground:");
    expect(css).toContain("--heroui-primary:");
    expect(css).toContain("--heroui-primary-foreground:");
    expect(css).toContain("--heroui-secondary:");
    expect(css).toContain("--heroui-secondary-foreground:");
    expect(css).toContain("--heroui-content1:");
    expect(css).toContain("--heroui-content2:");
    expect(css).toContain("--heroui-content3:");
    expect(css).toContain("--heroui-content4:");
  });

  it("includes --color-* raw variables for DecorationLayer", () => {
    const css = buildCustomThemeCss(mochaColors);

    expect(css).toContain("--color-background:");
    expect(css).toContain("--color-secondary:");
    expect(css).toContain("--color-accent:");
  });

  it("--color-accent contains the user's accent hex value", () => {
    const css = buildCustomThemeCss(mochaColors);

    expect(css).toContain(`--color-accent:${mochaColors.accent}`);
  });

  it("--color-background contains the user's background hex value", () => {
    const css = buildCustomThemeCss(mochaColors);

    expect(css).toContain(`--color-background:${mochaColors.background}`);
  });

  it("does not interpolate raw user strings into CSS property names or selectors", () => {
    // Security: CSS property names must be --heroui-* or --color-*
    // No user-controlled string should appear before the colon
    const css = buildCustomThemeCss(mochaColors);
    const declarations = css
      .replace(/:root,.custom,html\.custom\{[^}]+\}/, "")
      .split(";")
      .filter(Boolean);

    // Every declaration must start with a known prefix
    for (const decl of declarations) {
      const propName = decl.split(":")[0].replace(/.*\{/, "");
      if (propName) {
        expect(propName).toMatch(/^--heroui-|^--color-|color-scheme/);
      }
    }
  });

  it("auto-calculates primary-foreground for contrast — dark text on light primary", () => {
    // #cba6f7 (Mocha Mauve) is light — should get #000000 as foreground
    const css = buildCustomThemeCss(mochaColors);
    const primaryFgHsl = hexToHslComponents("#000000");

    expect(css).toContain(`--heroui-primary-foreground:${primaryFgHsl}`);
  });

  it("auto-calculates secondary-foreground for contrast", () => {
    // #313244 (Mocha Surface0) is dark — should get #ffffff as foreground
    const css = buildCustomThemeCss(mochaColors);
    const secondaryFgHsl = hexToHslComponents("#ffffff");

    expect(css).toContain(`--heroui-secondary-foreground:${secondaryFgHsl}`);
  });

  it("sets --heroui-divider to white/low-opacity on dark backgrounds", () => {
    const css = buildCustomThemeCss(mochaColors);

    expect(css).toContain("--heroui-divider:rgba(255,255,255,0.15)");
  });

  it("sets --heroui-divider to black/low-opacity on light backgrounds", () => {
    const css = buildCustomThemeCss(lightColors);

    expect(css).toContain("--heroui-divider:rgba(17,17,17,0.15)");
  });
});
