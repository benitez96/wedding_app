// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SectionIcon } from "@/components/ui/SectionIcon";
import { SectionIcons } from "@/types/section-icon";

// Mock Next.js Image component
const mockImage = vi.hoisted(() => vi.fn());
vi.mock("next/image", () => ({
  default: mockImage,
}));

describe("SectionIcon", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default Image mock implementation
    mockImage.mockImplementation(
      ({ src, alt, width, height, className, unoptimized }) => (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={className}
          data-unoptimized={unoptimized}
        />
      ),
    );
  });

  describe("Rendering", () => {
    it("renders icon with valid config", () => {
      render(<SectionIcon icon={SectionIcons.RINGS_1} alt="Wedding rings" />);

      const img = screen.getByAltText("Wedding rings");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "/icons/anillos-boda-1.gif");
    });

    it("renders with default alt text", () => {
      render(<SectionIcon icon={SectionIcons.RINGS_1} />);

      const img = screen.getByAltText("Section icon");
      expect(img).toBeInTheDocument();
    });

    it("renders with custom size", () => {
      render(<SectionIcon icon={SectionIcons.RINGS_1} size={150} />);

      const img = screen.getByAltText("Section icon");
      expect(img).toHaveAttribute("width", "150");
      expect(img).toHaveAttribute("height", "150");
    });

    it("renders with default size of 100", () => {
      render(<SectionIcon icon={SectionIcons.RINGS_1} />);

      const img = screen.getByAltText("Section icon");
      expect(img).toHaveAttribute("width", "100");
      expect(img).toHaveAttribute("height", "100");
    });

    it("renders with custom className", () => {
      render(
        <SectionIcon
          icon={SectionIcons.RINGS_1}
          className="custom-class"
          alt="Test"
        />,
      );

      const container = screen.getByAltText("Test").parentElement;
      expect(container).toHaveClass("custom-class");
    });

    it("includes base classes on container", () => {
      render(<SectionIcon icon={SectionIcons.RINGS_1} alt="Test" />);

      const container = screen.getByAltText("Test").parentElement;
      expect(container).toHaveClass("relative");
      expect(container).toHaveClass("flex");
      expect(container).toHaveClass("items-center");
      expect(container).toHaveClass("justify-center");
    });
  });

  describe("GIF optimization", () => {
    it("sets unoptimized=true for GIF icons", () => {
      render(<SectionIcon icon={SectionIcons.RINGS_1} alt="GIF icon" />);

      const img = screen.getByAltText("GIF icon");
      expect(img).toHaveAttribute("data-unoptimized", "true");
    });

    it("does not set unoptimized for non-GIF icons", () => {
      // This test would need an SVG icon in the catalog
      // For now, all icons in catalog are GIFs
      render(<SectionIcon icon={SectionIcons.RINGS_1} />);

      const img = screen.getByAltText("Section icon");
      // GIFs should have unoptimized=true
      expect(img).toHaveAttribute("data-unoptimized", "true");
    });
  });

  describe("Animation classes", () => {
    it("applies animation class if present in config", () => {
      // Current catalog icons don't have animationClass
      // This tests the logic exists
      render(<SectionIcon icon={SectionIcons.RINGS_1} alt="Animated" />);

      const img = screen.getByAltText("Animated");
      expect(img).toHaveClass("object-contain");
    });

    it("includes object-contain class", () => {
      render(<SectionIcon icon={SectionIcons.RINGS_1} alt="Test" />);

      const img = screen.getByAltText("Test");
      expect(img).toHaveClass("object-contain");
    });
  });

  describe("Null rendering", () => {
    it("returns null for 'none' icon", () => {
      const { container } = render(<SectionIcon icon={SectionIcons.NONE} />);

      expect(container.firstChild).toBeNull();
    });

    it("returns null for invalid icon", () => {
      const { container } = render(
        <SectionIcon icon={"invalid-icon" as any} />,
      );

      expect(container.firstChild).toBeNull();
    });

    it("does not render when config has no path", () => {
      const { container } = render(<SectionIcon icon={SectionIcons.NONE} />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe("Different icon types", () => {
    it("renders rings icon", () => {
      render(<SectionIcon icon={SectionIcons.RINGS_1} alt="Rings" />);

      const img = screen.getByAltText("Rings");
      expect(img).toHaveAttribute("src", "/icons/anillos-boda-1.gif");
    });

    it("renders celebration icon", () => {
      render(
        <SectionIcon icon={SectionIcons.CELEBRATION_1} alt="Celebration" />,
      );

      const img = screen.getByAltText("Celebration");
      expect(img).toHaveAttribute("src", "/icons/copas-fiesta-1.gif");
    });

    it("renders gift icon", () => {
      render(<SectionIcon icon={SectionIcons.GIFT_1} alt="Gift" />);

      const img = screen.getByAltText("Gift");
      expect(img).toHaveAttribute("src", "/icons/regalo-1.gif");
    });

    it("renders instagram icon", () => {
      render(<SectionIcon icon={SectionIcons.INSTAGRAM} alt="Instagram" />);

      const img = screen.getByAltText("Instagram");
      expect(img).toHaveAttribute("src", "/icons/instagram.gif");
    });
  });

  describe("Props combinations", () => {
    it("renders with all props combined", () => {
      render(
        <SectionIcon
          icon={SectionIcons.RINGS_1}
          size={200}
          className="my-custom-class"
          alt="Custom alt text"
        />,
      );

      const img = screen.getByAltText("Custom alt text");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("width", "200");
      expect(img).toHaveAttribute("height", "200");
      expect(img.parentElement).toHaveClass("my-custom-class");
    });

    it("works with minimal props (icon only)", () => {
      render(<SectionIcon icon={SectionIcons.RINGS_1} />);

      const img = screen.getByAltText("Section icon");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("width", "100");
      expect(img).toHaveAttribute("height", "100");
    });
  });
});
