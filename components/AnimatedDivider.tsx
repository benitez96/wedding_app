'use client';

import { motion } from 'framer-motion';
import Divider from './Divider';

interface AnimatedDividerProps {
  variant?: 'simple' | 'heart' | 'ornate' | 'elegant';
  delay?: number;
  className?: string;
}

export default function AnimatedDivider({ variant = 'heart', delay = 0, className = "" }: AnimatedDividerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ 
        duration: 0.6, 
        delay: delay,
        ease: "easeOut"
      }}
    >
      <Divider variant={variant} className={className} />
    </motion.div>
  );
}
