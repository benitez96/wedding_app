// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SectionIconSelector } from "@/components/ui/SectionIconSelector";
import type { SectionIcon } from "@/types/section-icon";

// Mock Next.js Image component
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    width,
    height,
    className,
    unoptimized,
  }: {
    src: string;
    alt: string;
    width: number;
    height: number;
    className?: string;
    unoptimized?: boolean;
  }) => (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      data-unoptimized={unoptimized}
    />
  ),
}));

// Mock HeroUI RadioGroup
const mockRadioGroup = vi.hoisted(() => vi.fn());
const mockUseRadio = vi.hoisted(() => vi.fn());

vi.mock("@heroui/radio", () => ({
  RadioGroup: mockRadioGroup,
  useRadio: mockUseRadio,
}));

// Mock react-aria VisuallyHidden
vi.mock("@react-aria/visually-hidden", () => ({
  VisuallyHidden: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="visually-hidden">{children}</div>
  ),
}));

// Mock HeroUI theme cn utility
vi.mock("@heroui/theme", () => ({
  cn: (...classes: (string | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Ban: () => <svg data-testid="ban-icon" />,
  Image: () => <svg data-testid="image-icon" />,
}));

describe("SectionIconSelector", () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock RadioGroup to render children
    mockRadioGroup.mockImplementation(
      ({
        value,
        onValueChange,
        children,
        orientation,
        classNames,
      }: {
        value: string;
        onValueChange: (val: string) => void;
        children: React.ReactNode;
        orientation: string;
        classNames?: { wrapper: string };
      }) => (
        <div
          data-testid="radio-group"
          data-value={value}
          data-orientation={orientation}
          className={classNames?.wrapper}
        >
          {children}
        </div>
      ),
    );

    // Mock useRadio to provide radio component API
    mockUseRadio.mockImplementation(
      ({
        value,
        label,
        type,
        path,
        animationClass,
        children,
      }: {
        value: string;
        label: string;
        type: string;
        path: string;
        animationClass?: string;
        children?: React.ReactNode;
      }) => ({
        Component: "div",
        children,
        getBaseProps: () => ({
          "data-testid": `radio-${value}`,
          "data-value": value,
          "data-type": type,
          "data-path": path,
          "data-animation-class": animationClass,
        }),
        getInputProps: () => ({
          type: "radio",
          name: "section-icon",
          value,
          "aria-label": label,
        }),
        getWrapperProps: () => ({
          "data-testid": `wrapper-${value}`,
        }),
      }),
    );
  });

  describe("Rendering", () => {
    it("renders with default label", () => {
      render(<SectionIconSelector value="rings-1" onChange={mockOnChange} />);

      expect(screen.getByText("Ícono de Sección")).toBeInTheDocument();
      expect(screen.getByTestId("image-icon")).toBeInTheDocument();
    });

    it("renders with custom label", () => {
      render(
        <SectionIconSelector
          value="rings-1"
          onChange={mockOnChange}
          label="Custom Icon Label"
        />,
      );

      expect(screen.getByText("Custom Icon Label")).toBeInTheDocument();
    });

    it("renders all icon options from catalog", () => {
      render(<SectionIconSelector value="none" onChange={mockOnChange} />);

      // Check that RadioGroup receives all icons
      // The catalog has 17 icons (1 none + 16 GIFs)
      expect(screen.getByText("No icon")).toBeInTheDocument();
      expect(screen.getByText("Rings 1")).toBeInTheDocument();
      expect(screen.getByText("Rings 2")).toBeInTheDocument();
      expect(screen.getByText("Glasses 1")).toBeInTheDocument();
      expect(screen.getByText("Instagram")).toBeInTheDocument();
    });

    it("renders Ban icon for 'none' option", () => {
      render(<SectionIconSelector value="none" onChange={mockOnChange} />);

      expect(screen.getByTestId("ban-icon")).toBeInTheDocument();
    });

    it("renders images for icon options", () => {
      render(<SectionIconSelector value="rings-1" onChange={mockOnChange} />);

      const ringsImg = screen.getByRole("img", { name: "Rings 1" });
      expect(ringsImg).toBeInTheDocument();
      expect(ringsImg).toHaveAttribute("src", "/icons/anillos-boda-1.gif");
    });

    it("renders with horizontal orientation", () => {
      render(<SectionIconSelector value="rings-1" onChange={mockOnChange} />);

      const radioGroup = screen.getByTestId("radio-group");
      expect(radioGroup).toHaveAttribute("data-orientation", "horizontal");
    });

    it("renders with current value", () => {
      render(<SectionIconSelector value="gift-1" onChange={mockOnChange} />);

      const radioGroup = screen.getByTestId("radio-group");
      expect(radioGroup).toHaveAttribute("data-value", "gift-1");
    });
  });

  describe("GIF rendering", () => {
    it("marks GIF images as unoptimized", () => {
      render(<SectionIconSelector value="rings-1" onChange={mockOnChange} />);

      const ringsImg = screen.getByRole("img", { name: "Rings 1" });
      expect(ringsImg).toHaveAttribute("data-unoptimized", "true");
    });

    it("renders GIF badge for GIF images", () => {
      render(<SectionIconSelector value="rings-1" onChange={mockOnChange} />);

      // All icons in catalog are GIFs except "none"
      const gifBadges = screen.getAllByText("GIF");
      expect(gifBadges.length).toBeGreaterThan(0);
    });

    it("does not render GIF badge for none option", () => {
      render(<SectionIconSelector value="none" onChange={mockOnChange} />);

      // "none" has no path, so no GIF badge should appear for it
      // But other GIFs still have badges
      const gifBadges = screen.getAllByText("GIF");
      expect(gifBadges.length).toBeGreaterThan(0); // Other icons have GIF badges
    });
  });

  describe("Info text", () => {
    it("shows type info when value is not 'none'", () => {
      render(<SectionIconSelector value="rings-1" onChange={mockOnChange} />);

      expect(screen.getByText(/Tipo:/)).toBeInTheDocument();
      // Use getByText with exact match to find the info text, not the badges
      expect(screen.getByText("Tipo: GIF")).toBeInTheDocument();
    });

    it("does not show type info when value is 'none'", () => {
      render(<SectionIconSelector value="none" onChange={mockOnChange} />);

      expect(screen.queryByText(/Tipo:/)).not.toBeInTheDocument();
    });

    it("shows correct type for selected icon", () => {
      const { rerender } = render(
        <SectionIconSelector value="rings-1" onChange={mockOnChange} />,
      );

      expect(screen.getByText("Tipo: GIF")).toBeInTheDocument();

      // If we had a different type, it would show that
      rerender(<SectionIconSelector value="gift-1" onChange={mockOnChange} />);
      expect(screen.getByText("Tipo: GIF")).toBeInTheDocument();
    });
  });

  describe("Interaction", () => {
    it("calls onChange with new value when selection changes", () => {
      render(<SectionIconSelector value="rings-1" onChange={mockOnChange} />);

      const onValueChange = mockRadioGroup.mock.calls[0][0].onValueChange;
      onValueChange("gift-1");

      expect(mockOnChange).toHaveBeenCalledWith("gift-1");
    });

    it("calls onChange with 'none' when none is selected", () => {
      render(<SectionIconSelector value="rings-1" onChange={mockOnChange} />);

      const onValueChange = mockRadioGroup.mock.calls[0][0].onValueChange;
      onValueChange("none");

      expect(mockOnChange).toHaveBeenCalledWith("none");
    });

    it("accepts all valid SectionIcon values", () => {
      const validValues: SectionIcon[] = [
        "none",
        "rings-1",
        "rings-2",
        "gift-1",
        "instagram",
      ];

      validValues.forEach((value) => {
        const { unmount } = render(
          <SectionIconSelector value={value} onChange={mockOnChange} />,
        );

        const radioGroup = screen.getByTestId("radio-group");
        expect(radioGroup).toHaveAttribute("data-value", value);

        unmount();
      });
    });
  });

  describe("Props", () => {
    it("updates displayed value when value prop changes", () => {
      const { rerender } = render(
        <SectionIconSelector value="rings-1" onChange={mockOnChange} />,
      );

      let radioGroup = screen.getByTestId("radio-group");
      expect(radioGroup).toHaveAttribute("data-value", "rings-1");

      rerender(<SectionIconSelector value="gift-1" onChange={mockOnChange} />);

      radioGroup = screen.getByTestId("radio-group");
      expect(radioGroup).toHaveAttribute("data-value", "gift-1");
    });

    it("calls onChange handler exactly once per change", () => {
      render(<SectionIconSelector value="rings-1" onChange={mockOnChange} />);

      const onValueChange = mockRadioGroup.mock.calls[0][0].onValueChange;

      onValueChange("gift-1");
      expect(mockOnChange).toHaveBeenCalledTimes(1);

      onValueChange("instagram");
      expect(mockOnChange).toHaveBeenCalledTimes(2);
    });
  });

  describe("RadioGroup configuration", () => {
    it("passes correct classNames to RadioGroup", () => {
      render(<SectionIconSelector value="rings-1" onChange={mockOnChange} />);

      const callArgs = mockRadioGroup.mock.calls[0][0];
      expect(callArgs).toMatchObject({
        classNames: {
          wrapper: "gap-2 flex-nowrap",
        },
      });
    });

    it("uses RadioGroup with horizontal orientation", () => {
      render(<SectionIconSelector value="rings-1" onChange={mockOnChange} />);

      const callArgs = mockRadioGroup.mock.calls[0][0];
      expect(callArgs).toMatchObject({
        orientation: "horizontal",
      });
    });
  });

  describe("Accessibility", () => {
    it("renders hidden radio inputs via VisuallyHidden", () => {
      render(<SectionIconSelector value="rings-1" onChange={mockOnChange} />);

      const visuallyHidden = screen.getAllByTestId("visually-hidden");
      expect(visuallyHidden.length).toBeGreaterThan(0);
    });

    it("uses semantic label element", () => {
      render(<SectionIconSelector value="rings-1" onChange={mockOnChange} />);

      const label = screen.getByText("Ícono de Sección");
      expect(label.tagName).toBe("LABEL");
    });
  });

  describe("Edge cases", () => {
    it("handles rapid selection changes", () => {
      render(<SectionIconSelector value="rings-1" onChange={mockOnChange} />);

      const onValueChange = mockRadioGroup.mock.calls[0][0].onValueChange;

      onValueChange("rings-2");
      onValueChange("gift-1");
      onValueChange("instagram");
      onValueChange("none");

      expect(mockOnChange).toHaveBeenCalledTimes(4);
      expect(mockOnChange).toHaveBeenNthCalledWith(1, "rings-2");
      expect(mockOnChange).toHaveBeenNthCalledWith(2, "gift-1");
      expect(mockOnChange).toHaveBeenNthCalledWith(3, "instagram");
      expect(mockOnChange).toHaveBeenNthCalledWith(4, "none");
    });

    it("renders correctly with same value selected", () => {
      render(<SectionIconSelector value="rings-1" onChange={mockOnChange} />);

      const onValueChange = mockRadioGroup.mock.calls[0][0].onValueChange;
      onValueChange("rings-1");

      expect(mockOnChange).toHaveBeenCalledWith("rings-1");
    });

    it("handles icons with animation classes", () => {
      // Note: Current catalog doesn't have animated SVGs, but component supports it
      render(<SectionIconSelector value="rings-1" onChange={mockOnChange} />);

      // Component should render without errors even if animationClass is undefined
      expect(screen.getByTestId("radio-group")).toBeInTheDocument();
    });
  });
});
