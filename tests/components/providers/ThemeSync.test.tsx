// @vitest-environment jsdom

import { render } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ThemeSync } from "@/components/providers/ThemeSync";

describe("ThemeSync", () => {
  beforeEach(() => {
    document.documentElement.className = "";
  });

  afterEach(() => {
    document.documentElement.className = "";
  });

  it("renders null (no DOM output)", () => {
    const { container } = render(<ThemeSync themeId="classic" />);
    expect(container.firstChild).toBeNull();
  });

  it("adds themeId class to <html> on mount", () => {
    render(<ThemeSync themeId="warm" />);
    expect(document.documentElement.classList.contains("warm")).toBe(true);
  });

  it("removes old theme class and adds new one on themeId change", () => {
    const { rerender } = render(<ThemeSync themeId="classic" />);
    expect(document.documentElement.classList.contains("classic")).toBe(true);

    rerender(<ThemeSync themeId="warm" />);
    expect(document.documentElement.classList.contains("warm")).toBe(true);
    expect(document.documentElement.classList.contains("classic")).toBe(false);
  });

  it("preserves 'light' class when switching themes", () => {
    document.documentElement.classList.add("light");
    render(<ThemeSync themeId="classic" />);
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.documentElement.classList.contains("classic")).toBe(true);
  });

  it("preserves 'dark' class when switching themes", () => {
    document.documentElement.classList.add("dark");
    render(<ThemeSync themeId="warm" />);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.classList.contains("warm")).toBe(true);
  });

  it("does not add class when themeId is empty string", () => {
    document.documentElement.classList.add("classic");
    render(<ThemeSync themeId="" />);
    expect(document.documentElement.classList.contains("classic")).toBe(false);
    expect(document.documentElement.classList.length).toBe(0);
  });
});
