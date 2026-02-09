// @vitest-environment jsdom

import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LoadingSpinner from "@/components/LoadingSpinner";

// Mock HeroUI Spinner component
const mockSpinner = vi.hoisted(() => vi.fn());
vi.mock("@heroui/spinner", () => ({
  Spinner: mockSpinner,
}));

describe("LoadingSpinner", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default Spinner mock implementation
    mockSpinner.mockImplementation(() => (
      <div data-testid="spinner">Loading...</div>
    ));
  });

  describe("Rendering", () => {
    it("renders the component", () => {
      const { container } = render(<LoadingSpinner />);

      expect(container.firstChild).toBeInTheDocument();
    });

    it("renders HeroUI Spinner component", () => {
      render(<LoadingSpinner />);

      expect(mockSpinner).toHaveBeenCalledOnce();
    });
  });

  describe("Overlay styles", () => {
    it("has fixed positioning to cover viewport", () => {
      const { container } = render(<LoadingSpinner />);

      const overlay = container.firstChild as HTMLElement;
      expect(overlay).toHaveClass("fixed");
      expect(overlay).toHaveClass("inset-0");
    });

    it("has backdrop blur effect", () => {
      const { container } = render(<LoadingSpinner />);

      const overlay = container.firstChild as HTMLElement;
      expect(overlay).toHaveClass("backdrop-blur-sm");
      expect(overlay).toHaveClass("bg-black/20");
    });

    it("centers content with flexbox", () => {
      const { container } = render(<LoadingSpinner />);

      const overlay = container.firstChild as HTMLElement;
      expect(overlay).toHaveClass("flex");
      expect(overlay).toHaveClass("items-center");
      expect(overlay).toHaveClass("justify-center");
    });

    it("has highest z-index for overlay", () => {
      const { container } = render(<LoadingSpinner />);

      const overlay = container.firstChild as HTMLElement;
      expect(overlay).toHaveClass("z-50");
    });
  });

  describe("Layout structure", () => {
    it("wraps Spinner in overlay container", () => {
      const { container } = render(<LoadingSpinner />);

      // Container should have overlay div with Spinner inside
      const overlay = container.firstChild as HTMLElement;
      expect(overlay.tagName).toBe("DIV");

      // Spinner should be a child of the overlay
      const spinner = overlay.querySelector('[data-testid="spinner"]');
      expect(spinner).toBeInTheDocument();
    });
  });
});
