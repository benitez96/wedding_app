// @vitest-environment jsdom

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ThemeColorEditor, {
  ColorSlot,
  COLOR_SLOTS,
} from "@/app/backoffice/(protected)/theming/ThemeColorEditor";
import type { CustomThemeColors } from "@/types/theme";

// ============================================================================
// COLOR_SLOTS tests
// ============================================================================

describe("COLOR_SLOTS", () => {
  it("has all 5 color keys", () => {
    const keys = COLOR_SLOTS.map((s) => s.key);
    expect(keys).toEqual([
      "background",
      "foreground",
      "primary",
      "secondary",
      "accent",
    ]);
  });

  it("each slot has label and description", () => {
    COLOR_SLOTS.forEach((slot) => {
      expect(slot.label).toBeTruthy();
      expect(slot.description).toBeTruthy();
    });
  });

  it("has user-friendly labels", () => {
    const labels = COLOR_SLOTS.map((s) => s.label);
    expect(labels).toEqual([
      "Fondo",
      "Texto",
      "Botones",
      "Secciones",
      "Detalles",
    ]);
  });
});

// ============================================================================
// ColorSlot tests
// ============================================================================

describe("ColorSlot", () => {
  const defaultProps = {
    colorKey: "primary" as const,
    label: "Botones",
    description: "Botones y links principales",
    value: "#6366f1",
    isEditable: true,
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders color swatch with correct background", () => {
    const { container } = render(<ColorSlot {...defaultProps} />);
    const button = container.querySelector("button");
    expect(button).toHaveStyle({ backgroundColor: "#6366f1" });
  });

  it("renders label", () => {
    render(<ColorSlot {...defaultProps} />);
    expect(screen.getByText("Botones")).toBeInTheDocument();
  });

  it("shows edit icon when editable", () => {
    render(<ColorSlot {...defaultProps} isEditable />);
    // Pencil icon renders as SVG
    const svg = document.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("does not show edit icon when not editable", () => {
    render(<ColorSlot {...defaultProps} isEditable={false} />);
    const svg = document.querySelector("svg");
    expect(svg).not.toBeInTheDocument();
  });

  it("opens color picker on click when editable", async () => {
    render(<ColorSlot {...defaultProps} />);
    const button = screen.getByRole("button", { name: /editar botones/i });

    fireEvent.click(button);

    await waitFor(() => {
      // react-colorful renders a picker with this class
      expect(document.querySelector(".react-colorful")).toBeInTheDocument();
    });
  });

  it("does not open picker when not editable", () => {
    render(<ColorSlot {...defaultProps} isEditable={false} />);
    const button = screen.getByRole("button", { name: /botones/i });

    fireEvent.click(button);

    expect(document.querySelector(".react-colorful")).not.toBeInTheDocument();
  });

  it("closes picker on outside click", async () => {
    render(
      <div>
        <ColorSlot {...defaultProps} />
        <div data-testid="outside">Outside</div>
      </div>,
    );

    // Open picker
    fireEvent.click(screen.getByRole("button", { name: /editar botones/i }));
    await waitFor(() => {
      expect(document.querySelector(".react-colorful")).toBeInTheDocument();
    });

    // Click outside
    fireEvent.mouseDown(screen.getByTestId("outside"));

    await waitFor(() => {
      expect(document.querySelector(".react-colorful")).not.toBeInTheDocument();
    });
  });

  it("calls onChange with valid hex input", async () => {
    const onChange = vi.fn();
    render(<ColorSlot {...defaultProps} onChange={onChange} />);

    // Open picker
    fireEvent.click(screen.getByRole("button", { name: /editar botones/i }));

    await waitFor(() => {
      expect(document.querySelector(".react-colorful")).toBeInTheDocument();
    });

    // Find hex input and change it
    const hexInput = screen.getByRole("textbox", { name: /valor hex/i });
    fireEvent.change(hexInput, { target: { value: "#ff0000" } });

    expect(onChange).toHaveBeenCalledWith("primary", "#ff0000");
  });

  it("ignores invalid hex input", async () => {
    const onChange = vi.fn();
    render(<ColorSlot {...defaultProps} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: /editar botones/i }));

    await waitFor(() => {
      expect(document.querySelector(".react-colorful")).toBeInTheDocument();
    });

    const hexInput = screen.getByRole("textbox", { name: /valor hex/i });
    fireEvent.change(hexInput, { target: { value: "not-a-hex" } });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("reverts to prop value on blur with incomplete hex", async () => {
    // This test verifies that when the user types an incomplete hex and blurs,
    // the component calls onChange with the current prop value to "reset" it.
    // Note: Since this is a controlled component, the parent would need to
    // NOT update state for invalid values to make revert work properly.
    const onChange = vi.fn();
    // Simulate a scenario where parent hasn't updated state (value stays #aabbcc)
    // even though user typed #aab
    render(<ColorSlot {...defaultProps} onChange={onChange} value="#aabbcc" />);

    fireEvent.click(screen.getByRole("button", { name: /editar botones/i }));

    await waitFor(() => {
      expect(document.querySelector(".react-colorful")).toBeInTheDocument();
    });

    const hexInput = screen.getByRole("textbox", { name: /valor hex/i });

    // Simulate blur with incomplete hex value in the input
    // The component checks e.target.value against the regex
    Object.defineProperty(hexInput, "value", { value: "#aab", writable: true });
    fireEvent.blur(hexInput);

    // Component should call onChange with the prop value to revert
    expect(onChange).toHaveBeenLastCalledWith("primary", "#aabbcc");
  });
});

// ============================================================================
// ThemeColorEditor integration tests
// ============================================================================

describe("ThemeColorEditor", () => {
  const colors: CustomThemeColors = {
    background: "#ffffff",
    foreground: "#111111",
    primary: "#6366f1",
    secondary: "#a5b4fc",
    accent: "#818cf8",
  };

  const defaultProps = {
    colors,
    onChange: vi.fn(),
    isEditable: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all 5 color slots with user-friendly labels", () => {
    render(<ThemeColorEditor {...defaultProps} />);

    expect(screen.getByText("Fondo")).toBeInTheDocument();
    expect(screen.getByText("Texto")).toBeInTheDocument();
    expect(screen.getByText("Botones")).toBeInTheDocument();
    expect(screen.getByText("Secciones")).toBeInTheDocument();
    expect(screen.getByText("Detalles")).toBeInTheDocument();
  });

  it("shows correct title when not editable", () => {
    render(<ThemeColorEditor {...defaultProps} isEditable={false} />);
    expect(screen.getByText("Colores del tema")).toBeInTheDocument();
  });

  it("shows correct title when editable", () => {
    render(<ThemeColorEditor {...defaultProps} isEditable />);
    expect(screen.getByText("Personalizá los colores")).toBeInTheDocument();
  });

  it("shows edit hint when editable", () => {
    render(<ThemeColorEditor {...defaultProps} isEditable />);
    expect(
      screen.getByText("Tocá cualquier color para editarlo"),
    ).toBeInTheDocument();
  });

  it("shows selection hint when not editable", () => {
    render(<ThemeColorEditor {...defaultProps} isEditable={false} />);
    expect(
      screen.getByText(/seleccioná.*personalizado.*para editar/i),
    ).toBeInTheDocument();
  });

  it("calls onChange with updated colors when color changes", async () => {
    const onChange = vi.fn();
    render(
      <ThemeColorEditor {...defaultProps} onChange={onChange} isEditable />,
    );

    // Open primary color picker (now labeled "Botones")
    const primaryButton = screen.getByRole("button", {
      name: /editar botones/i,
    });
    fireEvent.click(primaryButton);

    await waitFor(() => {
      expect(document.querySelector(".react-colorful")).toBeInTheDocument();
    });

    // Change hex value
    const hexInput = screen.getByRole("textbox", { name: /valor hex/i });
    fireEvent.change(hexInput, { target: { value: "#ff0000" } });

    expect(onChange).toHaveBeenCalledWith({
      ...colors,
      primary: "#ff0000",
    });
  });

  it("displays labels for each color slot", () => {
    render(<ThemeColorEditor {...defaultProps} />);

    // Check that user-friendly labels are displayed
    expect(screen.getByText("Fondo")).toBeInTheDocument();
    expect(screen.getByText("Texto")).toBeInTheDocument();
    expect(screen.getByText("Botones")).toBeInTheDocument();
  });

  it("all color buttons have correct background colors", () => {
    const { container } = render(<ThemeColorEditor {...defaultProps} />);
    const buttons = container.querySelectorAll("button");

    // Each button should have the corresponding color as background
    const backgrounds = Array.from(buttons).map(
      (btn) => (btn as HTMLElement).style.backgroundColor,
    );

    // Convert hex to rgb for comparison (browsers normalize to rgb)
    expect(backgrounds).toContain("rgb(255, 255, 255)"); // #ffffff
    expect(backgrounds).toContain("rgb(17, 17, 17)"); // #111111
  });
});
