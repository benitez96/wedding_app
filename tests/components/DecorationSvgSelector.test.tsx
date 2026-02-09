// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DecorationSvgSelector } from "@/components/ui/DecorationSvgSelector";
import type { DecorationSvg } from "@/types/decoration";

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
    width: number;
    height: number;
    className?: string;
  }) => (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
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

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Ban: () => <svg data-testid="ban-icon" />,
}));

describe("DecorationSvgSelector", () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock RadioGroup to render children with value change handler
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
        children,
      }: {
        value: string;
        label: string;
        children?: React.ReactNode;
      }) => ({
        Component: "div",
        children,
        getBaseProps: () => ({
          "data-testid": `radio-${value}`,
          "data-value": value,
          "data-selected": false,
        }),
        getInputProps: () => ({
          type: "radio",
          name: "decoration",
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
    it("renders with label", () => {
      render(<DecorationSvgSelector value="flower" onChange={mockOnChange} />);

      expect(screen.getByText("Elemento Decorativo")).toBeInTheDocument();
    });

    it("renders all SVG options", () => {
      render(<DecorationSvgSelector value="flower" onChange={mockOnChange} />);

      // Check for all option labels
      expect(screen.getByText("Sin decoración")).toBeInTheDocument();
      expect(screen.getByText("Flor")).toBeInTheDocument();
      expect(screen.getByText("Hoja")).toBeInTheDocument();
      expect(screen.getByText("Corazón")).toBeInTheDocument();
      expect(screen.getByText("Rama")).toBeInTheDocument();
      expect(screen.getByText("Rama 2")).toBeInTheDocument();
    });

    it("renders Ban icon for 'none' option", () => {
      render(<DecorationSvgSelector value="none" onChange={mockOnChange} />);

      // There should be exactly one Ban icon (for "none" option)
      expect(screen.getByTestId("ban-icon")).toBeInTheDocument();
    });

    it("renders SVG images for decoration options", () => {
      render(<DecorationSvgSelector value="flower" onChange={mockOnChange} />);

      // Check for flower SVG
      const flowerImg = screen.getByRole("img", { name: "Flor" });
      expect(flowerImg).toBeInTheDocument();
      expect(flowerImg).toHaveAttribute("src", "/tramas/svgs/flower.svg");

      // Check for leaf SVG
      const leafImg = screen.getByRole("img", { name: "Hoja" });
      expect(leafImg).toBeInTheDocument();
      expect(leafImg).toHaveAttribute("src", "/tramas/svgs/leaf.svg");

      // Check for heart SVG
      const heartImg = screen.getByRole("img", { name: "Corazón" });
      expect(heartImg).toBeInTheDocument();
      expect(heartImg).toHaveAttribute("src", "/tramas/svgs/heart.svg");
    });

    it("renders with horizontal orientation", () => {
      render(<DecorationSvgSelector value="flower" onChange={mockOnChange} />);

      const radioGroup = screen.getByTestId("radio-group");
      expect(radioGroup).toHaveAttribute("data-orientation", "horizontal");
    });

    it("renders with current value", () => {
      render(<DecorationSvgSelector value="heart" onChange={mockOnChange} />);

      const radioGroup = screen.getByTestId("radio-group");
      expect(radioGroup).toHaveAttribute("data-value", "heart");
    });
  });

  describe("Interaction", () => {
    it("calls onChange with new value when selection changes", () => {
      render(<DecorationSvgSelector value="flower" onChange={mockOnChange} />);

      // Simulate RadioGroup calling onValueChange
      const radioGroup = screen.getByTestId("radio-group");
      const onValueChange = mockRadioGroup.mock.calls[0][0].onValueChange;

      onValueChange("heart");

      expect(mockOnChange).toHaveBeenCalledWith("heart");
    });

    it("calls onChange with 'none' when none is selected", () => {
      render(<DecorationSvgSelector value="flower" onChange={mockOnChange} />);

      const onValueChange = mockRadioGroup.mock.calls[0][0].onValueChange;
      onValueChange("none");

      expect(mockOnChange).toHaveBeenCalledWith("none");
    });

    it("accepts all valid DecorationSvg values", () => {
      const validValues: DecorationSvg[] = [
        "none",
        "flower",
        "leaf",
        "heart",
        "branch",
        "branch-2",
      ];

      validValues.forEach((value) => {
        const { unmount } = render(
          <DecorationSvgSelector value={value} onChange={mockOnChange} />,
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
        <DecorationSvgSelector value="flower" onChange={mockOnChange} />,
      );

      let radioGroup = screen.getByTestId("radio-group");
      expect(radioGroup).toHaveAttribute("data-value", "flower");

      rerender(<DecorationSvgSelector value="heart" onChange={mockOnChange} />);

      radioGroup = screen.getByTestId("radio-group");
      expect(radioGroup).toHaveAttribute("data-value", "heart");
    });

    it("calls onChange handler exactly once per change", () => {
      render(<DecorationSvgSelector value="flower" onChange={mockOnChange} />);

      const onValueChange = mockRadioGroup.mock.calls[0][0].onValueChange;

      onValueChange("leaf");
      expect(mockOnChange).toHaveBeenCalledTimes(1);

      onValueChange("branch");
      expect(mockOnChange).toHaveBeenCalledTimes(2);
    });
  });

  describe("RadioGroup configuration", () => {
    it("passes correct classNames to RadioGroup", () => {
      render(<DecorationSvgSelector value="flower" onChange={mockOnChange} />);

      const callArgs = mockRadioGroup.mock.calls[0][0];
      expect(callArgs).toMatchObject({
        classNames: {
          wrapper: "gap-2 flex-nowrap",
        },
      });
    });

    it("uses RadioGroup with horizontal orientation", () => {
      render(<DecorationSvgSelector value="flower" onChange={mockOnChange} />);

      const callArgs = mockRadioGroup.mock.calls[0][0];
      expect(callArgs).toMatchObject({
        orientation: "horizontal",
      });
    });
  });

  describe("Accessibility", () => {
    it("renders hidden radio inputs via VisuallyHidden", () => {
      render(<DecorationSvgSelector value="flower" onChange={mockOnChange} />);

      const visuallyHidden = screen.getAllByTestId("visually-hidden");
      expect(visuallyHidden.length).toBeGreaterThan(0);
    });

    it("uses semantic label element", () => {
      render(<DecorationSvgSelector value="flower" onChange={mockOnChange} />);

      const label = screen.getByText("Elemento Decorativo");
      expect(label.tagName).toBe("LABEL");
    });
  });

  describe("Edge cases", () => {
    it("handles rapid selection changes", () => {
      render(<DecorationSvgSelector value="flower" onChange={mockOnChange} />);

      const onValueChange = mockRadioGroup.mock.calls[0][0].onValueChange;

      onValueChange("leaf");
      onValueChange("heart");
      onValueChange("branch");
      onValueChange("none");

      expect(mockOnChange).toHaveBeenCalledTimes(4);
      expect(mockOnChange).toHaveBeenNthCalledWith(1, "leaf");
      expect(mockOnChange).toHaveBeenNthCalledWith(2, "heart");
      expect(mockOnChange).toHaveBeenNthCalledWith(3, "branch");
      expect(mockOnChange).toHaveBeenNthCalledWith(4, "none");
    });

    it("renders correctly with same value selected", () => {
      render(<DecorationSvgSelector value="flower" onChange={mockOnChange} />);

      const onValueChange = mockRadioGroup.mock.calls[0][0].onValueChange;

      onValueChange("flower");

      expect(mockOnChange).toHaveBeenCalledWith("flower");
    });
  });
});
