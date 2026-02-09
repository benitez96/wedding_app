import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useErrorTimeout } from "@/hooks/useErrorTimeout";

describe("useErrorTimeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Initialization", () => {
    it("initializes with no error", () => {
      const { result } = renderHook(() => useErrorTimeout());

      expect(result.current.error).toBeNull();
    });
  });

  describe("Setting errors", () => {
    it("sets error message", () => {
      const { result } = renderHook(() => useErrorTimeout());

      act(() => {
        result.current.setError("Test error");
      });

      expect(result.current.error).toBe("Test error");
    });

    it("updates error message when called multiple times", () => {
      const { result } = renderHook(() => useErrorTimeout());

      act(() => {
        result.current.setError("First error");
      });

      expect(result.current.error).toBe("First error");

      act(() => {
        result.current.setError("Second error");
      });

      expect(result.current.error).toBe("Second error");
    });
  });

  describe("Auto-clear timeout", () => {
    it("clears error after default timeout (5000ms)", () => {
      const { result } = renderHook(() => useErrorTimeout());

      act(() => {
        result.current.setError("Test error");
      });

      expect(result.current.error).toBe("Test error");

      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.error).toBeNull();
    });

    it("respects custom timeout duration", () => {
      const { result } = renderHook(() => useErrorTimeout({ timeout: 3000 }));

      act(() => {
        result.current.setError("Test error");
      });

      // Before timeout
      act(() => {
        vi.advanceTimersByTime(2999);
      });

      expect(result.current.error).toBe("Test error");

      // After timeout
      act(() => {
        vi.advanceTimersByTime(1);
      });

      expect(result.current.error).toBeNull();
    });

    it("resets timeout when new error is set before timeout expires", () => {
      const { result } = renderHook(() => useErrorTimeout({ timeout: 5000 }));

      act(() => {
        result.current.setError("First error");
      });

      // Advance part way through timeout
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.error).toBe("First error");

      // Set new error (should reset timeout)
      act(() => {
        result.current.setError("Second error");
      });

      expect(result.current.error).toBe("Second error");

      // Advance remaining time from first timeout (should not clear)
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.error).toBe("Second error");

      // Advance full timeout from second error
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe("Manual clearing", () => {
    it("clears error immediately when clearError is called", () => {
      const { result } = renderHook(() => useErrorTimeout());

      act(() => {
        result.current.setError("Test error");
      });

      expect(result.current.error).toBe("Test error");

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it("clears error before timeout expires", () => {
      const { result } = renderHook(() => useErrorTimeout({ timeout: 5000 }));

      act(() => {
        result.current.setError("Test error");
      });

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.error).toBe("Test error");

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();

      // Verify timeout doesn't trigger later
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.error).toBeNull();
    });

    it("does nothing when clearError is called with no error", () => {
      const { result } = renderHook(() => useErrorTimeout());

      expect(result.current.error).toBeNull();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe("Cleanup", () => {
    it("clears timeout on unmount", () => {
      const { result, unmount } = renderHook(() => useErrorTimeout());

      act(() => {
        result.current.setError("Test error");
      });

      expect(result.current.error).toBe("Test error");

      unmount();

      // Advance time after unmount
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // No error expected since component unmounted
      // (cannot check result.current after unmount)
    });

    it("does not call setState after unmount", () => {
      const { result, unmount } = renderHook(() => useErrorTimeout());

      act(() => {
        result.current.setError("Test error");
      });

      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      unmount();

      // Advance time to trigger timeout
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Should not log React warning about setState on unmounted component
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Multiple errors in sequence", () => {
    it("handles rapid error changes", () => {
      const { result } = renderHook(() => useErrorTimeout({ timeout: 1000 }));

      act(() => {
        result.current.setError("Error 1");
      });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      act(() => {
        result.current.setError("Error 2");
      });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      act(() => {
        result.current.setError("Error 3");
      });

      expect(result.current.error).toBe("Error 3");

      // Clear after final timeout
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.error).toBeNull();
    });
  });
});
