import Image from "next/image";
import { Ban } from "lucide-react";
import {
  SectionIcon,
  getSectionIconConfig,
  SectionIconTypes,
} from "@/types/section-icon";
import { cn } from "@heroui/react";

interface UseSectionIconOptions {
  icon: SectionIcon;
  size?: number; // Tamaño en píxeles (default: 100)
  className?: string;
  alt?: string;
}

/**
 * Hook que devuelve el componente del ícono listo para renderizar
 */
export function useSectionIcon({
  icon,
  size = 100,
  className,
  alt = "Section icon",
}: UseSectionIconOptions) {
  const config = getSectionIconConfig(icon);

  // Si no hay config o es "none", retornar null o un placeholder
  if (!config || icon === "none" || !config.path) {
    return {
      IconComponent: null,
      config: null,
    };
  }

  const isGif = config.type === SectionIconTypes.GIF;

  const IconComponent = (
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
        unoptimized={isGif} // No optimizar GIFs
      />
    </div>
  );

  return {
    IconComponent,
    config,
  };
}
