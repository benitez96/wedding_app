import { useState, useRef, useEffect } from 'react';

interface UseAudioProps {
  src?: string;
  loop?: boolean;
  volume?: number;
}

export function useAudio({ 
  src = '/audio/background-music.mp3', 
  loop = true, 
  volume = 0.5 
}: UseAudioProps = {}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Crear el elemento de audio
    audioRef.current = new Audio(src);
    audioRef.current.loop = loop;
    audioRef.current.volume = volume;
    audioRef.current.preload = 'metadata';

    // Event listeners
    const audio = audioRef.current;
    
    const handleCanPlay = () => setIsLoaded(true);
    const handleEnded = () => setIsPlaying(false);
    const handleError = (e: Event) => {
      console.error('Error loading audio:', e);
      setIsLoaded(false);
    };
    
    // Eventos para sincronizar el estado de reproducción
    const handlePlay = () => {
      setIsPlaying(true);
      setHasUserInteracted(true);
    };
    const handlePause = () => setIsPlaying(false);
    const handleLoadStart = () => setIsLoaded(false);
    const handleCanPlayThrough = () => setIsLoaded(true);

    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('loadstart', handleLoadStart);

    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.pause();
      audio.src = '';
    };
  }, [src, loop, volume]);

  const play = async () => {
    if (!audioRef.current || !isLoaded) return;
    
    try {
      // Verificar si el audio ya está reproduciéndose
      if (audioRef.current.paused) {
        await audioRef.current.play();
        // No establecer setIsPlaying aquí, el evento 'play' lo hará
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  const pause = () => {
    if (!audioRef.current) return;
    
    // Verificar si el audio está reproduciéndose antes de pausar
    if (!audioRef.current.paused) {
      audioRef.current.pause();
      // No establecer setIsPlaying aquí, el evento 'pause' lo hará
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
    
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    audioRef.current.volume = clampedVolume;
  };

  return {
    isPlaying,
    isLoaded,
    hasUserInteracted,
    play,
    pause,
    toggle,
    setVolume,
    audio: audioRef.current
  };
}
