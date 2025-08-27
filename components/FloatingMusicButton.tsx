'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '@/hooks/useAudio';

interface FloatingMusicButtonProps {
  className?: string;
  audioSrc?: string;
}

export default function FloatingMusicButton({ 
  className = '',
  audioSrc = '/audio/background-music.mp3'
}: FloatingMusicButtonProps) {
  const { isPlaying, isLoaded, toggle } = useAudio({ 
    src: audioSrc, 
    loop: true, 
    volume: 0.3 
  });
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollThreshold = 100; // Umbral para mostrar/ocultar
      const heroSectionHeight = 400; // Altura aproximada de la primera sección

      // Ocultar al hacer scroll hacia abajo
      if (currentScrollY > lastScrollY && currentScrollY > scrollThreshold) {
        setIsVisible(false);
      }
      // Mostrar al hacer scroll hacia arriba o estar en la primera sección
      else if (currentScrollY < lastScrollY || currentScrollY < heroSectionHeight) {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const toggleMusic = () => {
    toggle();
  };

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 25,
            duration: 0.8 
          }}
          onClick={toggleMusic}
          className={`
            fixed top-6 right-6 z-50
            w-14 h-14 rounded-full
            bg-gradient-to-br from-primary-500 to-accent-500
            shadow-lg hover:shadow-xl
            transition-all duration-300
            flex items-center justify-center
            group
            backdrop-blur-sm
            ${className}
          `}
          whileHover={{ 
            scale: 1.1,
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            animate={{ rotate: isPlaying ? 360 : 0 }}
            transition={{ duration: 2, repeat: isPlaying ? Infinity : 0, ease: "linear" }}
            className="text-white text-xl relative"
          >
            {!isLoaded ? (
              <svg 
                className="w-6 h-6 animate-pulse" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" 
                  clipRule="evenodd" 
                />
              </svg>
            ) : isPlaying ? (
              <svg 
                className="w-6 h-6" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path 
                  fillRule="evenodd" 
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" 
                  clipRule="evenodd" 
                />
              </svg>
            ) : (
              <svg 
                className="w-6 h-6" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" 
                  clipRule="evenodd" 
                />
              </svg>
            )}
          </motion.div>
          
          {/* Efecto de ondas cuando está reproduciendo */}
          {isPlaying && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-accent-300/50"
                animate={{ scale: [1, 1.3], opacity: [0.6, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-primary-300/40"
                animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
              />
            </>
          )}
        </motion.button>
      )}
    </AnimatePresence>
  );
}
