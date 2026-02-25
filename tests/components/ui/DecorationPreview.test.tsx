// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DecorationPreview } from "@/components/ui/DecorationPreview";
import { DecorationPatterns, DecorationSVGs } from "@/types/decoration";

// Mock DecorationLayer component
const mockDecorationLayer = vi.hoisted(() => vi.fn());

vi.mock("@/components/ui/DecorationLayer", () => ({
  DecorationLayer: mockDecorationLayer,
}));

// Mock HeroUI Card components
const mockCard = vi.hoisted(() => vi.fn());
const mockCardBody = vi.hoisted(() => vi.fn());

vi.mock("@heroui/card", () => ({
  Card: mockCard,
  CardBody: mockCardBody,
}));

describe("DecorationPreview", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Card to render as a div with className
    mockCard.mockImplementation(
      ({
        className,
        children,
      }: {
        className?: string;
        children: React.ReactNode;
      }) => (
        <div data-testid="card" className={className}>
          {children}
        </div>
      ),
    );

    // Mock CardBody to render as a div with className
    mockCardBody.mockImplementation(
      ({
        className,
        children,
      }: {
        className?: string;
        children: React.ReactNode;
      }) => (
        <div data-testid="card-body" className={className}>
          {children}
        </div>
      ),
    );

    // Mock DecorationLayer to render children
    mockDecorationLayer.mockImplementation(
      ({ children }: { children: React.ReactNode }) => (
        <div data-testid="decoration-layer">{children}</div>
      ),
    );
  });

  describe("Rendering - No Decoration", () => {
    it("renders empty state when svg is 'none'", () => {
      render(
        <DecorationPreview
          svg="none"
          pattern={DecorationPatterns.CORNERS}
          opacity={50}
          size={60}
        />,
      );

      expect(
        screen.getByText("Sin decoración seleccionada"),
      ).toBeInTheDocument();
      expect(mockDecorationLayer).not.toHaveBeenCalled();
    });

    it("renders preview when svg is valid and pattern is set", () => {
      render(
        <DecorationPreview
          svg="flower"
          pattern={DecorationPatterns.CORNERS}
          opacity={50}
          size={60}
        />,
      );

      // Should render preview (not empty state) when both svg and pattern are valid
      expect(screen.getByTestId("decoration-layer")).toBeInTheDocument();
      expect(mockDecorationLayer).toHaveBeenCalled();
    });

    it("renders empty state Card with correct styling", () => {
      render(
        <DecorationPreview
          svg="none"
          pattern={DecorationPatterns.CORNERS}
          opacity={50}
          size={60}
        />,
      );

      const cardBody = screen.getByTestId("card-body");
      expect(cardBody).toHaveClass("h-32");
      expect(cardBody).toHaveClass("flex");
      expect(cardBody).toHaveClass("items-center");
      expect(cardBody).toHaveClass("justify-center");
    });
  });

  describe("Rendering - With Decoration", () => {
    it("renders preview with DecorationLayer", () => {
      render(
        <DecorationPreview
          svg="flower"
          pattern={DecorationPatterns.CORNERS}
          opacity={50}
          size={60}
        />,
      );

      expect(screen.getByTestId("decoration-layer")).toBeInTheDocument();
      expect(screen.getByText("Contenido de ejemplo")).toBeInTheDocument();
    });

    it("renders 'Vista Previa' label", () => {
      render(
        <DecorationPreview
          svg="flower"
          pattern={DecorationPatterns.CORNERS}
          opacity={50}
          size={60}
        />,
      );

      expect(screen.getByText("Vista Previa")).toBeInTheDocument();
    });

    it("passes scaled size to DecorationLayer (size * 0.4)", () => {
      render(
        <DecorationPreview
          svg="flower"
          pattern={DecorationPatterns.CORNERS}
          opacity={50}
          size={100}
        />,
      );

      const callArgs = mockDecorationLayer.mock.calls[0][0];
      expect(callArgs.size).toBe(40); // 100 * 0.4
    });

    it("enforces minimum size of 20px even when scaled", () => {
      render(
        <DecorationPreview
          svg="flower"
          pattern={DecorationPatterns.CORNERS}
          opacity={50}
          size={40}
        />,
      );

      const callArgs = mockDecorationLayer.mock.calls[0][0];
      expect(callArgs.size).toBe(20); // Math.max(20, 40 * 0.4) = Math.max(20, 16) = 20
    });

    it("passes svg prop to DecorationLayer", () => {
      render(
        <DecorationPreview
          svg="heart"
          pattern={DecorationPatterns.CORNERS}
          opacity={50}
          size={60}
        />,
      );

      const callArgs = mockDecorationLayer.mock.calls[0][0];
      expect(callArgs.svg).toBe("heart");
    });

    it("passes pattern prop to DecorationLayer", () => {
      render(
        <DecorationPreview
          svg="flower"
          pattern={DecorationPatterns.TILED}
          opacity={50}
          size={60}
        />,
      );

      const callArgs = mockDecorationLayer.mock.calls[0][0];
      expect(callArgs.pattern).toBe(DecorationPatterns.TILED);
    });

    it("passes opacity prop to DecorationLayer", () => {
      render(
        <DecorationPreview
          svg="flower"
          pattern={DecorationPatterns.CORNERS}
          opacity={75}
          size={60}
        />,
      );

      const callArgs = mockDecorationLayer.mock.calls[0][0];
      expect(callArgs.opacity).toBe(75);
    });
  });

  describe("Background Variants", () => {
    it("renders default background (gradient) when hasAlternateBg is false", () => {
      const { container } = render(
        <DecorationPreview
          svg="flower"
          pattern={DecorationPatterns.CORNERS}
          opacity={50}
          size={60}
          hasAlternateBg={false}
        />,
      );

      const contentDiv = container.querySelector(".h-40") as HTMLElement;
      expect(contentDiv).toHaveClass("bg-gradient-to-br");
      expect(contentDiv).toHaveClass("from-gray-50");
      expect(contentDiv).toHaveClass("to-gray-100");
    });

    it("does not render background layer when hasAlternateBg is false", () => {
      const { container } = render(
        <DecorationPreview
          svg="flower"
          pattern={DecorationPatterns.CORNERS}
          opacity={50}
          size={60}
          hasAlternateBg={false}
        />,
      );

      const bgLayer = container.querySelector(".bg-secondary");
      expect(bgLayer).not.toBeInTheDocument();
    });

    it("renders background layer when hasAlternateBg is true", () => {
      const { container } = render(
        <DecorationPreview
          svg="flower"
          pattern={DecorationPatterns.CORNERS}
          opacity={50}
          size={60}
          hasAlternateBg={true}
        />,
      );

      const bgLayer = container.querySelector(".bg-secondary");
      expect(bgLayer).toBeInTheDocument();
      expect(bgLayer).toHaveClass("absolute");
      expect(bgLayer).toHaveClass("inset-0");
      expect(bgLayer).toHaveClass("-z-10");
    });

    it("renders secondary-foreground text when hasAlternateBg is true", () => {
      const { container } = render(
        <DecorationPreview
          svg="flower"
          pattern={DecorationPatterns.CORNERS}
          opacity={50}
          size={60}
          hasAlternateBg={true}
        />,
      );

      const contentDiv = container.querySelector(".h-40") as HTMLElement;
      expect(contentDiv).toHaveClass("text-secondary-foreground");

      const textElement = screen.getByText("Contenido de ejemplo");
      expect(textElement).toHaveClass("text-secondary-foreground");
    });

    it("passes hasAlternateBg to DecorationLayer", () => {
      render(
        <DecorationPreview
          svg="flower"
          pattern={DecorationPatterns.CORNERS}
          opacity={50}
          size={60}
          hasAlternateBg={true}
        />,
      );

      const callArgs = mockDecorationLayer.mock.calls[0][0];
      expect(callArgs.hasAlternateBg).toBe(true);
    });

    it("defaults hasAlternateBg to false", () => {
      render(
        <DecorationPreview
          svg="flower"
          pattern={DecorationPatterns.CORNERS}
          opacity={50}
          size={60}
        />,
      );

      const callArgs = mockDecorationLayer.mock.calls[0][0];
      expect(callArgs.hasAlternateBg).toBe(false);
    });
  });

  describe("Preview Container Styling", () => {
    it("renders Card with overflow hidden", () => {
      render(
        <DecorationPreview
          svg="flower"
          pattern={DecorationPatterns.CORNERS}
          opacity={50}
          size={60}
        />,
      );

      // Only one card is rendered (preview state)
      const card = screen.getByTestId("card");
      expect(card).toHaveClass("overflow-hidden");
    });

    it("renders CardBody with no padding", () => {
      render(
        <DecorationPreview
          svg="flower"
          pattern={DecorationPatterns.CORNERS}
          opacity={50}
          size={60}
        />,
      );

      // Only one cardBody is rendered (preview state)
      const cardBody = screen.getByTestId("card-body");
      expect(cardBody).toHaveClass("p-0");
    });

    it("renders content div with fixed height", () => {
      const { container } = render(
        <DecorationPreview
          svg="flower"
          pattern={DecorationPatterns.CORNERS}
          opacity={50}
          size={60}
        />,
      );

      const contentDiv = container.querySelector(".h-40");
      expect(contentDiv).toBeInTheDocument();
    });

    it("renders content div with flexbox centering", () => {
      const { container } = render(
        <DecorationPreview
          svg="flower"
          pattern={DecorationPatterns.CORNERS}
          opacity={50}
          size={60}
        />,
      );

      const contentDiv = container.querySelector(".h-40") as HTMLElement;
      expect(contentDiv).toHaveClass("flex");
      expect(contentDiv).toHaveClass("items-center");
      expect(contentDiv).toHaveClass("justify-center");
    });
  });

  describe("Edge Cases", () => {
    it("handles all SVG types", () => {
      const svgTypes = [
        DecorationSVGs.FLOWER,
        DecorationSVGs.LEAF,
        DecorationSVGs.HEART,
        DecorationSVGs.BRANCH,
        DecorationSVGs.BRANCH_2,
      ];

      svgTypes.forEach((svg) => {
        const { unmount } = render(
          <DecorationPreview
            svg={svg}
            pattern={DecorationPatterns.CORNERS}
            opacity={50}
            size={60}
          />,
        );

        const callArgs = mockDecorationLayer.mock.calls[0][0];
        expect(callArgs.svg).toBe(svg);

        unmount();
        vi.clearAllMocks();
      });
    });

    it("handles all pattern types", () => {
      const patterns = [
        DecorationPatterns.CORNERS,
        DecorationPatterns.SCATTERED_GRID_ALT,
        DecorationPatterns.TILED,
        DecorationPatterns.BORDER_TOP,
        DecorationPatterns.CENTER,
      ];

      patterns.forEach((pattern) => {
        const { unmount } = render(
          <DecorationPreview
            svg="flower"
            pattern={pattern}
            opacity={50}
            size={60}
          />,
        );

        const callArgs = mockDecorationLayer.mock.calls[0][0];
        expect(callArgs.pattern).toBe(pattern);

        unmount();
        vi.clearAllMocks();
      });
    });

    it("handles opacity edge values (0 and 100)", () => {
      const { rerender } = render(
        <DecorationPreview
          svg="flower"
          pattern={DecorationPatterns.CORNERS}
          opacity={0}
          size={60}
        />,
      );

      let callArgs = mockDecorationLayer.mock.calls[0][0];
      expect(callArgs.opacity).toBe(0);

      rerender(
        <DecorationPreview
          svg="flower"
          pattern={DecorationPatterns.CORNERS}
          opacity={100}
          size={60}
        />,
      );

      callArgs = mockDecorationLayer.mock.calls[1][0];
      expect(callArgs.opacity).toBe(100);
    });

    it("handles size edge values", () => {
      const { rerender } = render(
        <DecorationPreview
          svg="flower"
          pattern={DecorationPatterns.CORNERS}
          opacity={50}
          size={20}
        />,
      );

      // 20 * 0.4 = 8, but Math.max(20, 8) = 20
      let callArgs = mockDecorationLayer.mock.calls[0][0];
      expect(callArgs.size).toBe(20);

      rerender(
        <DecorationPreview
          svg="flower"
          pattern={DecorationPatterns.CORNERS}
          opacity={50}
          size={200}
        />,
      );

      // 200 * 0.4 = 80
      callArgs = mockDecorationLayer.mock.calls[1][0];
      expect(callArgs.size).toBe(80);
    });

    it("transitions between empty state and preview", () => {
      const { rerender } = render(
        <DecorationPreview
          svg="none"
          pattern={DecorationPatterns.CORNERS}
          opacity={50}
          size={60}
        />,
      );

      expect(
        screen.getByText("Sin decoración seleccionada"),
      ).toBeInTheDocument();

      rerender(
        <DecorationPreview
          svg="flower"
          pattern={DecorationPatterns.CORNERS}
          opacity={50}
          size={60}
        />,
      );

      expect(
        screen.queryByText("Sin decoración seleccionada"),
      ).not.toBeInTheDocument();
      expect(screen.getByText("Vista Previa")).toBeInTheDocument();
    });
  });
});
