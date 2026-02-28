// @vitest-environment jsdom

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ThemeCatalog, {
  ThemeCircle,
  isDarkColor,
  getThemeOptions,
} from "@/app/backoffice/(protected)/theming/ThemeCatalog";
import {
  THEME_IDS,
  THEME_LIST,
  DEFAULT_CUSTOM_THEME_COLORS,
} from "@/types/theme";
import type { CustomThemeColors } from "@/types/theme";

// ============================================================================
// isDarkColor tests
// ============================================================================

describe("isDarkColor", () => {
  it("returns true for black", () => {
    expect(isDarkColor("#000000")).toBe(true);
  });

  it("returns true for dark colors", () => {
    expect(isDarkColor("#1e1e2e")).toBe(true); // Mocha background
    expect(isDarkColor("#2C1A0E")).toBe(true); // Warm foreground
  });

  it("returns false for white", () => {
    expect(isDarkColor("#ffffff")).toBe(false);
  });

  it("returns false for light colors", () => {
    expect(isDarkColor("#fffff0")).toBe(false); // Warm background
    expect(isDarkColor("#f1faee")).toBe(false); // Pastel green background
  });

  it("handles mid-range colors correctly", () => {
    // Gray at 50% luminance should be dark (threshold is 0.5)
    expect(isDarkColor("#808080")).toBe(false); // ~50% luminance
    expect(isDarkColor("#707070")).toBe(true); // Slightly darker
  });
});

// ============================================================================
// getThemeOptions tests
// ============================================================================

describe("getThemeOptions", () => {
  const customColors: CustomThemeColors = {
    background: "#1a1a2e",
    foreground: "#eaeaea",
    primary: "#ff6b6b",
    secondary: "#4ecdc4",
    accent: "#ffd93d",
  };

  it("returns all predefined themes plus custom", () => {
    const options = getThemeOptions(customColors);
    // 4 predefined + 1 custom = 5
    expect(options).toHaveLength(THEME_LIST.length + 1);
  });

  it("includes all predefined theme IDs", () => {
    const options = getThemeOptions(customColors);
    const ids = options.map((o) => o.id);

    // Light themes
    expect(ids).toContain(THEME_IDS.CLASSIC);
    expect(ids).toContain(THEME_IDS.WARM);
    expect(ids).toContain(THEME_IDS.ROSE_PINE_DAWN);
    expect(ids).toContain(THEME_IDS.SAGE);
    // Dark themes
    expect(ids).toContain(THEME_IDS.MOCHA);
    expect(ids).toContain(THEME_IDS.MIDNIGHT_GOLD);
    // Custom
    expect(ids).toContain(THEME_IDS.CUSTOM);
  });

  it("custom theme uses provided colors", () => {
    const options = getThemeOptions(customColors);
    const custom = options.find((o) => o.id === THEME_IDS.CUSTOM);

    expect(custom).toBeDefined();
    expect(custom!.colors).toEqual(customColors);
  });

  it("correctly identifies dark themes", () => {
    const options = getThemeOptions(customColors);

    const mocha = options.find((o) => o.id === THEME_IDS.MOCHA);
    expect(mocha!.isDark).toBe(true);

    const classic = options.find((o) => o.id === THEME_IDS.CLASSIC);
    expect(classic!.isDark).toBe(false);
  });

  it("custom theme isDark based on background", () => {
    const darkCustom = getThemeOptions({
      ...customColors,
      background: "#000000",
    });
    const custom = darkCustom.find((o) => o.id === THEME_IDS.CUSTOM);
    expect(custom!.isDark).toBe(true);

    const lightCustom = getThemeOptions({
      ...customColors,
      background: "#ffffff",
    });
    const customLight = lightCustom.find((o) => o.id === THEME_IDS.CUSTOM);
    expect(customLight!.isDark).toBe(false);
  });
});

// ============================================================================
// ThemeCircle tests
// ============================================================================

describe("ThemeCircle", () => {
  const colors: CustomThemeColors = {
    background: "#ffffff",
    foreground: "#111111",
    primary: "#6366f1",
    secondary: "#a5b4fc",
    accent: "#818cf8",
  };

  it("renders with concentric circles showing theme colors", () => {
    const { container } = render(<ThemeCircle colors={colors} />);
    const outerCircle = container.firstChild as HTMLElement;

    // Outer circle has background color
    expect(outerCircle.style.backgroundColor).toBeTruthy();
    // Has border with foreground color
    expect(outerCircle.style.border).toContain("2px solid");

    // Has nested circles for primary and accent
    const innerCircles = outerCircle.querySelectorAll("div");
    expect(innerCircles.length).toBeGreaterThan(0);
  });

  it("renders palette icon for custom theme", () => {
    render(<ThemeCircle colors={colors} isCustom />);
    // Lucide icons render as SVG
    const svg = document.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("does not render icon for regular themes", () => {
    render(<ThemeCircle colors={colors} />);
    const svg = document.querySelector("svg");
    expect(svg).not.toBeInTheDocument();
  });

  it("applies correct size classes", () => {
    const { container, rerender } = render(
      <ThemeCircle colors={colors} size="md" />,
    );
    let circle = container.firstChild as HTMLElement;
    expect(circle.className).toContain("w-12");
    expect(circle.className).toContain("h-12");

    rerender(<ThemeCircle colors={colors} size="sm" />);
    circle = container.firstChild as HTMLElement;
    expect(circle.className).toContain("w-8");
    expect(circle.className).toContain("h-8");
  });
});

// ============================================================================
// ThemeCatalog integration tests
// ============================================================================

describe("ThemeCatalog", () => {
  const defaultProps = {
    selectedThemeId: THEME_IDS.CLASSIC,
    customColors: DEFAULT_CUSTOM_THEME_COLORS,
    onSelect: vi.fn(),
  };

  it("renders all theme options", () => {
    render(<ThemeCatalog {...defaultProps} />);

    // Light themes
    expect(screen.getByText("Clásico")).toBeInTheDocument();
    expect(screen.getByText("Cálido")).toBeInTheDocument();
    expect(screen.getByText("Rosé")).toBeInTheDocument();
    expect(screen.getByText("Sage")).toBeInTheDocument();
    // Dark themes
    expect(screen.getByText("Mocha")).toBeInTheDocument();
    expect(screen.getByText("Midnight Gold")).toBeInTheDocument();
    // Custom
    expect(screen.getByText("Personalizado")).toBeInTheDocument();
  });

  it("shows selected theme with ring", () => {
    const { container } = render(<ThemeCatalog {...defaultProps} />);

    // Find the card containing "Clásico" - it should have ring-primary
    const classicButton = screen.getByRole("button", { name: /clásico/i });
    const card = classicButton.querySelector("[class*='ring-primary']");
    expect(card).toBeInTheDocument();
  });

  it("shows check icon on selected theme", () => {
    render(<ThemeCatalog {...defaultProps} />);

    // CheckCircle2 is rendered inside the selected theme button
    const classicButton = screen.getByRole("button", { name: /clásico/i });
    const checkIcon = classicButton.querySelector("svg");
    expect(checkIcon).toBeInTheDocument();
  });

  it("calls onSelect when theme is clicked", () => {
    const onSelect = vi.fn();
    render(<ThemeCatalog {...defaultProps} onSelect={onSelect} />);

    const warmButton = screen.getByRole("button", { name: /cálido/i });
    fireEvent.click(warmButton);

    expect(onSelect).toHaveBeenCalledWith(THEME_IDS.WARM);
  });

  it("shows dark/light badge for each theme", () => {
    render(<ThemeCatalog {...defaultProps} />);

    // Mocha should show "Oscuro"
    const oscuroBadges = screen.getAllByText("Oscuro");
    expect(oscuroBadges.length).toBeGreaterThan(0);

    // Light themes should show "Claro"
    const claroBadges = screen.getAllByText("Claro");
    expect(claroBadges.length).toBeGreaterThan(0);
  });

  it("uses custom colors for custom theme circle", () => {
    const customColors: CustomThemeColors = {
      background: "#ff0000",
      foreground: "#00ff00",
      primary: "#0000ff",
      secondary: "#ffff00",
      accent: "#ff00ff",
    };

    render(<ThemeCatalog {...defaultProps} customColors={customColors} />);

    // Find the custom theme button
    const customButton = screen.getByRole("button", {
      name: /personalizado/i,
    });
    expect(customButton).toBeDefined();

    // The outer circle should have the custom background color
    const outerCircle = customButton.querySelector(
      "[style*='background-color']",
    );
    expect(outerCircle).toBeInTheDocument();
    expect((outerCircle as HTMLElement).style.backgroundColor).toBe(
      "rgb(255, 0, 0)",
    ); // #ff0000
  });
});
