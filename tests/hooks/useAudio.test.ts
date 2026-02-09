import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useAudio } from "@/hooks/useAudio";

/**
 * Mock Audio API
 *
 * jsdom doesn't implement Audio API, so we need to mock it.
 * We create a mock that simulates real Audio behavior.
 */
class MockAudio {
  src = "";
  volume = 1;
  loop = false;
  preload = "metadata";
  paused = true;
  private listeners: Record<string, Array<(e?: Event) => void>> = {};

  addEventListener(event: string, handler: (e?: Event) => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(handler);
  }

  removeEventListener(event: string, handler: (e?: Event) => void) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(
        (h) => h !== handler,
      );
    }
  }

  async play() {
    this.paused = false;
    this.trigger("play");
    return Promise.resolve();
  }

  pause() {
    this.paused = true;
    this.trigger("pause");
  }

  // Helper to trigger events manually in tests
  trigger(event: string, eventObj?: Event) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((handler) => handler(eventObj));
    }
  }

  // Simulate loading success
  simulateLoad() {
    this.trigger("loadstart");
    this.trigger("canplay");
    this.trigger("canplaythrough");
  }

  // Simulate loading error
  simulateError(error?: Error) {
    const errorEvent = new Event("error");
    if (error) {
      (errorEvent as any).error = error;
    }
    this.trigger("error", errorEvent);
  }

  // Simulate audio ending
  simulateEnd() {
    this.paused = true;
    this.trigger("ended");
  }
}

// Hoisted mock Audio constructor
const mockAudioInstances: MockAudio[] = [];
const AudioConstructor = vi.hoisted(() => {
  return class {
    constructor(src?: string) {
      const instance = new MockAudio();
      if (src) {
        instance.src = src;
      }
      mockAudioInstances.push(instance);
      return instance;
    }
  };
});

describe("useAudio", () => {
  let mockAudio: MockAudio;

  beforeEach(() => {
    // Clear instances array
    mockAudioInstances.length = 0;

    // Mock global Audio constructor
    (global as any).Audio = AudioConstructor;

    // Mock console.error to avoid noise in tests
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Helper to get latest audio instance
  const getLatestAudio = () => {
    mockAudio = mockAudioInstances[mockAudioInstances.length - 1];
    return mockAudio;
  };

  describe("Initialization", () => {
    it("initializes with default values", () => {
      const { result } = renderHook(() => useAudio());

      expect(result.current.isPlaying).toBe(false);
      expect(result.current.isLoaded).toBe(false);
      expect(result.current.hasUserInteracted).toBe(false);
      expect(result.current.audio).toBeDefined();
    });

    it("creates Audio element with default src", () => {
      renderHook(() => useAudio());
      const audio = getLatestAudio();

      expect(mockAudioInstances).toHaveLength(1);
      expect(audio.src).toBe("/audio/background-music.mp3");
    });

    it("creates Audio element with custom src", () => {
      renderHook(() => useAudio({ src: "/custom-audio.mp3" }));
      const audio = getLatestAudio();

      expect(audio.src).toBe("/custom-audio.mp3");
    });

    it("sets loop to true by default", () => {
      renderHook(() => useAudio());
      const audio = getLatestAudio();

      expect(audio.loop).toBe(true);
    });

    it("sets custom loop value", () => {
      renderHook(() => useAudio({ loop: false }));
      const audio = getLatestAudio();

      expect(audio.loop).toBe(false);
    });

    it("sets volume to 0.5 by default", () => {
      renderHook(() => useAudio());
      const audio = getLatestAudio();

      expect(audio.volume).toBe(0.5);
    });

    it("sets custom volume value", () => {
      renderHook(() => useAudio({ volume: 0.8 }));
      const audio = getLatestAudio();

      expect(audio.volume).toBe(0.8);
    });

    it("sets preload to metadata", () => {
      renderHook(() => useAudio());
      const audio = getLatestAudio();

      expect(audio.preload).toBe("metadata");
    });
  });

  describe("Loading states", () => {
    it("sets isLoaded to true when audio can play", async () => {
      const { result } = renderHook(() => useAudio());
      const audio = getLatestAudio();

      expect(result.current.isLoaded).toBe(false);

      audio.trigger("canplay");

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });
    });

    it("sets isLoaded to true when audio can play through", async () => {
      const { result } = renderHook(() => useAudio());
      const audio = getLatestAudio();

      audio.trigger("canplaythrough");

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });
    });

    it("sets isLoaded to false on load start", async () => {
      const { result } = renderHook(() => useAudio());
      const audio = getLatestAudio();

      // First load
      audio.trigger("canplay");
      await waitFor(() => expect(result.current.isLoaded).toBe(true));

      // Reload
      audio.trigger("loadstart");

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(false);
      });
    });

    it("handles error by setting isLoaded to false", async () => {
      const { result } = renderHook(() => useAudio());
      const audio = getLatestAudio();

      // First load
      audio.trigger("canplay");
      await waitFor(() => expect(result.current.isLoaded).toBe(true));

      // Error occurs
      audio.simulateError(new Error("Network error"));

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(false);
      });
    });

    it("logs error message when audio fails to load", async () => {
      renderHook(() => useAudio());
      const audio = getLatestAudio();

      const error = new Error("Network error");
      audio.simulateError(error);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          "Error loading audio:",
          expect.any(Event),
        );
      });
    });
  });

  describe("Playback control", () => {
    it("play() starts playback when audio is loaded", async () => {
      const { result } = renderHook(() => useAudio());
      const audio = getLatestAudio();

      audio.simulateLoad();
      await waitFor(() => expect(result.current.isLoaded).toBe(true));

      await result.current.play();

      await waitFor(() => {
        expect(result.current.isPlaying).toBe(true);
        expect(result.current.hasUserInteracted).toBe(true);
      });
    });

    it("play() does nothing when audio is not loaded", async () => {
      const { result } = renderHook(() => useAudio());

      expect(result.current.isLoaded).toBe(false);

      await result.current.play();

      expect(result.current.isPlaying).toBe(false);
      expect(result.current.hasUserInteracted).toBe(false);
    });

    it("play() does nothing when audio is already playing", async () => {
      const { result } = renderHook(() => useAudio());
      const audio = getLatestAudio();

      audio.simulateLoad();
      await waitFor(() => expect(result.current.isLoaded).toBe(true));

      // Start playing
      await result.current.play();
      await waitFor(() => expect(result.current.isPlaying).toBe(true));

      // Try to play again
      const playSpy = vi.spyOn(audio, "play");
      await result.current.play();

      // Audio.play() should not be called again
      expect(playSpy).not.toHaveBeenCalled();
    });

    it("pause() stops playback when playing", async () => {
      const { result } = renderHook(() => useAudio());
      const audio = getLatestAudio();

      audio.simulateLoad();
      await waitFor(() => expect(result.current.isLoaded).toBe(true));

      await result.current.play();
      await waitFor(() => expect(result.current.isPlaying).toBe(true));

      result.current.pause();

      await waitFor(() => {
        expect(result.current.isPlaying).toBe(false);
      });
    });

    it("pause() does nothing when not playing", async () => {
      const { result } = renderHook(() => useAudio());
      const audio = getLatestAudio();

      audio.simulateLoad();
      await waitFor(() => expect(result.current.isLoaded).toBe(true));

      const pauseSpy = vi.spyOn(audio, "pause");
      result.current.pause();

      // Audio.pause() should not be called
      expect(pauseSpy).not.toHaveBeenCalled();
    });

    it("toggle() starts playback when paused", async () => {
      const { result } = renderHook(() => useAudio());
      const audio = getLatestAudio();

      audio.simulateLoad();
      await waitFor(() => expect(result.current.isLoaded).toBe(true));

      result.current.toggle();

      await waitFor(() => {
        expect(result.current.isPlaying).toBe(true);
      });
    });

    it("toggle() stops playback when playing", async () => {
      const { result } = renderHook(() => useAudio());
      const audio = getLatestAudio();

      audio.simulateLoad();
      await waitFor(() => expect(result.current.isLoaded).toBe(true));

      await result.current.play();
      await waitFor(() => expect(result.current.isPlaying).toBe(true));

      result.current.toggle();

      await waitFor(() => {
        expect(result.current.isPlaying).toBe(false);
      });
    });
  });

  describe("Volume control", () => {
    it("setVolume() changes audio volume", async () => {
      const { result } = renderHook(() => useAudio());
      const audio = getLatestAudio();

      result.current.setVolume(0.7);

      await waitFor(() => {
        expect(audio.volume).toBe(0.7);
      });
    });

    it("setVolume() clamps volume below 0 to 0", async () => {
      const { result } = renderHook(() => useAudio());
      const audio = getLatestAudio();

      result.current.setVolume(-0.5);

      await waitFor(() => {
        expect(audio.volume).toBe(0);
      });
    });

    it("setVolume() clamps volume above 1 to 1", async () => {
      const { result } = renderHook(() => useAudio());
      const audio = getLatestAudio();

      result.current.setVolume(1.5);

      await waitFor(() => {
        expect(audio.volume).toBe(1);
      });
    });
  });

  describe("Audio events", () => {
    it("sets isPlaying when play event fires", async () => {
      const { result } = renderHook(() => useAudio());
      const audio = getLatestAudio();

      audio.simulateLoad();
      await waitFor(() => expect(result.current.isLoaded).toBe(true));

      audio.trigger("play");

      await waitFor(() => {
        expect(result.current.isPlaying).toBe(true);
        expect(result.current.hasUserInteracted).toBe(true);
      });
    });

    it("sets isPlaying to false when pause event fires", async () => {
      const { result } = renderHook(() => useAudio());
      const audio = getLatestAudio();

      audio.simulateLoad();
      await waitFor(() => expect(result.current.isLoaded).toBe(true));

      audio.trigger("play");
      await waitFor(() => expect(result.current.isPlaying).toBe(true));

      audio.trigger("pause");

      await waitFor(() => {
        expect(result.current.isPlaying).toBe(false);
      });
    });

    it("sets isPlaying to false when audio ends", async () => {
      const { result } = renderHook(() => useAudio());
      const audio = getLatestAudio();

      audio.simulateLoad();
      await waitFor(() => expect(result.current.isLoaded).toBe(true));

      audio.trigger("play");
      await waitFor(() => expect(result.current.isPlaying).toBe(true));

      audio.simulateEnd();

      await waitFor(() => {
        expect(result.current.isPlaying).toBe(false);
      });
    });
  });

  describe("Error handling", () => {
    it("handles play() errors gracefully", async () => {
      const { result } = renderHook(() => useAudio());
      const audio = getLatestAudio();

      audio.simulateLoad();
      await waitFor(() => expect(result.current.isLoaded).toBe(true));

      // Make play() throw error
      const playError = new Error("Playback failed");
      vi.spyOn(audio, "play").mockRejectedValueOnce(playError);

      await result.current.play();

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          "Error playing audio:",
          playError,
        );
        expect(result.current.isLoaded).toBe(false);
        expect(result.current.isPlaying).toBe(false);
      });
    });
  });

  describe("Cleanup", () => {
    it("removes event listeners on unmount", () => {
      const { unmount } = renderHook(() => useAudio());
      const audio = getLatestAudio();

      const removeEventListenerSpy = vi.spyOn(audio, "removeEventListener");

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "canplay",
        expect.any(Function),
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "canplaythrough",
        expect.any(Function),
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "ended",
        expect.any(Function),
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "error",
        expect.any(Function),
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "play",
        expect.any(Function),
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "pause",
        expect.any(Function),
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "loadstart",
        expect.any(Function),
      );
    });

    it("pauses audio on unmount", () => {
      const { unmount } = renderHook(() => useAudio());
      const audio = getLatestAudio();

      const pauseSpy = vi.spyOn(audio, "pause");

      unmount();

      expect(pauseSpy).toHaveBeenCalled();
    });

    it("clears audio src on unmount", () => {
      const { unmount } = renderHook(() => useAudio());
      const audio = getLatestAudio();

      unmount();

      expect(audio.src).toBe("");
    });
  });

  describe("Re-initialization", () => {
    it("recreates audio when src changes", () => {
      const { rerender } = renderHook(({ src }) => useAudio({ src }), {
        initialProps: { src: "/audio1.mp3" },
      });

      expect(getLatestAudio().src).toBe("/audio1.mp3");
      expect(mockAudioInstances).toHaveLength(1);

      // Change src
      rerender({ src: "/audio2.mp3" });

      // New Audio instance created
      expect(mockAudioInstances).toHaveLength(2);
      expect(getLatestAudio().src).toBe("/audio2.mp3");
    });

    it("recreates audio when loop changes", () => {
      const { rerender } = renderHook(({ loop }) => useAudio({ loop }), {
        initialProps: { loop: true },
      });

      expect(getLatestAudio().loop).toBe(true);
      expect(mockAudioInstances).toHaveLength(1);

      rerender({ loop: false });

      expect(mockAudioInstances).toHaveLength(2);
      expect(getLatestAudio().loop).toBe(false);
    });

    it("recreates audio when volume changes", () => {
      const { rerender } = renderHook(({ volume }) => useAudio({ volume }), {
        initialProps: { volume: 0.5 },
      });

      expect(getLatestAudio().volume).toBe(0.5);
      expect(mockAudioInstances).toHaveLength(1);

      rerender({ volume: 0.8 });

      expect(mockAudioInstances).toHaveLength(2);
      expect(getLatestAudio().volume).toBe(0.8);
    });
  });
});
