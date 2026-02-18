// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SignUpForm } from "@/components/auth/SignUpForm";

// Mock Next.js router
const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

// Mock Next.js Link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

// Mock auth-client
const mockSignUpEmail = vi.hoisted(() => vi.fn());
const mockSignInSocial = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signUp: {
      email: mockSignUpEmail,
    },
    signIn: {
      social: mockSignInSocial,
    },
  },
}));

// Mock HeroUI components
const mockButton = vi.hoisted(() => vi.fn());
const mockInput = vi.hoisted(() => vi.fn());
const mockCard = vi.hoisted(() => vi.fn());
const mockCardHeader = vi.hoisted(() => vi.fn());
const mockCardBody = vi.hoisted(() => vi.fn());

vi.mock("@heroui/button", () => ({
  Button: mockButton,
}));

vi.mock("@heroui/input", () => ({
  Input: mockInput,
}));

vi.mock("@heroui/card", () => ({
  Card: mockCard,
  CardHeader: mockCardHeader,
  CardBody: mockCardBody,
}));

// Mock PasswordInput
vi.mock("@/components/ui/PasswordInput", () => ({
  default: ({
    name,
    label,
    description,
    isRequired,
    isDisabled,
    autoComplete,
  }: {
    name: string;
    label: string;
    description?: string;
    isRequired?: boolean;
    isDisabled?: boolean;
    autoComplete?: string;
  }) => (
    <div data-testid={`password-input-${name}`}>
      <label htmlFor={name}>{label}</label>
      {description && <p>{description}</p>}
      <input
        type="password"
        name={name}
        id={name}
        required={isRequired}
        disabled={isDisabled}
        autoComplete={autoComplete}
      />
    </div>
  ),
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Mail: () => <svg data-testid="mail-icon" />,
  User: () => <svg data-testid="user-icon" />,
}));

describe("SignUpForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Button
    mockButton.mockImplementation(
      ({
        children,
        onPress,
        type,
        isDisabled,
        isLoading,
        color,
        variant,
        className,
      }) => (
        <button
          type={type}
          onClick={onPress}
          disabled={isDisabled}
          data-loading={isLoading}
          data-color={color}
          data-variant={variant}
          className={className}
        >
          {children}
        </button>
      ),
    );

    // Mock Input
    mockInput.mockImplementation(
      ({
        type,
        name,
        label,
        placeholder,
        isRequired,
        isDisabled,
        autoComplete,
        fullWidth,
        startContent,
      }) => (
        <div data-testid="input-container">
          {startContent}
          <label htmlFor={name}>{label}</label>
          <input
            type={type}
            name={name}
            id={name}
            placeholder={placeholder}
            required={isRequired}
            disabled={isDisabled}
            autoComplete={autoComplete}
            data-fullwidth={fullWidth}
          />
        </div>
      ),
    );

    // Mock Card
    mockCard.mockImplementation(({ children, className }) => (
      <div data-testid="card" className={className}>
        {children}
      </div>
    ));

    // Mock CardHeader
    mockCardHeader.mockImplementation(({ children, className }) => (
      <div data-testid="card-header" className={className}>
        {children}
      </div>
    ));

    // Mock CardBody
    mockCardBody.mockImplementation(({ children }) => (
      <div data-testid="card-body">{children}</div>
    ));
  });

  describe("Rendering", () => {
    it("renders signup form with all fields", () => {
      render(<SignUpForm />);

      expect(screen.getByText("Crear tu cuenta")).toBeInTheDocument();
      expect(
        screen.getByText("Empezá a gestionar tus eventos en minutos"),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Nombre completo")).toBeInTheDocument();
      expect(screen.getByLabelText("Correo electrónico")).toBeInTheDocument();
      expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
      expect(screen.getByLabelText("Confirmar contraseña")).toBeInTheDocument();
    });

    it("renders password requirements description", () => {
      render(<SignUpForm />);

      expect(
        screen.getByText(
          /Mínimo 10 caracteres, con mayúsculas, minúsculas, números y especiales/,
        ),
      ).toBeInTheDocument();
    });

    it("renders submit button", () => {
      render(<SignUpForm />);

      const submitButton = screen.getByRole("button", {
        name: "Crear Cuenta",
      });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveAttribute("type", "submit");
    });

    it("renders Google sign up button", () => {
      render(<SignUpForm />);

      expect(
        screen.getByRole("button", { name: /Continuar con Google/ }),
      ).toBeInTheDocument();
    });

    it("renders login link by default", () => {
      render(<SignUpForm />);

      expect(screen.getByText("¿Ya tenés cuenta?")).toBeInTheDocument();
      expect(screen.getByText("Iniciá sesión")).toBeInTheDocument();
    });

    it("hides login link when showLoginLink is false", () => {
      render(<SignUpForm showLoginLink={false} />);

      expect(screen.queryByText("¿Ya tenés cuenta?")).not.toBeInTheDocument();
      expect(screen.queryByText("Iniciá sesión")).not.toBeInTheDocument();
    });

    it("renders Mail and User icons", () => {
      render(<SignUpForm />);

      expect(screen.getByTestId("mail-icon")).toBeInTheDocument();
      expect(screen.getByTestId("user-icon")).toBeInTheDocument();
    });
  });

  describe("Form submission - Valid data", () => {
    it("submits form with valid credentials", async () => {
      const user = userEvent.setup();

      mockSignUpEmail.mockResolvedValue({ success: true });

      render(<SignUpForm />);

      await user.type(screen.getByLabelText("Nombre completo"), "Juan Pérez");
      await user.type(
        screen.getByLabelText("Correo electrónico"),
        "juan@example.com",
      );
      await user.type(screen.getByLabelText("Contraseña"), "Password123!");
      await user.type(
        screen.getByLabelText("Confirmar contraseña"),
        "Password123!",
      );

      const submitButton = screen.getByRole("button", { name: "Crear Cuenta" });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignUpEmail).toHaveBeenCalledWith({
          name: "Juan Pérez",
          email: "juan@example.com",
          password: "Password123!",
        });
      });
    });

    it("redirects to /backoffice on successful signup", async () => {
      const user = userEvent.setup();

      mockSignUpEmail.mockResolvedValue({ success: true });

      render(<SignUpForm />);

      await user.type(screen.getByLabelText("Nombre completo"), "Juan Pérez");
      await user.type(
        screen.getByLabelText("Correo electrónico"),
        "juan@example.com",
      );
      await user.type(screen.getByLabelText("Contraseña"), "Password123!");
      await user.type(
        screen.getByLabelText("Confirmar contraseña"),
        "Password123!",
      );

      const submitButton = screen.getByRole("button", { name: "Crear Cuenta" });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/backoffice");
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it("redirects to custom URL when redirectTo is provided", async () => {
      const user = userEvent.setup();

      mockSignUpEmail.mockResolvedValue({ success: true });

      render(<SignUpForm redirectTo="/welcome" />);

      await user.type(screen.getByLabelText("Nombre completo"), "Juan Pérez");
      await user.type(
        screen.getByLabelText("Correo electrónico"),
        "juan@example.com",
      );
      await user.type(screen.getByLabelText("Contraseña"), "Password123!");
      await user.type(
        screen.getByLabelText("Confirmar contraseña"),
        "Password123!",
      );

      const submitButton = screen.getByRole("button", { name: "Crear Cuenta" });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/welcome");
      });
    });
  });

  describe("Password validation - Mismatch", () => {
    it("shows error when passwords don't match", async () => {
      const user = userEvent.setup();

      render(<SignUpForm />);

      await user.type(screen.getByLabelText("Nombre completo"), "Juan Pérez");
      await user.type(
        screen.getByLabelText("Correo electrónico"),
        "juan@example.com",
      );
      await user.type(screen.getByLabelText("Contraseña"), "Password123!");
      await user.type(
        screen.getByLabelText("Confirmar contraseña"),
        "DifferentPass123!",
      );

      const submitButton = screen.getByRole("button", { name: "Crear Cuenta" });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Las contraseñas no coinciden"),
        ).toBeInTheDocument();
      });

      // Should not call authClient
      expect(mockSignUpEmail).not.toHaveBeenCalled();
    });
  });

  describe("Password validation - Length", () => {
    it("shows error when password is less than 10 characters", async () => {
      const user = userEvent.setup();

      render(<SignUpForm />);

      await user.type(screen.getByLabelText("Nombre completo"), "Juan Pérez");
      await user.type(
        screen.getByLabelText("Correo electrónico"),
        "juan@example.com",
      );
      await user.type(screen.getByLabelText("Contraseña"), "Pass123!");
      await user.type(
        screen.getByLabelText("Confirmar contraseña"),
        "Pass123!",
      );

      const submitButton = screen.getByRole("button", { name: "Crear Cuenta" });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("La contraseña debe tener al menos 10 caracteres"),
        ).toBeInTheDocument();
      });

      expect(mockSignUpEmail).not.toHaveBeenCalled();
    });

    it("accepts password with exactly 10 characters if complex", async () => {
      const user = userEvent.setup();

      mockSignUpEmail.mockResolvedValue({ success: true });

      render(<SignUpForm />);

      await user.type(screen.getByLabelText("Nombre completo"), "Juan Pérez");
      await user.type(
        screen.getByLabelText("Correo electrónico"),
        "juan@example.com",
      );
      await user.type(screen.getByLabelText("Contraseña"), "Password1!");
      await user.type(
        screen.getByLabelText("Confirmar contraseña"),
        "Password1!",
      );

      const submitButton = screen.getByRole("button", { name: "Crear Cuenta" });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignUpEmail).toHaveBeenCalled();
      });
    });
  });

  describe("Password validation - Complexity", () => {
    it("shows error when password missing uppercase", async () => {
      const user = userEvent.setup();

      render(<SignUpForm />);

      await user.type(screen.getByLabelText("Nombre completo"), "Juan Pérez");
      await user.type(
        screen.getByLabelText("Correo electrónico"),
        "juan@example.com",
      );
      await user.type(screen.getByLabelText("Contraseña"), "password123!");
      await user.type(
        screen.getByLabelText("Confirmar contraseña"),
        "password123!",
      );

      const submitButton = screen.getByRole("button", { name: "Crear Cuenta" });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(
            /La contraseña debe incluir mayúsculas, minúsculas, números y caracteres especiales/,
          ),
        ).toBeInTheDocument();
      });

      expect(mockSignUpEmail).not.toHaveBeenCalled();
    });

    it("shows error when password missing lowercase", async () => {
      const user = userEvent.setup();

      render(<SignUpForm />);

      await user.type(screen.getByLabelText("Nombre completo"), "Juan Pérez");
      await user.type(
        screen.getByLabelText("Correo electrónico"),
        "juan@example.com",
      );
      await user.type(screen.getByLabelText("Contraseña"), "PASSWORD123!");
      await user.type(
        screen.getByLabelText("Confirmar contraseña"),
        "PASSWORD123!",
      );

      const submitButton = screen.getByRole("button", { name: "Crear Cuenta" });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(
            /La contraseña debe incluir mayúsculas, minúsculas, números y caracteres especiales/,
          ),
        ).toBeInTheDocument();
      });

      expect(mockSignUpEmail).not.toHaveBeenCalled();
    });

    it("shows error when password missing numbers", async () => {
      const user = userEvent.setup();

      render(<SignUpForm />);

      await user.type(screen.getByLabelText("Nombre completo"), "Juan Pérez");
      await user.type(
        screen.getByLabelText("Correo electrónico"),
        "juan@example.com",
      );
      await user.type(screen.getByLabelText("Contraseña"), "Password!!!");
      await user.type(
        screen.getByLabelText("Confirmar contraseña"),
        "Password!!!",
      );

      const submitButton = screen.getByRole("button", { name: "Crear Cuenta" });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(
            /La contraseña debe incluir mayúsculas, minúsculas, números y caracteres especiales/,
          ),
        ).toBeInTheDocument();
      });

      expect(mockSignUpEmail).not.toHaveBeenCalled();
    });

    it("shows error when password missing special characters", async () => {
      const user = userEvent.setup();

      render(<SignUpForm />);

      await user.type(screen.getByLabelText("Nombre completo"), "Juan Pérez");
      await user.type(
        screen.getByLabelText("Correo electrónico"),
        "juan@example.com",
      );
      await user.type(screen.getByLabelText("Contraseña"), "Password123");
      await user.type(
        screen.getByLabelText("Confirmar contraseña"),
        "Password123",
      );

      const submitButton = screen.getByRole("button", { name: "Crear Cuenta" });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(
            /La contraseña debe incluir mayúsculas, minúsculas, números y caracteres especiales/,
          ),
        ).toBeInTheDocument();
      });

      expect(mockSignUpEmail).not.toHaveBeenCalled();
    });
  });

  describe("Server errors", () => {
    it("shows error message on signup failure", async () => {
      const user = userEvent.setup();

      mockSignUpEmail.mockResolvedValue({
        error: { message: "Email already exists" },
      });

      render(<SignUpForm />);

      await user.type(screen.getByLabelText("Nombre completo"), "Juan Pérez");
      await user.type(
        screen.getByLabelText("Correo electrónico"),
        "existing@example.com",
      );
      await user.type(screen.getByLabelText("Contraseña"), "Password123!");
      await user.type(
        screen.getByLabelText("Confirmar contraseña"),
        "Password123!",
      );

      const submitButton = screen.getByRole("button", { name: "Crear Cuenta" });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Email already exists")).toBeInTheDocument();
      });
    });

    it("shows default error message when no message provided", async () => {
      const user = userEvent.setup();

      mockSignUpEmail.mockResolvedValue({
        error: {},
      });

      render(<SignUpForm />);

      await user.type(screen.getByLabelText("Nombre completo"), "Juan Pérez");
      await user.type(
        screen.getByLabelText("Correo electrónico"),
        "juan@example.com",
      );
      await user.type(screen.getByLabelText("Contraseña"), "Password123!");
      await user.type(
        screen.getByLabelText("Confirmar contraseña"),
        "Password123!",
      );

      const submitButton = screen.getByRole("button", { name: "Crear Cuenta" });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Error al crear la cuenta. Intenta nuevamente."),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Google Sign Up", () => {
    it("calls authClient.signIn.social with google provider", async () => {
      const user = userEvent.setup();

      mockSignInSocial.mockResolvedValue({ success: true });

      render(<SignUpForm />);

      const googleButton = screen.getByRole("button", {
        name: /Continuar con Google/,
      });

      await user.click(googleButton);

      await waitFor(() => {
        expect(mockSignInSocial).toHaveBeenCalledWith({
          provider: "google",
          callbackURL: "/backoffice",
        });
      });
    });

    it("shows error on Google sign up failure", async () => {
      const user = userEvent.setup();

      mockSignInSocial.mockRejectedValue(new Error("Google auth failed"));

      render(<SignUpForm />);

      const googleButton = screen.getByRole("button", {
        name: /Continuar con Google/,
      });

      await user.click(googleButton);

      await waitFor(() => {
        expect(
          screen.getByText("Error al registrarse con Google"),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Security - Safe redirect URL", () => {
    it("blocks protocol-relative URLs", async () => {
      const user = userEvent.setup();

      mockSignUpEmail.mockResolvedValue({ success: true });

      render(<SignUpForm redirectTo="//evil.com" />);

      await user.type(screen.getByLabelText("Nombre completo"), "Juan Pérez");
      await user.type(
        screen.getByLabelText("Correo electrónico"),
        "juan@example.com",
      );
      await user.type(screen.getByLabelText("Contraseña"), "Password123!");
      await user.type(
        screen.getByLabelText("Confirmar contraseña"),
        "Password123!",
      );

      const submitButton = screen.getByRole("button", { name: "Crear Cuenta" });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/backoffice");
      });
    });
  });

  describe("UI states", () => {
    it("disables inputs during submission", async () => {
      const user = userEvent.setup();

      mockSignUpEmail.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ success: true }), 100);
          }),
      );

      render(<SignUpForm />);

      await user.type(screen.getByLabelText("Nombre completo"), "Juan Pérez");
      await user.type(
        screen.getByLabelText("Correo electrónico"),
        "juan@example.com",
      );
      await user.type(screen.getByLabelText("Contraseña"), "Password123!");
      await user.type(
        screen.getByLabelText("Confirmar contraseña"),
        "Password123!",
      );

      const submitButton = screen.getByRole("button", { name: "Crear Cuenta" });
      await user.click(submitButton);

      // Inputs should be disabled
      expect(screen.getByLabelText("Nombre completo")).toBeDisabled();
      expect(screen.getByLabelText("Correo electrónico")).toBeDisabled();
    });

    it("shows loading state on submit button", async () => {
      const user = userEvent.setup();

      mockSignUpEmail.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ success: true }), 100);
          }),
      );

      render(<SignUpForm />);

      await user.type(screen.getByLabelText("Nombre completo"), "Juan Pérez");
      await user.type(
        screen.getByLabelText("Correo electrónico"),
        "juan@example.com",
      );
      await user.type(screen.getByLabelText("Contraseña"), "Password123!");
      await user.type(
        screen.getByLabelText("Confirmar contraseña"),
        "Password123!",
      );

      const submitButton = screen.getByRole("button", { name: "Crear Cuenta" });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Creando cuenta..." }),
        ).toBeInTheDocument();
      });
    });

    it("clears error when resubmitting", async () => {
      const user = userEvent.setup();

      // First submission fails
      mockSignUpEmail.mockResolvedValueOnce({
        error: { message: "Email already exists" },
      });

      render(<SignUpForm />);

      await user.type(screen.getByLabelText("Nombre completo"), "Juan Pérez");
      await user.type(
        screen.getByLabelText("Correo electrónico"),
        "existing@example.com",
      );
      await user.type(screen.getByLabelText("Contraseña"), "Password123!");
      await user.type(
        screen.getByLabelText("Confirmar contraseña"),
        "Password123!",
      );

      const submitButton = screen.getByRole("button", { name: "Crear Cuenta" });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Email already exists")).toBeInTheDocument();
      });

      // Second submission succeeds
      mockSignUpEmail.mockResolvedValueOnce({ success: true });

      const emailInput = screen.getByLabelText("Correo electrónico");
      await user.clear(emailInput);
      await user.type(emailInput, "new@example.com");
      await user.click(submitButton);

      // Error should be cleared
      await waitFor(() => {
        expect(
          screen.queryByText("Email already exists"),
        ).not.toBeInTheDocument();
      });
    });
  });
});
