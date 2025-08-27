'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@heroui/button';
import { Play, Pause } from 'lucide-react';
import { useAudio } from '@/hooks/useAudio';

interface HeroMusicButtonProps {
  className?: string;
  audioSrc?: string;
}

export default function HeroMusicButton({ 
  className = '',
  audioSrc = '/audio/background-music-2.mp3'
}: HeroMusicButtonProps) {
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
      const scrollThreshold = 100;
      const heroSectionHeight = 400;

      // Si se hace scroll hacia arriba o se está en la primera sección, mostrar el botón
      if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }
      // Si se hace scroll hacia abajo, ocultar el botón
      else if (currentScrollY > lastScrollY && currentScrollY > scrollThreshold) {
        setIsVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleToggle = () => {
    toggle();
    setIsVisible(isPlaying);
    
  };

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 25,
            duration: 0.8 
          }}
          className={`fixed top-6 right-6 z-50 ${className}`}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative"
          >
            <Button
              onClick={handleToggle}
              color="primary"
              variant="solid"
              size="sm"
              startContent={
                <motion.div
                  transition={{ duration: 2, repeat: isPlaying ? Infinity : 0, ease: "linear" }}
                >
                  {!isLoaded ? (
                    <Play className="w-5 h-5 animate-pulse" />
                  ) : isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                </motion.div>
              }
              className="
                bg-gradient-to-r from-primary-500 to-accent-500
                text-white font-medium
                shadow-lg hover:shadow-xl
                backdrop-blur-sm
                border border-primary-400/20
                cursor-pointer
                relative z-10
              "
            >
              {!isLoaded ? 'Cargando...' : isPlaying ? 'Pausar' : 'Reproducir'}
            </Button>
            
            {/* Efecto de ondas cuando está reproduciendo */}
            {isPlaying && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-accent-300/30 pointer-events-none"
                animate={{ scale: [1, 1.2], opacity: [0.4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                style={{ zIndex: -1 }}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
