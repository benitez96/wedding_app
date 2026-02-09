// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PasswordInput from "@/components/ui/PasswordInput";

// Mock HeroUI Input component
const mockInput = vi.hoisted(() => vi.fn());
vi.mock("@heroui/input", () => ({
  Input: mockInput,
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Eye: () => <svg data-testid="eye-icon" />,
  EyeOff: () => <svg data-testid="eye-off-icon" />,
  Lock: () => <svg data-testid="lock-icon" />,
}));

describe("PasswordInput", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Input to render actual HTML input with endContent button
    mockInput.mockImplementation(
      ({
        type,
        name,
        label,
        placeholder,
        description,
        startContent,
        endContent,
        isRequired,
        isDisabled,
        autoComplete,
        fullWidth,
        ...props
      }) => {
        const inputId = `input-${name}`;
        return (
          <div data-testid="input-container">
            {label && <label htmlFor={inputId}>{label}</label>}
            {startContent}
            <input
              id={inputId}
              type={type}
              name={name}
              placeholder={placeholder}
              aria-describedby={description ? "desc" : undefined}
              required={isRequired}
              disabled={isDisabled}
              autoComplete={autoComplete}
              data-fullwidth={fullWidth}
              {...props}
            />
            {description && <span id="desc">{description}</span>}
            {endContent}
          </div>
        );
      },
    );
  });

  describe("Rendering", () => {
    it("renders with default props", () => {
      render(<PasswordInput />);

      expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    });

    it("renders with custom label", () => {
      render(<PasswordInput label="Nueva Contraseña" />);

      expect(screen.getByLabelText("Nueva Contraseña")).toBeInTheDocument();
    });

    it("renders with custom placeholder", () => {
      render(<PasswordInput placeholder="Ingrese contraseña" />);

      const input = screen.getByPlaceholderText("Ingrese contraseña");
      expect(input).toBeInTheDocument();
    });

    it("renders with description", () => {
      render(<PasswordInput description="Mínimo 8 caracteres" />);

      expect(screen.getByText("Mínimo 8 caracteres")).toBeInTheDocument();
    });

    it("renders Lock icon in startContent", () => {
      render(<PasswordInput />);

      expect(screen.getByTestId("lock-icon")).toBeInTheDocument();
    });
  });

  describe("Password visibility toggle", () => {
    it("starts with password hidden (type=password)", () => {
      render(<PasswordInput />);

      const input = screen.getByLabelText("Contraseña");
      expect(input).toHaveAttribute("type", "password");
    });

    it("shows Eye icon when password is hidden", () => {
      render(<PasswordInput />);

      expect(screen.getByTestId("eye-icon")).toBeInTheDocument();
      expect(screen.queryByTestId("eye-off-icon")).not.toBeInTheDocument();
    });

    it("toggles to text type when toggle button clicked", async () => {
      const user = userEvent.setup();
      render(<PasswordInput />);

      const toggleButton = screen.getByLabelText("Mostrar contraseña");
      await user.click(toggleButton);

      const input = screen.getByLabelText("Contraseña");
      expect(input).toHaveAttribute("type", "text");
    });

    it("shows EyeOff icon when password is visible", async () => {
      const user = userEvent.setup();
      render(<PasswordInput />);

      const toggleButton = screen.getByLabelText("Mostrar contraseña");
      await user.click(toggleButton);

      expect(screen.getByTestId("eye-off-icon")).toBeInTheDocument();
      expect(screen.queryByTestId("eye-icon")).not.toBeInTheDocument();
    });

    it("toggles back to password type on second click", async () => {
      const user = userEvent.setup();
      render(<PasswordInput />);

      const showButton = screen.getByLabelText("Mostrar contraseña");
      await user.click(showButton);

      const hideButton = screen.getByLabelText("Ocultar contraseña");
      await user.click(hideButton);

      const input = screen.getByLabelText("Contraseña");
      expect(input).toHaveAttribute("type", "password");
    });

    it("updates aria-label based on visibility state", async () => {
      const user = userEvent.setup();
      render(<PasswordInput />);

      const showButton = screen.getByLabelText("Mostrar contraseña");
      expect(showButton).toHaveAttribute("aria-label", "Mostrar contraseña");

      await user.click(showButton);

      const hideButton = screen.getByLabelText("Ocultar contraseña");
      expect(hideButton).toHaveAttribute("aria-label", "Ocultar contraseña");
    });
  });

  describe("Toggle button behavior", () => {
    it("toggle button has type=button (prevents form submission)", () => {
      render(<PasswordInput />);

      const toggleButton = screen.getByLabelText("Mostrar contraseña");
      expect(toggleButton).toHaveAttribute("type", "button");
    });

    it("has focus:outline-none class on toggle button", () => {
      render(<PasswordInput />);

      const toggleButton = screen.getByLabelText("Mostrar contraseña");
      expect(toggleButton).toHaveClass("focus:outline-none");
    });
  });

  describe("Input attributes", () => {
    it("applies default name attribute", () => {
      render(<PasswordInput />);

      const input = screen.getByLabelText("Contraseña");
      expect(input).toHaveAttribute("name", "password");
    });

    it("applies custom name attribute", () => {
      render(<PasswordInput name="new-password" />);

      const input = screen.getByLabelText("Contraseña");
      expect(input).toHaveAttribute("name", "new-password");
    });

    it("applies default autoComplete", () => {
      render(<PasswordInput />);

      const input = screen.getByLabelText("Contraseña");
      expect(input).toHaveAttribute("autoComplete", "current-password");
    });

    it("applies custom autoComplete", () => {
      render(<PasswordInput autoComplete="new-password" />);

      const input = screen.getByLabelText("Contraseña");
      expect(input).toHaveAttribute("autoComplete", "new-password");
    });

    it("applies isRequired prop", () => {
      render(<PasswordInput isRequired />);

      const input = screen.getByLabelText("Contraseña");
      expect(input).toBeRequired();
    });

    it("applies isDisabled prop", () => {
      render(<PasswordInput isDisabled />);

      const input = screen.getByLabelText("Contraseña");
      expect(input).toBeDisabled();
    });

    it("applies fullWidth to Input component", () => {
      render(<PasswordInput />);

      const input = screen.getByLabelText("Contraseña");
      expect(input).toHaveAttribute("data-fullwidth", "true");
    });
  });

  describe("Props forwarding", () => {
    it("forwards additional InputProps to Input component", () => {
      render(<PasswordInput data-testid="custom-input" />);

      const input = screen.getByTestId("custom-input");
      expect(input).toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("renders without label", () => {
      render(<PasswordInput label="" />);

      const input = screen.getByPlaceholderText("••••••••");
      expect(input).toBeInTheDocument();
    });

    it("handles multiple toggles in succession", async () => {
      const user = userEvent.setup();
      render(<PasswordInput />);

      const input = screen.getByLabelText("Contraseña");

      // Toggle 5 times
      for (let i = 0; i < 5; i++) {
        const button = screen.getByRole("button");
        await user.click(button);
      }

      // Should end up visible (started hidden, 5 toggles = odd)
      expect(input).toHaveAttribute("type", "text");
    });
  });
});
