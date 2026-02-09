// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import GuestCountSelector from "@/components/GuestCountSelector";

// Mock HeroUI components
const mockButton = vi.hoisted(() => vi.fn());
const mockInput = vi.hoisted(() => vi.fn());

vi.mock("@heroui/button", () => ({
  Button: mockButton,
}));

vi.mock("@heroui/input", () => ({
  Input: mockInput,
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Minus: () => <svg data-testid="minus-icon" />,
  Plus: () => <svg data-testid="plus-icon" />,
}));

describe("GuestCountSelector", () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Button to render as button with click handler
    mockButton.mockImplementation(
      ({ children, onPress, isDisabled, className, ...props }) => (
        <button
          onClick={onPress}
          disabled={isDisabled}
          className={className}
          {...props}
        >
          {children}
        </button>
      ),
    );

    // Mock Input to render as native input
    mockInput.mockImplementation(
      ({
        value,
        onChange,
        onBlur,
        disabled,
        className,
        min,
        max,
        ...props
      }) => (
        <input
          type="number"
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          className={className}
          min={min}
          max={max}
          {...props}
        />
      ),
    );
  });

  describe("Rendering", () => {
    it("renders with default props", () => {
      render(<GuestCountSelector value={5} onChange={mockOnChange} />);

      expect(screen.getByDisplayValue("5")).toBeInTheDocument();
    });

    it("renders minus and plus icons", () => {
      render(<GuestCountSelector value={5} onChange={mockOnChange} />);

      expect(screen.getByTestId("minus-icon")).toBeInTheDocument();
      expect(screen.getByTestId("plus-icon")).toBeInTheDocument();
    });

    it("renders with custom min and max", () => {
      render(
        <GuestCountSelector
          value={50}
          onChange={mockOnChange}
          min={10}
          max={100}
        />,
      );

      const input = screen.getByDisplayValue("50");
      expect(input).toHaveAttribute("min", "10");
      expect(input).toHaveAttribute("max", "100");
    });

    it("displays current value in input", () => {
      render(<GuestCountSelector value={7} onChange={mockOnChange} />);

      expect(screen.getByDisplayValue("7")).toBeInTheDocument();
    });
  });

  describe("Decrease button", () => {
    it("decreases value when clicked", async () => {
      const user = userEvent.setup();
      render(<GuestCountSelector value={5} onChange={mockOnChange} />);

      const buttons = screen.getAllByRole("button");
      const decreaseButton = buttons[0]; // First button is minus

      await user.click(decreaseButton);

      expect(mockOnChange).toHaveBeenCalledWith(4);
    });

    it("does not decrease below min value", async () => {
      const user = userEvent.setup();
      render(<GuestCountSelector value={1} onChange={mockOnChange} min={1} />);

      const buttons = screen.getAllByRole("button");
      const decreaseButton = buttons[0];

      await user.click(decreaseButton);

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("is disabled when value equals min", () => {
      render(<GuestCountSelector value={1} onChange={mockOnChange} min={1} />);

      const buttons = screen.getAllByRole("button");
      const decreaseButton = buttons[0];

      expect(decreaseButton).toBeDisabled();
    });

    it("is disabled when disabled prop is true", () => {
      render(<GuestCountSelector value={5} onChange={mockOnChange} disabled />);

      const buttons = screen.getAllByRole("button");
      const decreaseButton = buttons[0];

      expect(decreaseButton).toBeDisabled();
    });
  });

  describe("Increase button", () => {
    it("increases value when clicked", async () => {
      const user = userEvent.setup();
      render(<GuestCountSelector value={5} onChange={mockOnChange} />);

      const buttons = screen.getAllByRole("button");
      const increaseButton = buttons[1]; // Second button is plus

      await user.click(increaseButton);

      expect(mockOnChange).toHaveBeenCalledWith(6);
    });

    it("does not increase above max value", async () => {
      const user = userEvent.setup();
      render(
        <GuestCountSelector value={10} onChange={mockOnChange} max={10} />,
      );

      const buttons = screen.getAllByRole("button");
      const increaseButton = buttons[1];

      await user.click(increaseButton);

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("is disabled when value equals max", () => {
      render(
        <GuestCountSelector value={10} onChange={mockOnChange} max={10} />,
      );

      const buttons = screen.getAllByRole("button");
      const increaseButton = buttons[1];

      expect(increaseButton).toBeDisabled();
    });

    it("is disabled when disabled prop is true", () => {
      render(<GuestCountSelector value={5} onChange={mockOnChange} disabled />);

      const buttons = screen.getAllByRole("button");
      const increaseButton = buttons[1];

      expect(increaseButton).toBeDisabled();
    });
  });

  describe("Input field interaction", () => {
    it("allows direct input of valid number", async () => {
      const user = userEvent.setup();
      render(<GuestCountSelector value={5} onChange={mockOnChange} />);

      const input = screen.getByDisplayValue("5");
      await user.clear(input);
      await user.type(input, "7");

      expect(mockOnChange).toHaveBeenCalledWith(7);
    });

    it("clamps value to max on input", async () => {
      const user = userEvent.setup();
      render(<GuestCountSelector value={5} onChange={mockOnChange} max={10} />);

      const input = screen.getByDisplayValue("5");
      await user.clear(input);
      await user.type(input, "15");

      expect(mockOnChange).toHaveBeenCalledWith(10);
    });

    it("clamps value to min on input", async () => {
      const user = userEvent.setup();
      render(<GuestCountSelector value={5} onChange={mockOnChange} min={1} />);

      const input = screen.getByDisplayValue("5");
      await user.clear(input);
      await user.type(input, "0");

      // 0 is parsed, but clamped to min (1)
      expect(mockOnChange).toHaveBeenCalledWith(1);
    });

    it("handles empty input on blur", async () => {
      const user = userEvent.setup();
      render(<GuestCountSelector value={5} onChange={mockOnChange} min={1} />);

      const input = screen.getByDisplayValue("5");
      await user.clear(input);
      await user.tab(); // Blur

      expect(mockOnChange).toHaveBeenCalledWith(1);
    });

    it("handles invalid input on blur", async () => {
      const user = userEvent.setup();
      render(<GuestCountSelector value={5} onChange={mockOnChange} min={1} />);

      const input = screen.getByDisplayValue("5");
      await user.clear(input);
      await user.type(input, "abc");
      await user.tab(); // Blur

      expect(mockOnChange).toHaveBeenCalledWith(1);
    });

    it("corrects out-of-range value on blur", async () => {
      const user = userEvent.setup();
      render(
        <GuestCountSelector
          value={5}
          onChange={mockOnChange}
          min={1}
          max={10}
        />,
      );

      const input = screen.getByDisplayValue("5");
      await user.clear(input);
      await user.type(input, "99");
      await user.tab(); // Blur

      expect(mockOnChange).toHaveBeenCalledWith(10);
      expect(input).toHaveValue(10); // type="number" returns number, not string
    });

    it("is disabled when disabled prop is true", () => {
      render(<GuestCountSelector value={5} onChange={mockOnChange} disabled />);

      const input = screen.getByDisplayValue("5");
      expect(input).toBeDisabled();
    });
  });

  describe("Value synchronization", () => {
    it("updates input when value prop changes", () => {
      const { rerender } = render(
        <GuestCountSelector value={5} onChange={mockOnChange} />,
      );

      expect(screen.getByDisplayValue("5")).toBeInTheDocument();

      rerender(<GuestCountSelector value={8} onChange={mockOnChange} />);

      expect(screen.getByDisplayValue("8")).toBeInTheDocument();
    });

    it("syncs internal state with external value changes", () => {
      const { rerender } = render(
        <GuestCountSelector value={3} onChange={mockOnChange} />,
      );

      const input = screen.getByDisplayValue("3");
      expect(input).toHaveValue(3); // type="number" returns number

      rerender(<GuestCountSelector value={7} onChange={mockOnChange} />);

      expect(input).toHaveValue(7); // type="number" returns number
    });
  });

  describe("Edge cases", () => {
    it("handles rapid button clicks", async () => {
      const user = userEvent.setup();
      render(<GuestCountSelector value={5} onChange={mockOnChange} max={10} />);

      const buttons = screen.getAllByRole("button");
      const increaseButton = buttons[1];

      // Click 3 times rapidly - but component uses props.value, not internal state
      // So all 3 clicks see value=5 and increment to 6
      await user.click(increaseButton);
      await user.click(increaseButton);
      await user.click(increaseButton);

      // All 3 calls will be with 6 because value prop didn't change between clicks
      expect(mockOnChange).toHaveBeenCalledTimes(3);
      expect(mockOnChange).toHaveBeenNthCalledWith(1, 6);
      expect(mockOnChange).toHaveBeenNthCalledWith(2, 6);
      expect(mockOnChange).toHaveBeenNthCalledWith(3, 6);
    });

    it("handles negative numbers (clamped to min)", async () => {
      const user = userEvent.setup();
      render(<GuestCountSelector value={5} onChange={mockOnChange} min={1} />);

      const input = screen.getByDisplayValue("5");
      await user.clear(input);
      await user.type(input, "-5");

      expect(mockOnChange).toHaveBeenCalledWith(1);
    });

    it("handles decimal numbers (parsed as integer)", async () => {
      const user = userEvent.setup();
      render(<GuestCountSelector value={5} onChange={mockOnChange} />);

      const input = screen.getByDisplayValue("5");
      await user.clear(input);
      await user.type(input, "7.5");

      // parseInt("7.5") = 7
      expect(mockOnChange).toHaveBeenCalledWith(7);
    });

    it("handles very large numbers (clamped to max)", async () => {
      const user = userEvent.setup();
      render(<GuestCountSelector value={5} onChange={mockOnChange} max={10} />);

      const input = screen.getByDisplayValue("5");
      await user.clear(input);
      await user.type(input, "999999");

      expect(mockOnChange).toHaveBeenCalledWith(10);
    });

    it("handles min and max being equal", async () => {
      const user = userEvent.setup();
      render(
        <GuestCountSelector
          value={5}
          onChange={mockOnChange}
          min={5}
          max={5}
        />,
      );

      const buttons = screen.getAllByRole("button");
      const decreaseButton = buttons[0];
      const increaseButton = buttons[1];

      // Both buttons should be disabled
      expect(decreaseButton).toBeDisabled();
      expect(increaseButton).toBeDisabled();

      // Typing should clamp to 5
      const input = screen.getByDisplayValue("5");
      await user.clear(input);
      await user.type(input, "10");

      // onChange is called on each keystroke with clamped value
      // When typing "10": first "1" is clamped to 5, then "10" is clamped to 5
      // But since value doesn't change from 5, the condition on line 53 prevents redundant calls
      // So it should NOT have been called (value is already 5)
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe("Props combinations", () => {
    it("works with custom min, max, and disabled", () => {
      render(
        <GuestCountSelector
          value={15}
          onChange={mockOnChange}
          min={10}
          max={20}
          disabled
        />,
      );

      const input = screen.getByDisplayValue("15");
      const buttons = screen.getAllByRole("button");

      expect(input).toBeDisabled();
      expect(buttons[0]).toBeDisabled();
      expect(buttons[1]).toBeDisabled();
    });

    it("works with minimal props (value and onChange only)", async () => {
      const user = userEvent.setup();
      render(<GuestCountSelector value={5} onChange={mockOnChange} />);

      const buttons = screen.getAllByRole("button");
      await user.click(buttons[1]); // Increase

      expect(mockOnChange).toHaveBeenCalledWith(6);
    });
  });
});
