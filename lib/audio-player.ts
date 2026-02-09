/**
 * Audio player state management (pure logic)
 *
 * This module contains pure functions for audio player state management,
 * separated from browser APIs for testability.
 */

export interface AudioPlayerState {
  isPlaying: boolean;
  isLoaded: boolean;
  hasUserInteracted: boolean;
}

export const AudioPlayerStates = {
  IDLE: "idle",
  LOADING: "loading",
  READY: "ready",
  PLAYING: "playing",
  PAUSED: "paused",
  ERROR: "error",
} as const;

export type AudioPlayerStatus =
  (typeof AudioPlayerStates)[keyof typeof AudioPlayerStates];

/**
 * Initial audio player state
 */
export function getInitialState(): AudioPlayerState {
  return {
    isPlaying: false,
    isLoaded: false,
    hasUserInteracted: false,
  };
}

/**
 * Compute audio player status from state
 */
export function getAudioStatus(state: AudioPlayerState): AudioPlayerStatus {
  if (!state.isLoaded) {
    return AudioPlayerStates.LOADING;
  }
  if (state.isPlaying) {
    return AudioPlayerStates.PLAYING;
  }
  if (state.hasUserInteracted) {
    return AudioPlayerStates.PAUSED;
  }
  return AudioPlayerStates.READY;
}

/**
 * Check if audio can play (loaded and not already playing)
 */
export function canPlay(state: AudioPlayerState): boolean {
  return state.isLoaded && !state.isPlaying;
}

/**
 * Check if audio can pause (playing)
 */
export function canPause(state: AudioPlayerState): boolean {
  return state.isPlaying;
}

/**
 * Clamp volume to valid range [0, 1]
 */
export function clampVolume(volume: number): number {
  return Math.max(0, Math.min(1, volume));
}

/**
 * Handle audio loaded event
 */
export function handleLoaded(state: AudioPlayerState): AudioPlayerState {
  return {
    ...state,
    isLoaded: true,
  };
}

/**
 * Handle audio loading start event
 */
export function handleLoadStart(state: AudioPlayerState): AudioPlayerState {
  return {
    ...state,
    isLoaded: false,
  };
}

/**
 * Handle audio play event
 */
export function handlePlay(state: AudioPlayerState): AudioPlayerState {
  return {
    ...state,
    isPlaying: true,
    hasUserInteracted: true,
  };
}

/**
 * Handle audio pause event
 */
export function handlePause(state: AudioPlayerState): AudioPlayerState {
  return {
    ...state,
    isPlaying: false,
  };
}

/**
 * Handle audio ended event (auto-pause)
 */
export function handleEnded(state: AudioPlayerState): AudioPlayerState {
  return {
    ...state,
    isPlaying: false,
  };
}

/**
 * Handle audio error event (reset state)
 */
export function handleError(state: AudioPlayerState): AudioPlayerState {
  return {
    ...state,
    isLoaded: false,
    isPlaying: false,
  };
}
