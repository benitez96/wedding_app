// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SessionProvider } from "@/components/providers/SessionProvider";

describe("SessionProvider", () => {
  it("renders children without modification", () => {
    render(
      <SessionProvider>
        <span data-testid="child">content</span>
      </SessionProvider>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText("content")).toBeInTheDocument();
  });

  it("renders multiple children", () => {
    render(
      <SessionProvider>
        <span>first</span>
        <span>second</span>
      </SessionProvider>,
    );
    expect(screen.getByText("first")).toBeInTheDocument();
    expect(screen.getByText("second")).toBeInTheDocument();
  });

  it("adds no extra wrapper element", () => {
    const { container } = render(
      <SessionProvider>
        <div data-testid="only-child" />
      </SessionProvider>,
    );
    expect(container.firstChild).toBe(screen.getByTestId("only-child"));
  });
});
