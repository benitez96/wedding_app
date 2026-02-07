"use client";

import Divider from "./Divider";

interface AnimatedDividerCSSProps {
  variant?: "simple" | "heart" | "ornate" | "elegant";
  delay?: number;
  className?: string;
  hasAlternateBg?: boolean;
}

/**
 * CSS-only animated divider (no Framer Motion dependency)
 * Uses CSS animations for better performance and smaller bundle size
 */
export default function AnimatedDividerCSS({
  variant = "heart",
  delay = 0,
  className = "",
  hasAlternateBg = false,
}: AnimatedDividerCSSProps) {
  return (
    <div
      className="animate-fade-in-scale"
      style={{
        animationDelay: `${delay}s`,
        opacity: 0,
        animationFillMode: "forwards",
      }}
    >
      <Divider
        variant={variant}
        className={className}
        hasAlternateBg={hasAlternateBg}
      />
    </div>
  );
}
