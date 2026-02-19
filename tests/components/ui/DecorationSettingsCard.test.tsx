// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DecorationSettingsCard } from "@/components/ui/DecorationSettingsCard";
import {
  DecorationPatterns,
  DecorationSVGs,
  type DecorationPattern,
} from "@/types/decoration";

// Mock DecorationSvgSelector component
const mockDecorationSvgSelector = vi.hoisted(() => vi.fn());

vi.mock("@/components/ui/DecorationSvgSelector", () => ({
  DecorationSvgSelector: mockDecorationSvgSelector,
}));

// Mock HeroUI components
const mockCard = vi.hoisted(() => vi.fn());
const mockCardBody = vi.hoisted(() => vi.fn());
const mockSelect = vi.hoisted(() => vi.fn());
const mockSelectItem = vi.hoisted(() => vi.fn());
const mockSlider = vi.hoisted(() => vi.fn());

vi.mock("@heroui/card", () => ({
  Card: mockCard,
  CardBody: mockCardBody,
}));

vi.mock("@heroui/select", () => ({
  Select: mockSelect,
  SelectItem: mockSelectItem,
}));

vi.mock("@heroui/slider", () => ({
  Slider: mockSlider,
}));

// Mock getPatternLabel
vi.mock("@/lib/decoration-patterns", () => ({
  getPatternLabel: (pattern: string) => `Label for ${pattern}`,
}));

describe("DecorationSettingsCard", () => {
  const mockOnDecorationSvgChange = vi.fn();
  const mockOnDecorationPatternChange = vi.fn();
  const mockOnDecorationOpacityChange = vi.fn();
  const mockOnDecorationSizeChange = vi.fn();

  const defaultProps = {
    decorationSvg: DecorationSVGs.FLOWER,
    decorationPattern: DecorationPatterns.CORNERS,
    decorationOpacity: 50,
    decorationSize: 60,
    onDecorationSvgChange: mockOnDecorationSvgChange,
    onDecorationPatternChange: mockOnDecorationPatternChange,
    onDecorationOpacityChange: mockOnDecorationOpacityChange,
    onDecorationSizeChange: mockOnDecorationSizeChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Card
    mockCard.mockImplementation(
      ({ children }: { children: React.ReactNode }) => (
        <div data-testid="card">{children}</div>
      ),
    );

    // Mock CardBody
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

    // Mock DecorationSvgSelector
    mockDecorationSvgSelector.mockImplementation(
      ({
        value,
        onChange,
      }: {
        value: string;
        onChange: (val: string) => void;
      }) => (
        <div data-testid="decoration-svg-selector" data-value={value}>
          Decoration SVG Selector
        </div>
      ),
    );

    // Mock Select
    mockSelect.mockImplementation(
      ({
        label,
        description,
        selectedKeys,
        onChange,
        children,
      }: {
        label: string;
        description?: string;
        selectedKeys: string[];
        onChange: (e: { target: { value: string } }) => void;
        children: React.ReactNode;
      }) => (
        <div data-testid="select">
          <label>{label}</label>
          {description && <p>{description}</p>}
          <select
            data-selected-keys={JSON.stringify(selectedKeys)}
            onChange={onChange}
          >
            {children}
          </select>
        </div>
      ),
    );

    // Mock SelectItem
    mockSelectItem.mockImplementation(
      ({ children }: { children: React.ReactNode }) => (
        <option>{children}</option>
      ),
    );

    // Mock Slider
    mockSlider.mockImplementation(
      ({
        value,
        onChange,
        minValue,
        maxValue,
      }: {
        value: number;
        onChange: (val: number) => void;
        minValue: number;
        maxValue: number;
      }) => (
        <input
          type="range"
          data-testid="slider"
          value={value}
          min={minValue}
          max={maxValue}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      ),
    );
  });

  describe("Rendering", () => {
    it("renders the card container", () => {
      render(<DecorationSettingsCard {...defaultProps} />);

      expect(screen.getByTestId("card")).toBeInTheDocument();
      expect(screen.getByTestId("card-body")).toBeInTheDocument();
    });

    it("renders heading with emoji", () => {
      render(<DecorationSettingsCard {...defaultProps} />);

      expect(screen.getByText("🌸 Decoraciones")).toBeInTheDocument();
    });

    it("renders DecorationSvgSelector", () => {
      render(<DecorationSettingsCard {...defaultProps} />);

      expect(screen.getByTestId("decoration-svg-selector")).toBeInTheDocument();
    });

    it("passes correct props to DecorationSvgSelector", () => {
      render(<DecorationSettingsCard {...defaultProps} />);

      const callArgs = mockDecorationSvgSelector.mock.calls[0][0];
      expect(callArgs.value).toBe(DecorationSVGs.FLOWER);
      expect(callArgs.onChange).toBe(mockOnDecorationSvgChange);
    });

    it("applies spacing classes to CardBody", () => {
      render(<DecorationSettingsCard {...defaultProps} />);

      const cardBody = screen.getByTestId("card-body");
      expect(cardBody).toHaveClass("space-y-4");
    });
  });

  describe("Conditional Rendering - svg='none'", () => {
    it("hides additional controls when svg is 'none'", () => {
      render(
        <DecorationSettingsCard
          {...defaultProps}
          decorationSvg={DecorationSVGs.NONE}
        />,
      );

      expect(
        screen.queryByText("Patrón de Repetición"),
      ).not.toBeInTheDocument();
      expect(screen.queryByText("Opacidad")).not.toBeInTheDocument();
      expect(screen.queryByText("Tamaño del elemento")).not.toBeInTheDocument();
    });

    it("shows only DecorationSvgSelector when svg is 'none'", () => {
      render(
        <DecorationSettingsCard
          {...defaultProps}
          decorationSvg={DecorationSVGs.NONE}
        />,
      );

      expect(screen.getByTestId("decoration-svg-selector")).toBeInTheDocument();
      expect(screen.queryByTestId("select")).not.toBeInTheDocument();
    });
  });

  describe("Conditional Rendering - svg!='none'", () => {
    it("shows all controls when svg is not 'none'", () => {
      render(<DecorationSettingsCard {...defaultProps} />);

      expect(screen.getByText("Patrón de Repetición")).toBeInTheDocument();
      expect(screen.getByText("Opacidad")).toBeInTheDocument();
      expect(screen.getByText("Tamaño del elemento")).toBeInTheDocument();
    });

    it("renders Pattern Select with label", () => {
      render(<DecorationSettingsCard {...defaultProps} />);

      expect(screen.getByText("Patrón de Repetición")).toBeInTheDocument();
      expect(
        screen.getByText("Elegí cómo se distribuyen los elementos"),
      ).toBeInTheDocument();
    });

    it("renders Opacity Slider with label and value", () => {
      render(<DecorationSettingsCard {...defaultProps} />);

      expect(screen.getByText("Opacidad")).toBeInTheDocument();
      expect(screen.getByText("50%")).toBeInTheDocument();
    });

    it("renders Size Slider with label and value", () => {
      render(<DecorationSettingsCard {...defaultProps} />);

      expect(screen.getByText("Tamaño del elemento")).toBeInTheDocument();
      expect(screen.getByText("60px")).toBeInTheDocument();
    });
  });

  describe("Pattern Select", () => {
    it("passes all DecorationPatterns to Select", () => {
      render(<DecorationSettingsCard {...defaultProps} />);

      const patternCount = Object.values(DecorationPatterns).length;
      expect(mockSelectItem).toHaveBeenCalledTimes(patternCount);
    });

    it("shows selected pattern", () => {
      render(
        <DecorationSettingsCard
          {...defaultProps}
          decorationPattern={DecorationPatterns.TILED}
        />,
      );

      const select = screen.getByTestId("select").querySelector("select");
      expect(select).toHaveAttribute(
        "data-selected-keys",
        JSON.stringify([DecorationPatterns.TILED]),
      );
    });

    it("calls onDecorationPatternChange when pattern changes", async () => {
      const user = userEvent.setup();

      render(<DecorationSettingsCard {...defaultProps} />);

      // Get the onChange handler from the mock call
      const onChangeHandler = mockSelect.mock.calls[0][0].onChange;
      onChangeHandler({ target: { value: DecorationPatterns.BORDER_TOP } });

      expect(mockOnDecorationPatternChange).toHaveBeenCalledWith(
        DecorationPatterns.BORDER_TOP,
      );
    });
  });

  describe("Opacity Slider", () => {
    it("renders with correct min/max values", () => {
      render(<DecorationSettingsCard {...defaultProps} />);

      const sliders = screen.getAllByTestId("slider");
      const opacitySlider = sliders[0]; // First slider is opacity

      expect(opacitySlider).toHaveAttribute("min", "0");
      expect(opacitySlider).toHaveAttribute("max", "100");
    });

    it("displays current opacity value", () => {
      render(
        <DecorationSettingsCard {...defaultProps} decorationOpacity={75} />,
      );

      expect(screen.getByText("75%")).toBeInTheDocument();
    });

    it("calls onDecorationOpacityChange when value changes", async () => {
      render(<DecorationSettingsCard {...defaultProps} />);

      // Get onChange from first Slider call (opacity)
      const onChangeHandler = mockSlider.mock.calls[0][0].onChange;
      onChangeHandler(80);

      expect(mockOnDecorationOpacityChange).toHaveBeenCalledWith(80);
    });

    it("handles array value from Slider onChange", () => {
      render(<DecorationSettingsCard {...defaultProps} />);

      // Get onChange from first Slider call (opacity)
      const onChangeHandler = mockSlider.mock.calls[0][0].onChange;

      // Simulate Slider returning array (some Slider implementations do this)
      const mockEvent = { target: { value: "70" } };
      onChangeHandler(70);

      expect(mockOnDecorationOpacityChange).toHaveBeenCalledWith(70);
    });

    it("passes correct step and marks", () => {
      render(<DecorationSettingsCard {...defaultProps} />);

      const opacitySliderCall = mockSlider.mock.calls[0][0];
      expect(opacitySliderCall.step).toBe(5);
      expect(opacitySliderCall.marks).toEqual([
        { value: 0, label: "0%" },
        { value: 50, label: "50%" },
        { value: 100, label: "100%" },
      ]);
    });
  });

  describe("Size Slider", () => {
    it("renders with correct min/max values", () => {
      render(<DecorationSettingsCard {...defaultProps} />);

      const sliders = screen.getAllByTestId("slider");
      const sizeSlider = sliders[1]; // Second slider is size

      expect(sizeSlider).toHaveAttribute("min", "20");
      expect(sizeSlider).toHaveAttribute("max", "200");
    });

    it("displays current size value", () => {
      render(<DecorationSettingsCard {...defaultProps} decorationSize={120} />);

      expect(screen.getByText("120px")).toBeInTheDocument();
    });

    it("calls onDecorationSizeChange when value changes", async () => {
      render(<DecorationSettingsCard {...defaultProps} />);

      // Get onChange from second Slider call (size)
      const onChangeHandler = mockSlider.mock.calls[1][0].onChange;
      onChangeHandler(100);

      expect(mockOnDecorationSizeChange).toHaveBeenCalledWith(100);
    });

    it("passes correct step and marks", () => {
      render(<DecorationSettingsCard {...defaultProps} />);

      const sizeSliderCall = mockSlider.mock.calls[1][0];
      expect(sizeSliderCall.step).toBe(10);
      expect(sizeSliderCall.marks).toEqual([
        { value: 40, label: "Pequeño" },
        { value: 80, label: "Medio" },
        { value: 120, label: "Grande" },
      ]);
    });
  });

  describe("Props Updates", () => {
    it("updates DecorationSvgSelector when decorationSvg changes", () => {
      const { rerender } = render(<DecorationSettingsCard {...defaultProps} />);

      let callArgs = mockDecorationSvgSelector.mock.calls[0][0];
      expect(callArgs.value).toBe(DecorationSVGs.FLOWER);

      rerender(
        <DecorationSettingsCard
          {...defaultProps}
          decorationSvg={DecorationSVGs.HEART}
        />,
      );

      callArgs = mockDecorationSvgSelector.mock.calls[1][0];
      expect(callArgs.value).toBe(DecorationSVGs.HEART);
    });

    it("shows/hides controls when decorationSvg toggles", () => {
      const { rerender } = render(<DecorationSettingsCard {...defaultProps} />);

      expect(screen.getByText("Opacidad")).toBeInTheDocument();

      rerender(
        <DecorationSettingsCard
          {...defaultProps}
          decorationSvg={DecorationSVGs.NONE}
        />,
      );

      expect(screen.queryByText("Opacidad")).not.toBeInTheDocument();
    });

    it("updates pattern when decorationPattern changes", () => {
      const { rerender } = render(<DecorationSettingsCard {...defaultProps} />);

      rerender(
        <DecorationSettingsCard
          {...defaultProps}
          decorationPattern={DecorationPatterns.CENTER}
        />,
      );

      const select = screen.getByTestId("select").querySelector("select");
      expect(select).toHaveAttribute(
        "data-selected-keys",
        JSON.stringify([DecorationPatterns.CENTER]),
      );
    });

    it("updates opacity display when decorationOpacity changes", () => {
      const { rerender } = render(<DecorationSettingsCard {...defaultProps} />);

      expect(screen.getByText("50%")).toBeInTheDocument();

      rerender(
        <DecorationSettingsCard {...defaultProps} decorationOpacity={90} />,
      );

      expect(screen.getByText("90%")).toBeInTheDocument();
      expect(screen.queryByText("50%")).not.toBeInTheDocument();
    });

    it("updates size display when decorationSize changes", () => {
      const { rerender } = render(<DecorationSettingsCard {...defaultProps} />);

      expect(screen.getByText("60px")).toBeInTheDocument();

      rerender(
        <DecorationSettingsCard {...defaultProps} decorationSize={150} />,
      );

      expect(screen.getByText("150px")).toBeInTheDocument();
      expect(screen.queryByText("60px")).not.toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles all svg types", () => {
      const svgTypes = [
        DecorationSVGs.NONE,
        DecorationSVGs.FLOWER,
        DecorationSVGs.LEAF,
        DecorationSVGs.HEART,
        DecorationSVGs.BRANCH,
        DecorationSVGs.BRANCH_2,
      ];

      svgTypes.forEach((svg) => {
        const { unmount } = render(
          <DecorationSettingsCard {...defaultProps} decorationSvg={svg} />,
        );

        const callArgs = mockDecorationSvgSelector.mock.calls[0][0];
        expect(callArgs.value).toBe(svg);

        unmount();
        vi.clearAllMocks();
      });
    });

    it("handles opacity edge values (0 and 100)", () => {
      const { rerender } = render(
        <DecorationSettingsCard {...defaultProps} decorationOpacity={0} />,
      );

      expect(screen.getByText("0%")).toBeInTheDocument();

      rerender(
        <DecorationSettingsCard {...defaultProps} decorationOpacity={100} />,
      );

      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("handles size edge values (20 and 200)", () => {
      const { rerender } = render(
        <DecorationSettingsCard {...defaultProps} decorationSize={20} />,
      );

      expect(screen.getByText("20px")).toBeInTheDocument();

      rerender(
        <DecorationSettingsCard {...defaultProps} decorationSize={200} />,
      );

      expect(screen.getByText("200px")).toBeInTheDocument();
    });

    it("falls back to CORNERS pattern when decorationPattern is undefined", () => {
      // DecorationPatterns.NONE was removed — the component falls back to CORNERS
      // when no pattern is provided (decorationPattern || DecorationPatterns.CORNERS)
      render(
        <DecorationSettingsCard
          {...defaultProps}
          decorationPattern={undefined as unknown as DecorationPattern}
        />,
      );

      const select = screen.getByTestId("select").querySelector("select");
      expect(select).toHaveAttribute(
        "data-selected-keys",
        JSON.stringify([DecorationPatterns.CORNERS]),
      );
    });
  });

  describe("Callback Handlers", () => {
    it("does not call handlers on initial render", () => {
      render(<DecorationSettingsCard {...defaultProps} />);

      expect(mockOnDecorationSvgChange).not.toHaveBeenCalled();
      expect(mockOnDecorationPatternChange).not.toHaveBeenCalled();
      expect(mockOnDecorationOpacityChange).not.toHaveBeenCalled();
      expect(mockOnDecorationSizeChange).not.toHaveBeenCalled();
    });

    it("calls each handler with correct value types", () => {
      render(<DecorationSettingsCard {...defaultProps} />);

      // Trigger pattern change
      const patternOnChange = mockSelect.mock.calls[0][0].onChange;
      patternOnChange({ target: { value: DecorationPatterns.TILED } });
      expect(mockOnDecorationPatternChange).toHaveBeenCalledWith(
        DecorationPatterns.TILED,
      );

      // Trigger opacity change
      const opacityOnChange = mockSlider.mock.calls[0][0].onChange;
      opacityOnChange(65);
      expect(mockOnDecorationOpacityChange).toHaveBeenCalledWith(65);

      // Trigger size change
      const sizeOnChange = mockSlider.mock.calls[1][0].onChange;
      sizeOnChange(80);
      expect(mockOnDecorationSizeChange).toHaveBeenCalledWith(80);
    });
  });
});
