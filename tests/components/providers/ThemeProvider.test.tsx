// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { DEFAULT_CUSTOM_THEME_COLORS } from "@/types/theme";

describe("ThemeProvider", () => {
  afterEach(() => {
    document.documentElement.className = "";
  });

  it("renders children", () => {
    render(
      <ThemeProvider themeId="classic">
        <span>child content</span>
      </ThemeProvider>,
    );
    expect(screen.getByText("child content")).toBeInTheDocument();
  });

  it("sets documentElement className to themeId on mount", () => {
    render(
      <ThemeProvider themeId="classic">
        <div />
      </ThemeProvider>,
    );
    expect(document.documentElement.className).toBe("classic");
  });

  it("updates documentElement className when themeId changes", () => {
    const { rerender } = render(
      <ThemeProvider themeId="classic">
        <div />
      </ThemeProvider>,
    );
    expect(document.documentElement.className).toBe("classic");

    rerender(
      <ThemeProvider themeId="warm">
        <div />
      </ThemeProvider>,
    );
    expect(document.documentElement.className).toBe("warm");
  });

  describe("custom theme", () => {
    const lightCustomColors = {
      ...DEFAULT_CUSTOM_THEME_COLORS,
      background: "#ffffff",
    };

    const darkCustomColors = {
      ...DEFAULT_CUSTOM_THEME_COLORS,
      background: "#1e1e2e",
    };

    it("sets 'light custom' class for light custom theme", () => {
      render(
        <ThemeProvider themeId="custom" customColors={lightCustomColors}>
          <div />
        </ThemeProvider>,
      );
      expect(document.documentElement.className).toBe("light custom");
    });

    it("sets 'dark custom' class for dark custom theme", () => {
      render(
        <ThemeProvider themeId="custom" customColors={darkCustomColors}>
          <div />
        </ThemeProvider>,
      );
      expect(document.documentElement.className).toBe("dark custom");
    });

    it("injects style tag for custom theme", () => {
      render(
        <ThemeProvider themeId="custom" customColors={lightCustomColors}>
          <div />
        </ThemeProvider>,
      );
      const styleTag = document.querySelector('style[data-theme="custom"]');
      expect(styleTag).toBeInTheDocument();
    });

    it("does not inject style tag for predefined theme", () => {
      render(
        <ThemeProvider themeId="classic">
          <div />
        </ThemeProvider>,
      );
      const styleTag = document.querySelector('style[data-theme="custom"]');
      expect(styleTag).not.toBeInTheDocument();
    });

    it("style tag contains CSS variables", () => {
      render(
        <ThemeProvider themeId="custom" customColors={lightCustomColors}>
          <div />
        </ThemeProvider>,
      );
      const styleTag = document.querySelector('style[data-theme="custom"]');
      expect(styleTag?.textContent).toContain("--heroui-background");
      expect(styleTag?.textContent).toContain("--heroui-primary");
    });
  });
});
