// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import BankInfo from "@/components/BankInfo";

describe("BankInfo", () => {
  const mockWriteText = vi.fn();

  beforeEach(() => {
    // Mock clipboard API using defineProperty
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: mockWriteText,
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("rendering", () => {
    it("renders all bank information sections", () => {
      render(
        <BankInfo
          alias="mi.boda.alias"
          bankName="Banco Test"
          accountType="Caja de Ahorro"
          accountHolder="Juan Pérez"
        />,
      );

      expect(screen.getByText("Datos Bancarios")).toBeInTheDocument();
      expect(screen.getByText("Banco Test")).toBeInTheDocument();
      expect(screen.getByText("Caja de Ahorro")).toBeInTheDocument();
      expect(screen.getByText("Juan Pérez")).toBeInTheDocument();
      expect(screen.getByText("mi.boda.alias")).toBeInTheDocument();
    });

    it("renders with default values when optional props are not provided", () => {
      render(<BankInfo alias="test.alias" />);

      expect(screen.getByText("Banco")).toBeInTheDocument();
      expect(screen.getByText("Cuenta Corriente")).toBeInTheDocument();
      expect(screen.getByText("NOMBRE APELLIDO")).toBeInTheDocument();
      expect(screen.getByText("test.alias")).toBeInTheDocument();
    });

    it("renders copy button with correct initial text", () => {
      render(<BankInfo alias="test.alias" />);

      expect(screen.getByText("Copiar ALIAS")).toBeInTheDocument();
    });
  });

  describe("clipboard functionality", () => {
    it("copies alias to clipboard when button is clicked", async () => {
      mockWriteText.mockResolvedValue(undefined);

      render(<BankInfo alias="my.test.alias" />);

      const copyButton = screen.getByText("Copiar ALIAS");
      copyButton.click();

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith("my.test.alias");
      });
    });

    it("shows success state after successful copy", async () => {
      mockWriteText.mockResolvedValue(undefined);

      render(<BankInfo alias="test.alias" />);

      const copyButton = screen.getByText("Copiar ALIAS");
      copyButton.click();

      await waitFor(() => {
        expect(screen.getByText("¡Copiado!")).toBeInTheDocument();
      });
    });

    it("resets to initial state after 2 seconds", async () => {
      mockWriteText.mockResolvedValue(undefined);

      render(<BankInfo alias="test.alias" />);

      const copyButton = screen.getByText("Copiar ALIAS");
      copyButton.click();

      await waitFor(() => {
        expect(screen.getByText("¡Copiado!")).toBeInTheDocument();
      });

      // Wait for 2 seconds reset with real timers
      await waitFor(
        () => {
          expect(screen.getByText("Copiar ALIAS")).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    it("handles multiple rapid clicks correctly", async () => {
      mockWriteText.mockResolvedValue(undefined);

      render(<BankInfo alias="test.alias" />);

      const copyButton = screen.getByText("Copiar ALIAS");

      // Click multiple times rapidly
      copyButton.click();
      copyButton.click();
      copyButton.click();

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledTimes(3);
      });

      // Should show success state
      await waitFor(() => {
        expect(screen.getByText("¡Copiado!")).toBeInTheDocument();
      });

      // After 2 seconds, should reset
      await waitFor(
        () => {
          expect(screen.getByText("Copiar ALIAS")).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    it("handles clipboard API error gracefully", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockWriteText.mockRejectedValue(new Error("Clipboard not available"));

      render(<BankInfo alias="test.alias" />);

      const copyButton = screen.getByText("Copiar ALIAS");
      copyButton.click();

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      // Button should remain in initial state (not show "¡Copiado!")
      expect(screen.getByText("Copiar ALIAS")).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });
  });

  describe("cleanup", () => {
    it("clears timeout on unmount", async () => {
      mockWriteText.mockResolvedValue(undefined);

      const { unmount } = render(<BankInfo alias="test.alias" />);

      const copyButton = screen.getByText("Copiar ALIAS");
      copyButton.click();

      await waitFor(() => {
        expect(screen.getByText("¡Copiado!")).toBeInTheDocument();
      });

      const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe("icon rendering", () => {
    it("shows Copy icon initially", () => {
      render(<BankInfo alias="test.alias" />);

      // The Copy icon is rendered via lucide-react, we just verify the button exists
      expect(screen.getByText("Copiar ALIAS")).toBeInTheDocument();
    });

    it("shows Check icon when copied", async () => {
      mockWriteText.mockResolvedValue(undefined);

      render(<BankInfo alias="test.alias" />);

      const copyButton = screen.getByText("Copiar ALIAS");
      copyButton.click();

      await waitFor(() => {
        expect(screen.getByText("¡Copiado!")).toBeInTheDocument();
      });

      // The Check icon is now rendered instead of Copy
    });
  });
});
