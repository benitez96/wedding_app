import { describe, it, expect } from "vitest";
import {
  hexToHslComponents,
  getContrastForeground,
  isDarkBackground,
  buildCustomThemeCss,
  getThemeClass,
} from "@/lib/theme-utils";

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

  it("returns bare components with no hsl() wrapper", () => {
    const result = hexToHslComponents("#ff0000");
    expect(result).not.toContain("hsl(");
    expect(result).not.toContain(")");
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

  it("returns #ffffff for dark background (#1e1e2e)", () => {
    expect(getContrastForeground("#1e1e2e")).toBe("#ffffff");
  });

  it("returns #000000 for light pastel (#cba6f7)", () => {
    expect(getContrastForeground("#cba6f7")).toBe("#000000");
  });
});

// ─── isDarkBackground ─────────────────────────────────────────────────────────

describe("isDarkBackground", () => {
  it("returns true for black", () => {
    expect(isDarkBackground("#000000")).toBe(true);
  });

  it("returns false for white", () => {
    expect(isDarkBackground("#ffffff")).toBe(false);
  });

  it("returns true for mocha background", () => {
    expect(isDarkBackground("#1e1e2e")).toBe(true);
  });
});

// ─── buildCustomThemeCss ──────────────────────────────────────────────────────

describe("buildCustomThemeCss", () => {
  const colors = {
    background: "#1e1e2e",
    foreground: "#cdd6f4",
    primary: "#cba6f7",
    secondary: "#313244",
    accent: "#f38ba8",
  };

  it("contains .custom selector", () => {
    const css = buildCustomThemeCss(colors);
    expect(css).toContain(".custom");
  });

  it("sets color-scheme based on background", () => {
    const css = buildCustomThemeCss(colors);
    expect(css).toContain("color-scheme:dark");

    const lightCss = buildCustomThemeCss({ ...colors, background: "#ffffff" });
    expect(lightCss).toContain("color-scheme:light");
  });

  it("includes core HeroUI variables", () => {
    const css = buildCustomThemeCss(colors);
    expect(css).toContain("--heroui-background");
    expect(css).toContain("--heroui-foreground");
    expect(css).toContain("--heroui-primary");
    expect(css).toContain("--heroui-secondary");
  });

  it("includes raw color variables for decorations", () => {
    const css = buildCustomThemeCss(colors);
    expect(css).toContain(`--color-accent:${colors.accent}`);
    expect(css).toContain(`--color-background:${colors.background}`);
  });
});

// ─── getThemeClass ────────────────────────────────────────────────────────────

describe("getThemeClass", () => {
  it("returns themeId for predefined themes", () => {
    expect(getThemeClass("classic")).toBe("classic");
    expect(getThemeClass("warm")).toBe("warm");
    expect(getThemeClass("mocha")).toBe("mocha");
  });

  it("returns 'light custom' for light custom theme", () => {
    const lightColors = {
      background: "#ffffff",
      foreground: "#000000",
      primary: "#6366f1",
      secondary: "#a5b4fc",
      accent: "#818cf8",
    };
    expect(getThemeClass("custom", lightColors)).toBe("light custom");
  });

  it("returns 'dark custom' for dark custom theme", () => {
    const darkColors = {
      background: "#1e1e2e",
      foreground: "#cdd6f4",
      primary: "#cba6f7",
      secondary: "#313244",
      accent: "#f38ba8",
    };
    expect(getThemeClass("custom", darkColors)).toBe("dark custom");
  });

  it("returns themeId if custom but no colors provided", () => {
    expect(getThemeClass("custom")).toBe("custom");
    expect(getThemeClass("custom", null)).toBe("custom");
  });
});
