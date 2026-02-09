// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LoginForm } from "@/components/auth/LoginForm";

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

// Mock auth-client - MUST use vi.hoisted() for factory functions
const mockSignInEmail = vi.hoisted(() => vi.fn());
const mockSignInSocial = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: {
      email: mockSignInEmail,
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
    isRequired,
    isDisabled,
    autoComplete,
  }: {
    name: string;
    label: string;
    isRequired?: boolean;
    isDisabled?: boolean;
    autoComplete?: string;
  }) => (
    <div data-testid="password-input">
      <label htmlFor={name}>{label}</label>
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
}));

describe("LoginForm", () => {
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
    it("renders login form with all fields", () => {
      render(<LoginForm />);

      expect(screen.getByText("Bienvenido de vuelta")).toBeInTheDocument();
      expect(
        screen.getByText("Ingresa a tu cuenta para gestionar tus eventos"),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Correo electrónico")).toBeInTheDocument();
      expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    });

    it("renders submit button", () => {
      render(<LoginForm />);

      const submitButton = screen.getByRole("button", {
        name: "Iniciar Sesión",
      });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveAttribute("type", "submit");
    });

    it("renders Google sign in button", () => {
      render(<LoginForm />);

      expect(
        screen.getByRole("button", { name: /Continuar con Google/ }),
      ).toBeInTheDocument();
    });

    it("renders sign up link by default", () => {
      render(<LoginForm />);

      expect(screen.getByText("¿No tenés cuenta?")).toBeInTheDocument();
      expect(screen.getByText("Registrate acá")).toBeInTheDocument();
    });

    it("hides sign up link when showSignUpLink is false", () => {
      render(<LoginForm showSignUpLink={false} />);

      expect(screen.queryByText("¿No tenés cuenta?")).not.toBeInTheDocument();
      expect(screen.queryByText("Registrate acá")).not.toBeInTheDocument();
    });

    it("renders Mail icon", () => {
      render(<LoginForm />);

      expect(screen.getByTestId("mail-icon")).toBeInTheDocument();
    });
  });

  describe("Form submission - Email/Password", () => {
    it("submits form with valid credentials", async () => {
      const user = userEvent.setup();

      mockSignInEmail.mockResolvedValue({ success: true });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText("Correo electrónico");
      const passwordInput = screen.getByLabelText("Contraseña");
      const submitButton = screen.getByRole("button", {
        name: "Iniciar Sesión",
      });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignInEmail).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "password123",
        });
      });
    });

    it("redirects to /backoffice on successful login", async () => {
      const user = userEvent.setup();

      mockSignInEmail.mockResolvedValue({ success: true });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText("Correo electrónico");
      const passwordInput = screen.getByLabelText("Contraseña");
      const submitButton = screen.getByRole("button", {
        name: "Iniciar Sesión",
      });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/backoffice");
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it("redirects to custom URL when redirectTo is provided", async () => {
      const user = userEvent.setup();

      mockSignInEmail.mockResolvedValue({ success: true });

      render(<LoginForm redirectTo="/dashboard" />);

      const emailInput = screen.getByLabelText("Correo electrónico");
      const passwordInput = screen.getByLabelText("Contraseña");
      const submitButton = screen.getByRole("button", {
        name: "Iniciar Sesión",
      });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/dashboard");
      });
    });

    it("shows error message on login failure", async () => {
      const user = userEvent.setup();

      mockSignInEmail.mockResolvedValue({
        error: { message: "Invalid credentials" },
      });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText("Correo electrónico");
      const passwordInput = screen.getByLabelText("Contraseña");
      const submitButton = screen.getByRole("button", {
        name: "Iniciar Sesión",
      });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "wrongpassword");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
      });
    });

    it("shows default error message when no message provided", async () => {
      const user = userEvent.setup();

      mockSignInEmail.mockResolvedValue({
        error: {},
      });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText("Correo electrónico");
      const passwordInput = screen.getByLabelText("Contraseña");
      const submitButton = screen.getByRole("button", {
        name: "Iniciar Sesión",
      });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Error al iniciar sesión. Intenta nuevamente."),
        ).toBeInTheDocument();
      });
    });

    it("disables inputs during submission", async () => {
      const user = userEvent.setup();

      mockSignInEmail.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ success: true }), 100);
          }),
      );

      render(<LoginForm />);

      const emailInput = screen.getByLabelText("Correo electrónico");
      const passwordInput = screen.getByLabelText("Contraseña");
      const submitButton = screen.getByRole("button", {
        name: "Iniciar Sesión",
      });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      // Check that inputs are disabled during pending state
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();

      await waitFor(() => {
        expect(mockSignInEmail).toHaveBeenCalled();
      });
    });

    it("shows loading state on submit button", async () => {
      const user = userEvent.setup();

      mockSignInEmail.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ success: true }), 100);
          }),
      );

      render(<LoginForm />);

      const emailInput = screen.getByLabelText("Correo electrónico");
      const passwordInput = screen.getByLabelText("Contraseña");
      const submitButton = screen.getByRole("button", {
        name: "Iniciar Sesión",
      });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      // During loading, button text changes
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Iniciando sesión..." }),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Google Sign In", () => {
    it("calls authClient.signIn.social with google provider", async () => {
      const user = userEvent.setup();

      mockSignInSocial.mockResolvedValue({ success: true });

      render(<LoginForm />);

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

    it("uses custom redirectTo for Google sign in", async () => {
      const user = userEvent.setup();

      mockSignInSocial.mockResolvedValue({ success: true });

      render(<LoginForm redirectTo="/custom-redirect" />);

      const googleButton = screen.getByRole("button", {
        name: /Continuar con Google/,
      });

      await user.click(googleButton);

      await waitFor(() => {
        expect(mockSignInSocial).toHaveBeenCalledWith({
          provider: "google",
          callbackURL: "/custom-redirect",
        });
      });
    });

    it("shows error on Google sign in failure", async () => {
      const user = userEvent.setup();

      mockSignInSocial.mockRejectedValue(new Error("Google auth failed"));

      render(<LoginForm />);

      const googleButton = screen.getByRole("button", {
        name: /Continuar con Google/,
      });

      await user.click(googleButton);

      await waitFor(() => {
        expect(
          screen.getByText("Error al iniciar sesión con Google"),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Security - Safe redirect URL", () => {
    it("allows safe relative URLs", async () => {
      const user = userEvent.setup();

      mockSignInEmail.mockResolvedValue({ success: true });

      render(<LoginForm redirectTo="/dashboard/events" />);

      const emailInput = screen.getByLabelText("Correo electrónico");
      const passwordInput = screen.getByLabelText("Contraseña");
      const submitButton = screen.getByRole("button", {
        name: "Iniciar Sesión",
      });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/dashboard/events");
      });
    });

    it("blocks protocol-relative URLs", async () => {
      const user = userEvent.setup();

      mockSignInEmail.mockResolvedValue({ success: true });

      render(<LoginForm redirectTo="//evil.com" />);

      const emailInput = screen.getByLabelText("Correo electrónico");
      const passwordInput = screen.getByLabelText("Contraseña");
      const submitButton = screen.getByRole("button", {
        name: "Iniciar Sesión",
      });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        // Should redirect to default /backoffice, not //evil.com
        expect(mockPush).toHaveBeenCalledWith("/backoffice");
      });
    });

    it("blocks absolute URLs", async () => {
      const user = userEvent.setup();

      mockSignInEmail.mockResolvedValue({ success: true });

      render(<LoginForm redirectTo="https://evil.com" />);

      const emailInput = screen.getByLabelText("Correo electrónico");
      const passwordInput = screen.getByLabelText("Contraseña");
      const submitButton = screen.getByRole("button", {
        name: "Iniciar Sesión",
      });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        // Should redirect to default /backoffice, not https://evil.com
        expect(mockPush).toHaveBeenCalledWith("/backoffice");
      });
    });

    it("blocks URLs with :// protocol separator", async () => {
      const user = userEvent.setup();

      mockSignInEmail.mockResolvedValue({ success: true });

      render(<LoginForm redirectTo="javascript://alert(1)" />);

      const emailInput = screen.getByLabelText("Correo electrónico");
      const passwordInput = screen.getByLabelText("Contraseña");
      const submitButton = screen.getByRole("button", {
        name: "Iniciar Sesión",
      });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/backoffice");
      });
    });
  });

  describe("Form attributes", () => {
    it("has correct form method and action", () => {
      render(<LoginForm />);

      const form = document.querySelector("form");
      expect(form).toHaveAttribute("method", "post");
      expect(form).toHaveAttribute("action", "");
    });

    it("email input has correct attributes", () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText("Correo electrónico");
      expect(emailInput).toHaveAttribute("type", "email");
      expect(emailInput).toHaveAttribute("name", "email");
      expect(emailInput).toHaveAttribute("autoComplete", "email");
      expect(emailInput).toBeRequired();
    });

    it("password input has correct attributes", () => {
      render(<LoginForm />);

      const passwordInput = screen.getByLabelText("Contraseña");
      expect(passwordInput).toHaveAttribute("type", "password");
      expect(passwordInput).toHaveAttribute("name", "password");
      expect(passwordInput).toHaveAttribute("autoComplete", "current-password");
      expect(passwordInput).toBeRequired();
    });
  });

  describe("Edge cases", () => {
    it("handles special characters in credentials", async () => {
      const user = userEvent.setup();

      mockSignInEmail.mockResolvedValue({
        error: { message: "Invalid credentials" },
      });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText("Correo electrónico");
      const passwordInput = screen.getByLabelText("Contraseña");
      const submitButton = screen.getByRole("button", {
        name: "Iniciar Sesión",
      });

      // Use valid email format but with special chars in password
      await user.type(emailInput, "user+test@example.com");
      await user.type(passwordInput, "p@$$w0rd!#%");
      await user.click(submitButton);

      // authClient should be called with special characters
      await waitFor(() => {
        expect(mockSignInEmail).toHaveBeenCalledWith({
          email: "user+test@example.com",
          password: "p@$$w0rd!#%",
        });
      });
    });

    it("clears error when resubmitting", async () => {
      const user = userEvent.setup();

      // First submission fails
      mockSignInEmail.mockResolvedValueOnce({
        error: { message: "Invalid credentials" },
      });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText("Correo electrónico");
      const passwordInput = screen.getByLabelText("Contraseña");
      const submitButton = screen.getByRole("button", {
        name: "Iniciar Sesión",
      });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "wrongpassword");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
      });

      // Second submission succeeds
      mockSignInEmail.mockResolvedValueOnce({ success: true });

      await user.clear(passwordInput);
      await user.type(passwordInput, "correctpassword");
      await user.click(submitButton);

      // Error should be cleared
      await waitFor(() => {
        expect(
          screen.queryByText("Invalid credentials"),
        ).not.toBeInTheDocument();
      });
    });
  });
});
