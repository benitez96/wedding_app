// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ExportConfirmedGuestsButton from "@/components/ExportConfirmedGuestsButton";

describe("ExportConfirmedGuestsButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock URL methods
    global.URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
    global.URL.revokeObjectURL = vi.fn();
  });

  describe("rendering", () => {
    it("renders button with correct initial text", () => {
      render(<ExportConfirmedGuestsButton />);

      expect(screen.getByText("Exportar Confirmados")).toBeInTheDocument();
    });

    it("renders button with icon", () => {
      render(<ExportConfirmedGuestsButton />);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });
  });

  describe("export functionality", () => {
    it("fetches data from API when button is clicked", async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        blob: vi.fn().mockResolvedValue(new Blob()),
      });

      render(<ExportConfirmedGuestsButton />);

      const button = screen.getByText("Exportar Confirmados");
      await user.click(button);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/backoffice/export-confirmed-guests",
      );
    });

    it("shows loading state while exporting", async () => {
      const user = userEvent.setup();
      let resolveBlob: (value: Blob) => void;
      const blobPromise = new Promise<Blob>((resolve) => {
        resolveBlob = resolve;
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        blob: vi.fn().mockReturnValue(blobPromise),
      });

      render(<ExportConfirmedGuestsButton />);

      const button = screen.getByText("Exportar Confirmados");
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText("Generando...")).toBeInTheDocument();
      });

      // Resolve the promise to finish loading
      resolveBlob!(new Blob());

      await waitFor(() => {
        expect(screen.getByText("Exportar Confirmados")).toBeInTheDocument();
      });
    });

    it("creates blob URL for download", async () => {
      const user = userEvent.setup();
      const mockBlob = new Blob();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        blob: vi.fn().mockResolvedValue(mockBlob),
      });

      render(<ExportConfirmedGuestsButton />);

      const button = screen.getByText("Exportar Confirmados");
      await user.click(button);

      await waitFor(() => {
        expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      });
    });
  });

  describe("error handling", () => {
    it("handles fetch error gracefully", async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
      });

      render(<ExportConfirmedGuestsButton />);

      const button = screen.getByText("Exportar Confirmados");
      await user.click(button);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          "Error al exportar los datos. Por favor, intenta de nuevo.",
        );
      });

      // Should return to initial state
      await waitFor(() => {
        expect(screen.getByText("Exportar Confirmados")).toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
      alertSpy.mockRestore();
    });

    it("handles network error gracefully", async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      render(<ExportConfirmedGuestsButton />);

      const button = screen.getByText("Exportar Confirmados");
      await user.click(button);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalled();
      });

      // Should return to initial state
      await waitFor(() => {
        expect(screen.getByText("Exportar Confirmados")).toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
      alertSpy.mockRestore();
    });

    it("does not create blob URL when fetch fails", async () => {
      const user = userEvent.setup();
      vi.spyOn(console, "error").mockImplementation(() => {});
      vi.spyOn(window, "alert").mockImplementation(() => {});

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
      });

      render(<ExportConfirmedGuestsButton />);

      const button = screen.getByText("Exportar Confirmados");
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText("Exportar Confirmados")).toBeInTheDocument();
      });

      expect(global.URL.createObjectURL).not.toHaveBeenCalled();
    });
  });

  describe("loading state", () => {
    it("disables button while loading", async () => {
      const user = userEvent.setup();
      let resolveBlob: (value: Blob) => void;
      const blobPromise = new Promise<Blob>((resolve) => {
        resolveBlob = resolve;
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        blob: vi.fn().mockReturnValue(blobPromise),
      });

      render(<ExportConfirmedGuestsButton />);

      const button = screen.getByRole("button");
      await user.click(button);

      await waitFor(() => {
        expect(button).toHaveAttribute("data-loading", "true");
      });

      resolveBlob!(new Blob());

      await waitFor(() => {
        expect(button).not.toHaveAttribute("data-loading", "true");
      });
    });
  });
});
