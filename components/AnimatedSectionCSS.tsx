import { ReactNode } from "react";

interface AnimatedSectionCSSProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

/**
 * Server Component - Zero JS bundle impact
 * Uses CSS animations + Intersection Observer via CSS `animation-timeline`
 * Fallback: elementos visibles sin animación en browsers sin soporte
 */
export default function AnimatedSectionCSS({
  children,
  delay = 0,
  className = "",
}: AnimatedSectionCSSProps) {
  // Convertir delay en ms para CSS
  const delayMs = Math.round(delay * 1000);

  return (
    <div
      className={`animate-fade-in-up ${className}`}
      style={{
        animationDelay: `${delayMs}ms`,
      }}
    >
      {children}
    </div>
  );
}
