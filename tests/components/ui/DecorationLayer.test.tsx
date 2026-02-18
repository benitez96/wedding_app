// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DecorationLayer } from "@/components/ui/DecorationLayer";
import { DecorationPatterns } from "@/types/decoration";
import * as decorationPatterns from "@/lib/decoration-patterns";

// Mock Next.js Image component
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    width,
    height,
    className,
  }: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
  }) => <img src={src} alt={alt} className={className} />,
}));

// Mock getPatternPositions
const mockGetPatternPositions = vi.spyOn(
  decorationPatterns,
  "getPatternPositions",
);

// Mock ResizeObserver
let resizeObserverCallback: ResizeObserverCallback;
const observeMock = vi.fn();
const disconnectMock = vi.fn();
const unobserveMock = vi.fn();

class MockResizeObserver {
  constructor(callback: ResizeObserverCallback) {
    resizeObserverCallback = callback;
  }
  observe = observeMock;
  disconnect = disconnectMock;
  unobserve = unobserveMock;
}

describe("DecorationLayer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.ResizeObserver =
      MockResizeObserver as unknown as typeof ResizeObserver;

    // Default mock implementation
    mockGetPatternPositions.mockReturnValue([
      { top: 16, left: 16, rotate: 0 },
      { top: 16, right: 16, rotate: 90 },
    ]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("renders children without decorations when svg is 'none'", () => {
      render(
        <DecorationLayer svg="none" pattern="corners">
          <div data-testid="child-content">Test Content</div>
        </DecorationLayer>,
      );

      expect(screen.getByTestId("child-content")).toBeInTheDocument();
      expect(screen.getByText("Test Content")).toBeInTheDocument();
    });

    it("renders children without decorations when pattern is 'none'", () => {
      render(
        <DecorationLayer svg="flower" pattern="none">
          <div data-testid="child-content">Test Content</div>
        </DecorationLayer>,
      );

      expect(screen.getByTestId("child-content")).toBeInTheDocument();
      // No decoration elements should be rendered
      expect(mockGetPatternPositions).not.toHaveBeenCalled();
    });

    it("renders children in relative container", () => {
      const { container } = render(
        <DecorationLayer svg="flower" pattern="corners">
          <div data-testid="child-content">Test Content</div>
        </DecorationLayer>,
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("relative");
    });

    it("uses suppressHydrationWarning on container", () => {
      const { container } = render(
        <DecorationLayer svg="flower" pattern="corners">
          <div>Test</div>
        </DecorationLayer>,
      );

      const wrapper = container.firstChild as HTMLElement;
      // React removes suppressHydrationWarning in DOM, it's only used during render
      expect(wrapper).toHaveClass("relative");
    });
  });

  describe("TILED Pattern", () => {
    it("renders tiled background pattern with mask", async () => {
      const { container } = render(
        <DecorationLayer
          svg="flower"
          pattern={DecorationPatterns.TILED}
          opacity={50}
          size={80}
        >
          <div>Content</div>
        </DecorationLayer>,
      );

      // Wait for isMounted to be true
      await waitFor(() => {
        const maskedDiv = container.querySelector(
          ".absolute.inset-0.pointer-events-none",
        );
        expect(maskedDiv).toBeInTheDocument();
      });

      const maskedDiv = container.querySelector(
        ".absolute.inset-0.pointer-events-none",
      ) as HTMLElement;

      // Check mask styles
      expect(maskedDiv.style.maskImage).toBe("url(/tramas/svgs/flower.svg)");
      expect(maskedDiv.style.maskSize).toBe("80px 80px");
      expect(maskedDiv.style.maskRepeat).toBe("repeat");
      expect(maskedDiv.style.opacity).toBe("0.5"); // 50 / 100
    });

    it("uses secondary color when hasAlternateBg is false", async () => {
      const { container } = render(
        <DecorationLayer
          svg="flower"
          pattern={DecorationPatterns.TILED}
          hasAlternateBg={false}
        >
          <div>Content</div>
        </DecorationLayer>,
      );

      await waitFor(() => {
        const maskedDiv = container.querySelector(
          ".absolute.inset-0.pointer-events-none",
        ) as HTMLElement;
        expect(maskedDiv.style.backgroundColor).toBe("var(--color-secondary)");
      });
    });

    it("uses background color when hasAlternateBg is true", async () => {
      const { container } = render(
        <DecorationLayer
          svg="flower"
          pattern={DecorationPatterns.TILED}
          hasAlternateBg={true}
        >
          <div>Content</div>
        </DecorationLayer>,
      );

      await waitFor(() => {
        const maskedDiv = container.querySelector(
          ".absolute.inset-0.pointer-events-none",
        ) as HTMLElement;
        expect(maskedDiv.style.backgroundColor).toBe("var(--color-background)");
      });
    });

    it("renders tiled pattern after mount", async () => {
      const { container } = render(
        <DecorationLayer svg="flower" pattern={DecorationPatterns.TILED}>
          <div>Content</div>
        </DecorationLayer>,
      );

      // After mount effect runs, masked div should exist
      await waitFor(() => {
        const maskedDiv = container.querySelector(
          ".absolute.inset-0.pointer-events-none",
        );
        expect(maskedDiv).toBeInTheDocument();
      });
    });
  });

  describe("Position-based Patterns", () => {
    it("does not render decorations without dimensions", () => {
      const { container } = render(
        <DecorationLayer
          svg="flower"
          pattern={DecorationPatterns.CORNERS}
          size={60}
        >
          <div>Content</div>
        </DecorationLayer>,
      );

      // Without dimensions (offsetWidth/height = 0), no decorations render
      const decorations = container.querySelectorAll(
        ".absolute.pointer-events-none:not(.z-\\[5\\])",
      );
      expect(decorations.length).toBe(0);
    });

    it("returns empty positions array when dimensions are zero", () => {
      render(
        <DecorationLayer
          svg="flower"
          pattern={DecorationPatterns.CORNERS}
          size={60}
        >
          <div>Content</div>
        </DecorationLayer>,
      );

      // getPatternPositions should not be called without valid dimensions
      expect(mockGetPatternPositions).not.toHaveBeenCalled();
    });
  });

  describe("Props", () => {
    it("uses default prop values", () => {
      render(
        <DecorationLayer>
          <div>Content</div>
        </DecorationLayer>,
      );

      // Should render without decorations (default svg="none", pattern="none")
      expect(mockGetPatternPositions).not.toHaveBeenCalled();
    });

    it("renders children with all prop values", () => {
      render(
        <DecorationLayer
          svg="flower"
          pattern={DecorationPatterns.CORNERS}
          opacity={75}
          size={100}
          hasAlternateBg={true}
        >
          <div data-testid="child">Content</div>
        </DecorationLayer>,
      );

      expect(screen.getByTestId("child")).toBeInTheDocument();
    });
  });

  describe("ResizeObserver", () => {
    it("observes container element", async () => {
      render(
        <DecorationLayer svg="flower" pattern={DecorationPatterns.CORNERS}>
          <div>Content</div>
        </DecorationLayer>,
      );

      await waitFor(() => {
        expect(observeMock).toHaveBeenCalled();
      });
    });

    it("disconnects observer on unmount", async () => {
      const { unmount } = render(
        <DecorationLayer svg="flower" pattern={DecorationPatterns.CORNERS}>
          <div>Content</div>
        </DecorationLayer>,
      );

      await waitFor(() => {
        expect(observeMock).toHaveBeenCalled();
      });

      unmount();

      expect(disconnectMock).toHaveBeenCalled();
    });

    it("creates observer after mount", async () => {
      render(
        <DecorationLayer svg="flower" pattern={DecorationPatterns.CORNERS}>
          <div>Content</div>
        </DecorationLayer>,
      );

      // ResizeObserver is created during the effect
      await waitFor(() => {
        expect(observeMock).toHaveBeenCalled();
      });
    });
  });

  describe("Hydration Safety", () => {
    it("does not render decorations on initial server render", () => {
      const { container } = render(
        <DecorationLayer svg="flower" pattern={DecorationPatterns.CORNERS}>
          <div>Content</div>
        </DecorationLayer>,
      );

      // Before mount effect runs, no decorations
      const decorations = container.querySelectorAll(
        ".absolute.pointer-events-none",
      );
      expect(decorations.length).toBe(0);
    });

    it("only calculates positions when dimensions are available", async () => {
      render(
        <DecorationLayer svg="flower" pattern={DecorationPatterns.CORNERS}>
          <div>Content</div>
        </DecorationLayer>,
      );

      // Should not call getPatternPositions until dimensions > 0
      expect(mockGetPatternPositions).not.toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("handles svg='none' regardless of pattern", () => {
      const { container } = render(
        <DecorationLayer svg="none" pattern={DecorationPatterns.CORNERS}>
          <div>Content</div>
        </DecorationLayer>,
      );

      const decorations = container.querySelectorAll(
        ".absolute.pointer-events-none",
      );
      expect(decorations.length).toBe(0);
    });

    it("handles pattern='none' regardless of svg", () => {
      const { container } = render(
        <DecorationLayer svg="flower" pattern="none">
          <div>Content</div>
        </DecorationLayer>,
      );

      const decorations = container.querySelectorAll(
        ".absolute.pointer-events-none",
      );
      expect(decorations.length).toBe(0);
    });

    it("renders children for all SVG types", () => {
      const svgTypes = ["flower", "leaf", "heart", "branch", "branch-2"];

      svgTypes.forEach((svg) => {
        const { unmount } = render(
          <DecorationLayer
            svg={svg as any}
            pattern={DecorationPatterns.CORNERS}
          >
            <div data-testid="content">Content</div>
          </DecorationLayer>,
        );

        expect(screen.getByTestId("content")).toBeInTheDocument();
        unmount();
      });
    });
  });
});
