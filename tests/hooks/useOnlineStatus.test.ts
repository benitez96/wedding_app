/**
 * Tests for hooks/useOnlineStatus.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

describe("useOnlineStatus", () => {
  let onlineListeners: Set<() => void>;
  let offlineListeners: Set<() => void>;

  beforeEach(() => {
    onlineListeners = new Set();
    offlineListeners = new Set();

    // Mock window.addEventListener
    vi.spyOn(window, "addEventListener").mockImplementation(
      (event, handler) => {
        if (event === "online") {
          onlineListeners.add(handler as () => void);
        } else if (event === "offline") {
          offlineListeners.add(handler as () => void);
        }
      },
    );

    // Mock window.removeEventListener
    vi.spyOn(window, "removeEventListener").mockImplementation(
      (event, handler) => {
        if (event === "online") {
          onlineListeners.delete(handler as () => void);
        } else if (event === "offline") {
          offlineListeners.delete(handler as () => void);
        }
      },
    );

    // Mock navigator.onLine
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize with navigator.onLine value", () => {
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: true,
    });

    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current).toBe(true);
  });

  it("should initialize as offline when navigator.onLine is false", () => {
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: false,
    });

    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current).toBe(false);
  });

  it("should update to online when online event fires", async () => {
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: false,
    });

    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current).toBe(false);

    // Simulate online event
    onlineListeners.forEach((listener) => listener());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it("should update to offline when offline event fires", async () => {
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: true,
    });

    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current).toBe(true);

    // Simulate offline event
    offlineListeners.forEach((listener) => listener());

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it("should toggle between online/offline states", async () => {
    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current).toBe(true);

    // Go offline
    offlineListeners.forEach((listener) => listener());
    await waitFor(() => {
      expect(result.current).toBe(false);
    });

    // Go online
    onlineListeners.forEach((listener) => listener());
    await waitFor(() => {
      expect(result.current).toBe(true);
    });

    // Go offline again
    offlineListeners.forEach((listener) => listener());
    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it("should cleanup event listeners on unmount", () => {
    const { unmount } = renderHook(() => useOnlineStatus());

    expect(onlineListeners.size).toBe(1);
    expect(offlineListeners.size).toBe(1);

    unmount();

    expect(onlineListeners.size).toBe(0);
    expect(offlineListeners.size).toBe(0);
  });

  it("should register event listeners on mount", () => {
    renderHook(() => useOnlineStatus());

    expect(window.addEventListener).toHaveBeenCalledWith(
      "online",
      expect.any(Function),
    );
    expect(window.addEventListener).toHaveBeenCalledWith(
      "offline",
      expect.any(Function),
    );
  });

  it("should remove event listeners on unmount", () => {
    const { unmount } = renderHook(() => useOnlineStatus());

    unmount();

    expect(window.removeEventListener).toHaveBeenCalledWith(
      "online",
      expect.any(Function),
    );
    expect(window.removeEventListener).toHaveBeenCalledWith(
      "offline",
      expect.any(Function),
    );
  });
});
