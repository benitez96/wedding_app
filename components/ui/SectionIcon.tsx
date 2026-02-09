import Image from "next/image";
import { cn } from "@heroui/theme";
import {
  SectionIcon as SectionIconType,
  getSectionIconConfig,
  SectionIconTypes,
} from "@/types/section-icon";

interface SectionIconProps {
  icon: SectionIconType;
  size?: number; // Size in pixels (default: 100)
  className?: string;
  alt?: string;
}

/**
 * Component that renders a section icon (GIF, SVG, or animated SVG)
 *
 * Returns null if icon is "none" or invalid, making it safe to use
 * without conditional rendering.
 *
 * @example
 * ```tsx
 * <Section.Icon>
 *   <SectionIcon icon="rings-1" size={100} alt="Wedding rings" />
 * </Section.Icon>
 * ```
 */
export function SectionIcon({
  icon,
  size = 100,
  className,
  alt = "Section icon",
}: SectionIconProps) {
  const config = getSectionIconConfig(icon);

  // Return null if no config, icon is "none", or no path
  if (!config || icon === "none" || !config.path) {
    return null;
  }

  const isGif = config.type === SectionIconTypes.GIF;

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <Image
        src={config.path}
        alt={alt}
        width={size}
        height={size}
        className={cn(
          "object-contain",
          config.animationClass && config.animationClass,
        )}
        unoptimized={isGif} // Don't optimize GIFs
      />
    </div>
  );
}
