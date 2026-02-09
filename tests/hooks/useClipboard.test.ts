import { renderHook, act } from "@testing-library/react";
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  onTestFinished,
} from "vitest";
import { useClipboard } from "@/hooks/useClipboard";

describe("useClipboard", () => {
  // Mock clipboard API
  const mockWriteText = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();

    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    });

    mockWriteText.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe("Initialization", () => {
    it("initializes with no copied text", () => {
      const { result } = renderHook(() => useClipboard());

      expect(result.current.copiedText).toBeNull();
    });

    it("isCopied returns false initially", () => {
      const { result } = renderHook(() => useClipboard());

      expect(result.current.isCopied("test")).toBe(false);
    });
  });

  describe("Copying text", () => {
    it("copies text to clipboard", async () => {
      const { result } = renderHook(() => useClipboard());

      await act(async () => {
        await result.current.copy("test text");
      });

      expect(mockWriteText).toHaveBeenCalledWith("test text");
      expect(result.current.copiedText).toBe("test text");
    });

    it("updates copiedText when copying", async () => {
      const { result } = renderHook(() => useClipboard());

      await act(async () => {
        await result.current.copy("first text");
      });

      expect(result.current.copiedText).toBe("first text");

      await act(async () => {
        await result.current.copy("second text");
      });

      expect(result.current.copiedText).toBe("second text");
    });

    it("isCopied returns true for copied text", async () => {
      const { result } = renderHook(() => useClipboard());

      await act(async () => {
        await result.current.copy("test text");
      });

      expect(result.current.isCopied("test text")).toBe(true);
      expect(result.current.isCopied("other text")).toBe(false);
    });
  });

  describe("Timeout behavior", () => {
    it("clears copiedText after default timeout (2000ms)", async () => {
      const { result } = renderHook(() => useClipboard());

      await act(async () => {
        await result.current.copy("test text");
      });

      expect(result.current.copiedText).toBe("test text");

      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.copiedText).toBeNull();
    });

    it("respects custom timeout duration", async () => {
      const { result } = renderHook(() => useClipboard({ timeout: 1000 }));

      await act(async () => {
        await result.current.copy("test text");
      });

      // Before timeout
      act(() => {
        vi.advanceTimersByTime(999);
      });

      expect(result.current.copiedText).toBe("test text");

      // After timeout
      act(() => {
        vi.advanceTimersByTime(1);
      });

      expect(result.current.copiedText).toBeNull();
    });

    it("resets timeout when copying new text", async () => {
      const { result } = renderHook(() => useClipboard({ timeout: 2000 }));

      await act(async () => {
        await result.current.copy("first text");
      });

      // Advance part way
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.copiedText).toBe("first text");

      // Copy new text (resets timeout)
      await act(async () => {
        await result.current.copy("second text");
      });

      expect(result.current.copiedText).toBe("second text");

      // Advance remaining time from first timeout
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Should still be "second text" (timeout reset)
      expect(result.current.copiedText).toBe("second text");

      // Advance full timeout from second copy
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.copiedText).toBeNull();
    });
  });

  describe("Callbacks", () => {
    it("calls onSuccess when copy succeeds", async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() => useClipboard({ onSuccess }));

      await act(async () => {
        await result.current.copy("test text");
      });

      expect(onSuccess).toHaveBeenCalledWith("test text");
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it("calls onError when copy fails", async () => {
      const onError = vi.fn();
      const copyError = new Error("Clipboard not available");

      mockWriteText.mockRejectedValueOnce(copyError);

      const { result } = renderHook(() => useClipboard({ onError }));

      await act(async () => {
        try {
          await result.current.copy("test text");
        } catch {
          // Expected to throw
        }
      });

      expect(onError).toHaveBeenCalledWith(copyError);
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it("throws error when clipboard write fails", async () => {
      const copyError = new Error("Clipboard not available");
      mockWriteText.mockRejectedValueOnce(copyError);

      const { result } = renderHook(() => useClipboard());

      await expect(async () => {
        await act(async () => {
          await result.current.copy("test text");
        });
      }).rejects.toThrow("Clipboard not available");
    });

    it("wraps non-Error exceptions in Error object", async () => {
      const onError = vi.fn();
      mockWriteText.mockRejectedValueOnce("String error");

      const { result } = renderHook(() => useClipboard({ onError }));

      await act(async () => {
        try {
          await result.current.copy("test text");
        } catch {
          // Expected to throw
        }
      });

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Failed to copy to clipboard",
        }),
      );
    });
  });

  describe("Cleanup", () => {
    it("clears timeout on unmount", async () => {
      const { result, unmount } = renderHook(() => useClipboard());

      await act(async () => {
        await result.current.copy("test text");
      });

      expect(result.current.copiedText).toBe("test text");

      unmount();

      // Advance time after unmount (should not cause issues)
      act(() => {
        vi.advanceTimersByTime(2000);
      });
    });

    it("does not call setState after unmount", async () => {
      const { result, unmount } = renderHook(() => useClipboard());

      await act(async () => {
        await result.current.copy("test text");
      });

      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Use onTestFinished to ensure cleanup even if test fails
      onTestFinished(() => {
        consoleErrorSpy.mockRestore();
      });

      unmount();

      // Trigger timeout
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Should not log React warning
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe("Multiple rapid copies", () => {
    it("handles multiple rapid copy operations", async () => {
      const { result } = renderHook(() => useClipboard({ timeout: 1000 }));

      await act(async () => {
        await result.current.copy("text 1");
      });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      await act(async () => {
        await result.current.copy("text 2");
      });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      await act(async () => {
        await result.current.copy("text 3");
      });

      expect(result.current.copiedText).toBe("text 3");
      expect(result.current.isCopied("text 3")).toBe(true);
      expect(result.current.isCopied("text 1")).toBe(false);

      // Clear after final timeout
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.copiedText).toBeNull();
    });
  });

  describe("Edge cases", () => {
    it("handles empty string", async () => {
      const { result } = renderHook(() => useClipboard());

      await act(async () => {
        await result.current.copy("");
      });

      expect(mockWriteText).toHaveBeenCalledWith("");
      expect(result.current.copiedText).toBe("");
    });

    it("handles very long text", async () => {
      const longText = "a".repeat(10000);
      const { result } = renderHook(() => useClipboard());

      await act(async () => {
        await result.current.copy(longText);
      });

      expect(mockWriteText).toHaveBeenCalledWith(longText);
      expect(result.current.copiedText).toBe(longText);
    });

    it("handles special characters", async () => {
      const specialText = "Test\n\t\r特殊字符🎉";
      const { result } = renderHook(() => useClipboard());

      await act(async () => {
        await result.current.copy(specialText);
      });

      expect(mockWriteText).toHaveBeenCalledWith(specialText);
      expect(result.current.copiedText).toBe(specialText);
    });
  });
});
