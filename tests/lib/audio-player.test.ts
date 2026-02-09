import { describe, it, expect } from "vitest";
import {
  getInitialState,
  getAudioStatus,
  canPlay,
  canPause,
  clampVolume,
  handleLoaded,
  handleLoadStart,
  handlePlay,
  handlePause,
  handleEnded,
  handleError,
  AudioPlayerStates,
  type AudioPlayerState,
} from "@/lib/audio-player";

describe("audio-player", () => {
  describe("getInitialState", () => {
    it("returns initial idle state", () => {
      const state = getInitialState();

      expect(state).toEqual({
        isPlaying: false,
        isLoaded: false,
        hasUserInteracted: false,
      });
    });
  });

  describe("getAudioStatus", () => {
    it("returns LOADING when not loaded", () => {
      const state: AudioPlayerState = {
        isPlaying: false,
        isLoaded: false,
        hasUserInteracted: false,
      };

      expect(getAudioStatus(state)).toBe(AudioPlayerStates.LOADING);
    });

    it("returns PLAYING when playing", () => {
      const state: AudioPlayerState = {
        isPlaying: true,
        isLoaded: true,
        hasUserInteracted: true,
      };

      expect(getAudioStatus(state)).toBe(AudioPlayerStates.PLAYING);
    });

    it("returns PAUSED when loaded, not playing, and user has interacted", () => {
      const state: AudioPlayerState = {
        isPlaying: false,
        isLoaded: true,
        hasUserInteracted: true,
      };

      expect(getAudioStatus(state)).toBe(AudioPlayerStates.PAUSED);
    });

    it("returns READY when loaded, not playing, and user has not interacted", () => {
      const state: AudioPlayerState = {
        isPlaying: false,
        isLoaded: true,
        hasUserInteracted: false,
      };

      expect(getAudioStatus(state)).toBe(AudioPlayerStates.READY);
    });
  });

  describe("canPlay", () => {
    it("returns true when loaded and not playing", () => {
      const state: AudioPlayerState = {
        isPlaying: false,
        isLoaded: true,
        hasUserInteracted: false,
      };

      expect(canPlay(state)).toBe(true);
    });

    it("returns false when not loaded", () => {
      const state: AudioPlayerState = {
        isPlaying: false,
        isLoaded: false,
        hasUserInteracted: false,
      };

      expect(canPlay(state)).toBe(false);
    });

    it("returns false when already playing", () => {
      const state: AudioPlayerState = {
        isPlaying: true,
        isLoaded: true,
        hasUserInteracted: true,
      };

      expect(canPlay(state)).toBe(false);
    });
  });

  describe("canPause", () => {
    it("returns true when playing", () => {
      const state: AudioPlayerState = {
        isPlaying: true,
        isLoaded: true,
        hasUserInteracted: true,
      };

      expect(canPause(state)).toBe(true);
    });

    it("returns false when not playing", () => {
      const state: AudioPlayerState = {
        isPlaying: false,
        isLoaded: true,
        hasUserInteracted: false,
      };

      expect(canPause(state)).toBe(false);
    });
  });

  describe("clampVolume", () => {
    it("clamps volume below 0 to 0", () => {
      expect(clampVolume(-0.5)).toBe(0);
      expect(clampVolume(-100)).toBe(0);
    });

    it("clamps volume above 1 to 1", () => {
      expect(clampVolume(1.5)).toBe(1);
      expect(clampVolume(100)).toBe(1);
    });

    it("returns volume unchanged when in valid range", () => {
      expect(clampVolume(0)).toBe(0);
      expect(clampVolume(0.5)).toBe(0.5);
      expect(clampVolume(1)).toBe(1);
    });
  });

  describe("handleLoaded", () => {
    it("sets isLoaded to true", () => {
      const state: AudioPlayerState = {
        isPlaying: false,
        isLoaded: false,
        hasUserInteracted: false,
      };

      const newState = handleLoaded(state);

      expect(newState.isLoaded).toBe(true);
      expect(newState.isPlaying).toBe(false);
      expect(newState.hasUserInteracted).toBe(false);
    });

    it("preserves other state properties", () => {
      const state: AudioPlayerState = {
        isPlaying: true,
        isLoaded: false,
        hasUserInteracted: true,
      };

      const newState = handleLoaded(state);

      expect(newState.isPlaying).toBe(true);
      expect(newState.hasUserInteracted).toBe(true);
    });
  });

  describe("handleLoadStart", () => {
    it("sets isLoaded to false", () => {
      const state: AudioPlayerState = {
        isPlaying: false,
        isLoaded: true,
        hasUserInteracted: false,
      };

      const newState = handleLoadStart(state);

      expect(newState.isLoaded).toBe(false);
      expect(newState.isPlaying).toBe(false);
      expect(newState.hasUserInteracted).toBe(false);
    });
  });

  describe("handlePlay", () => {
    it("sets isPlaying to true and hasUserInteracted to true", () => {
      const state: AudioPlayerState = {
        isPlaying: false,
        isLoaded: true,
        hasUserInteracted: false,
      };

      const newState = handlePlay(state);

      expect(newState.isPlaying).toBe(true);
      expect(newState.hasUserInteracted).toBe(true);
      expect(newState.isLoaded).toBe(true);
    });

    it("keeps hasUserInteracted true if already true", () => {
      const state: AudioPlayerState = {
        isPlaying: false,
        isLoaded: true,
        hasUserInteracted: true,
      };

      const newState = handlePlay(state);

      expect(newState.hasUserInteracted).toBe(true);
    });
  });

  describe("handlePause", () => {
    it("sets isPlaying to false", () => {
      const state: AudioPlayerState = {
        isPlaying: true,
        isLoaded: true,
        hasUserInteracted: true,
      };

      const newState = handlePause(state);

      expect(newState.isPlaying).toBe(false);
      expect(newState.isLoaded).toBe(true);
      expect(newState.hasUserInteracted).toBe(true);
    });
  });

  describe("handleEnded", () => {
    it("sets isPlaying to false when audio ends", () => {
      const state: AudioPlayerState = {
        isPlaying: true,
        isLoaded: true,
        hasUserInteracted: true,
      };

      const newState = handleEnded(state);

      expect(newState.isPlaying).toBe(false);
      expect(newState.isLoaded).toBe(true);
      expect(newState.hasUserInteracted).toBe(true);
    });
  });

  describe("handleError", () => {
    it("resets isLoaded and isPlaying on error", () => {
      const state: AudioPlayerState = {
        isPlaying: true,
        isLoaded: true,
        hasUserInteracted: true,
      };

      const newState = handleError(state);

      expect(newState.isLoaded).toBe(false);
      expect(newState.isPlaying).toBe(false);
      expect(newState.hasUserInteracted).toBe(true); // Preserved
    });

    it("preserves hasUserInteracted flag", () => {
      const state: AudioPlayerState = {
        isPlaying: false,
        isLoaded: false,
        hasUserInteracted: true,
      };

      const newState = handleError(state);

      expect(newState.hasUserInteracted).toBe(true);
    });
  });

  describe("State immutability", () => {
    it("handlePlay does not mutate original state", () => {
      const state: AudioPlayerState = {
        isPlaying: false,
        isLoaded: true,
        hasUserInteracted: false,
      };

      const original = { ...state };
      handlePlay(state);

      expect(state).toEqual(original);
    });

    it("handlePause does not mutate original state", () => {
      const state: AudioPlayerState = {
        isPlaying: true,
        isLoaded: true,
        hasUserInteracted: true,
      };

      const original = { ...state };
      handlePause(state);

      expect(state).toEqual(original);
    });

    it("handleError does not mutate original state", () => {
      const state: AudioPlayerState = {
        isPlaying: true,
        isLoaded: true,
        hasUserInteracted: true,
      };

      const original = { ...state };
      handleError(state);

      expect(state).toEqual(original);
    });
  });
});
