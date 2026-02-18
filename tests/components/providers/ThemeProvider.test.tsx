// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

describe("ThemeProvider", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("class");
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
});
