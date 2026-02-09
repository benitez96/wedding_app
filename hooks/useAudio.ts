import { useState, useRef, useEffect } from "react";
import {
  getInitialState,
  handleLoaded,
  handleLoadStart,
  handlePlay,
  handlePause,
  handleEnded,
  handleError,
  canPlay as canPlayState,
  canPause as canPauseState,
  clampVolume,
} from "@/lib/audio-player";

interface UseAudioProps {
  src?: string;
  loop?: boolean;
  volume?: number;
}

/**
 * Hook for managing audio playback with state management
 *
 * Uses pure state management functions from lib/audio-player.ts
 * for testability and separation of concerns.
 *
 * @example
 * ```tsx
 * function MusicPlayer() {
 *   const { isPlaying, toggle } = useAudio({ src: '/music.mp3' });
 *   return <button onClick={toggle}>{isPlaying ? 'Pause' : 'Play'}</button>;
 * }
 * ```
 */
export function useAudio({
  src = "/audio/background-music.mp3",
  loop = true,
  volume = 0.5,
}: UseAudioProps = {}) {
  const [state, setState] = useState(getInitialState);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element
    audioRef.current = new Audio(src);
    audioRef.current.loop = loop;
    audioRef.current.volume = volume;
    audioRef.current.preload = "metadata";

    // Event listeners
    const audio = audioRef.current;

    const onCanPlay = () => setState((prev) => handleLoaded(prev));
    const onEnded = () => setState((prev) => handleEnded(prev));
    const onError = (e: Event) => {
      console.error("Error loading audio:", e);
      setState((prev) => handleError(prev));
    };

    // Sync playback state events
    const onPlay = () => setState((prev) => handlePlay(prev));
    const onPause = () => setState((prev) => handlePause(prev));
    const onLoadStart = () => setState((prev) => handleLoadStart(prev));
    const onCanPlayThrough = () => setState((prev) => handleLoaded(prev));

    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("canplaythrough", onCanPlayThrough);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("loadstart", onLoadStart);

    return () => {
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("canplaythrough", onCanPlayThrough);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("loadstart", onLoadStart);
      audio.pause();
      audio.src = "";
    };
  }, [src, loop, volume]);

  const play = async () => {
    if (!audioRef.current || !canPlayState(state)) return;

    try {
      // Check if audio is already playing
      if (audioRef.current.paused) {
        await audioRef.current.play();
        // Don't set state here, 'play' event will handle it
      }
    } catch (error) {
      console.error("Error playing audio:", error);
      setState((prev) => handleError(prev));
    }
  };

  const pause = () => {
    if (!audioRef.current || !canPauseState(state)) return;

    // Check if audio is playing before pausing
    if (!audioRef.current.paused) {
      audioRef.current.pause();
      // Don't set state here, 'pause' event will handle it
    }
  };

  const toggle = () => {
    if (!audioRef.current) return;

    if (audioRef.current.paused) {
      play();
    } else {
      pause();
    }
  };

  const setVolume = (newVolume: number) => {
    if (!audioRef.current) return;

    const clampedVolume = clampVolume(newVolume);
    audioRef.current.volume = clampedVolume;
  };

  return {
    isPlaying: state.isPlaying,
    isLoaded: state.isLoaded,
    hasUserInteracted: state.hasUserInteracted,
    play,
    pause,
    toggle,
    setVolume,
    audio: audioRef.current,
  };
}
