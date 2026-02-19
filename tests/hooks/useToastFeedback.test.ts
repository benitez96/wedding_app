import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useToastFeedback } from "@/hooks/useToastFeedback";

const mockAddToast = vi.hoisted(() => vi.fn());

vi.mock("@heroui/toast", () => ({
  addToast: mockAddToast,
}));

describe("useToastFeedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Return value", () => {
    it("returns toastSuccess and toastError functions", () => {
      const { result } = renderHook(() => useToastFeedback());

      expect(typeof result.current.toastSuccess).toBe("function");
      expect(typeof result.current.toastError).toBe("function");
    });
  });

  describe("toastSuccess", () => {
    it("calls addToast with success color", () => {
      const { result } = renderHook(() => useToastFeedback());

      result.current.toastSuccess("Cambios guardados correctamente");

      expect(mockAddToast).toHaveBeenCalledTimes(1);
      expect(mockAddToast).toHaveBeenCalledWith({
        title: "Cambios guardados correctamente",
        color: "success",
        variant: "flat",
        timeout: 4000,
      });
    });

    it("passes the message as title", () => {
      const { result } = renderHook(() => useToastFeedback());

      result.current.toastSuccess("Operación exitosa");

      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Operación exitosa" }),
      );
    });

    it("uses flat variant", () => {
      const { result } = renderHook(() => useToastFeedback());

      result.current.toastSuccess("OK");

      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "flat" }),
      );
    });

    it("uses 4000ms timeout", () => {
      const { result } = renderHook(() => useToastFeedback());

      result.current.toastSuccess("OK");

      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({ timeout: 4000 }),
      );
    });
  });

  describe("toastError", () => {
    it("calls addToast with danger color", () => {
      const { result } = renderHook(() => useToastFeedback());

      result.current.toastError("Error al guardar los cambios");

      expect(mockAddToast).toHaveBeenCalledTimes(1);
      expect(mockAddToast).toHaveBeenCalledWith({
        title: "Error al guardar los cambios",
        color: "danger",
        variant: "flat",
        timeout: 5000,
      });
    });

    it("passes the message as title", () => {
      const { result } = renderHook(() => useToastFeedback());

      result.current.toastError("Algo salió mal");

      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Algo salió mal" }),
      );
    });

    it("uses flat variant", () => {
      const { result } = renderHook(() => useToastFeedback());

      result.current.toastError("Error");

      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "flat" }),
      );
    });

    it("uses 5000ms timeout", () => {
      const { result } = renderHook(() => useToastFeedback());

      result.current.toastError("Error");

      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({ timeout: 5000 }),
      );
    });
  });

  describe("Diferencia entre success y error", () => {
    it("success usa color 'success' y error usa color 'danger'", () => {
      const { result } = renderHook(() => useToastFeedback());

      result.current.toastSuccess("OK");
      result.current.toastError("Error");

      expect(mockAddToast).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ color: "success" }),
      );
      expect(mockAddToast).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ color: "danger" }),
      );
    });

    it("error tiene mayor timeout que success", () => {
      const { result } = renderHook(() => useToastFeedback());

      result.current.toastSuccess("OK");
      result.current.toastError("Error");

      const successCall = mockAddToast.mock.calls[0][0];
      const errorCall = mockAddToast.mock.calls[1][0];

      expect(errorCall.timeout).toBeGreaterThan(successCall.timeout);
    });
  });

  describe("Edge cases", () => {
    it("handles empty string message", () => {
      const { result } = renderHook(() => useToastFeedback());

      result.current.toastSuccess("");

      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "" }),
      );
    });

    it("handles special characters in message", () => {
      const specialMessage = "Error: <script>alert('xss')</script>";
      const { result } = renderHook(() => useToastFeedback());

      result.current.toastError(specialMessage);

      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: specialMessage }),
      );
    });

    it("can call toastSuccess and toastError independently", () => {
      const { result } = renderHook(() => useToastFeedback());

      result.current.toastSuccess("Éxito");
      expect(mockAddToast).toHaveBeenCalledTimes(1);

      result.current.toastError("Fallo");
      expect(mockAddToast).toHaveBeenCalledTimes(2);
    });
  });
});
