"use client";

import dynamic from "next/dynamic";
import { ReactNode } from "react";

// Lazy load AnimatedSection with Framer Motion
const AnimatedSection = dynamic(() => import("./AnimatedSection"), {
  ssr: false,
  loading: () => null, // No loading state to avoid layout shift
});

interface AnimatedSectionLazyProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

/**
 * Lazy-loaded wrapper for AnimatedSection
 * Use this for below-fold content to reduce initial bundle size
 * For above-fold content, consider using CSS animations instead
 */
export default function AnimatedSectionLazy({
  children,
  delay = 0,
  className = "",
}: AnimatedSectionLazyProps) {
  return (
    <AnimatedSection delay={delay} className={className}>
      {children}
    </AnimatedSection>
  );
}
