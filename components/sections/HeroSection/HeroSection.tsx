import { ChevronDown } from "lucide-react";
import { Section } from "@/components/section";
import Image from "next/image";
import {
  HeroSectionSettings,
  TEXT_COLORS,
  LAYOUT_MODES,
} from "./HeroSection.metadata";

interface HeroSectionProps {
  settings?: HeroSectionSettings;
}

export default function HeroSection({ settings }: HeroSectionProps) {
  const imageUrl = settings?.imageUrl || "/logo-2.jpeg";
  const title = settings?.title || "NUESTRA BODA";
  const showScrollIndicator = settings?.showScrollIndicator ?? true;
  const enableOverlay = settings?.enableOverlay ?? false;
  const enableFadeEffect = settings?.enableFadeEffect ?? false;
  const textColor = settings?.textColor || TEXT_COLORS.BLACK;
  const layoutMode = settings?.layoutMode || LAYOUT_MODES.OVERLAY;
  const mediaType = settings?.mediaType || "image";

  // ✅ Validar que la URL sea válida (evita crash mientras se tipea)
  const isValidUrl = (url: string): boolean => {
    if (!url || url.trim() === "") return false;
    // URLs relativas son válidas
    if (url.startsWith("/")) return true;
    // Validar URLs absolutas
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const hasValidMedia = isValidUrl(imageUrl);

  // Estilos del fade effect que se aplican a imagen y overlay
  const fadeStyles = enableFadeEffect
    ? {
        maskImage:
          "radial-gradient(ellipse 100% 60% at 50% 40%, black 60%, transparent 100%)",
        WebkitMaskImage:
          "radial-gradient(ellipse 100% 60% at 50% 40%, black 60%, transparent 100%)",
      }
    : undefined;

  // Layout Overlay: texto superpuesto sobre imagen (contenedor h-[100dvh])
  if (layoutMode === LAYOUT_MODES.OVERLAY) {
    return (
      <div className="relative h-[100dvh]" style={fadeStyles}>
        <Section.Container className="animate-fade-in relative !p-0 h-full overflow-hidden">
          {/* Media (imagen o video) */}
          <div className="absolute inset-0 w-full h-full">
            {!hasValidMedia ? (
              // Placeholder cuando no hay media válida
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <p className="text-gray-500 text-sm">
                  Ingresá una URL válida o subí una imagen/video
                </p>
              </div>
            ) : mediaType === "video" ? (
              <video
                src={imageUrl}
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                poster="/logo-2.jpeg"
                className="w-full h-full object-cover"
              >
                Tu navegador no soporta videos
              </video>
            ) : (
              <Image
                src={imageUrl}
                alt="Hero"
                width={600}
                height={800}
                priority
                className="w-full h-full object-fit"
              />
            )}
          </div>

          {/* Overlay oscuro opcional - cubre TODO el Section.Container */}
          {enableOverlay && (
            <div
              className="absolute inset-0 w-full h-full pointer-events-none z-[5]"
              style={{
                background:
                  "linear-gradient(0deg, rgba(0,0,0,0.5), rgba(0,0,0,0.15))",
              }}
            />
          )}

          {/* Contenido - absolute al fondo del contenedor */}
          <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col items-center gap-2 pb-4">
            <h2
              className={`text-3xl md:text-4xl drop-shadow-lg px-4 ${
                textColor === TEXT_COLORS.WHITE ? "text-white" : "text-black"
              }`}
            >
              {title}
            </h2>
            {showScrollIndicator && (
              <ChevronDown
                className={`h-10 w-10 animate-bounce drop-shadow-lg ${
                  textColor === TEXT_COLORS.WHITE ? "text-white" : "text-black"
                }`}
              />
            )}
          </div>
        </Section.Container>
      </div>
    );
  }

  // Layout Stacked: imagen arriba, texto abajo (apilado)
  return (
    <div className="relative overflow-hidden" style={fadeStyles}>
      <Section.Container className="animate-fade-in relative !p-0">
        {/* Media (imagen o video) */}
        <div className="relative w-full">
          {!hasValidMedia ? (
            // Placeholder cuando no hay media válida
            <div className="w-full h-[calc(100dvh-120px)] bg-gray-200 flex items-center justify-center">
              <p className="text-gray-500 text-sm">
                Ingresá una URL válida o subí una imagen/video
              </p>
            </div>
          ) : mediaType === "video" ? (
            <video
              src={imageUrl}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              poster="/logo-2.jpeg"
              className="w-full h-[calc(100dvh-120px)] object-cover"
            >
              Tu navegador no soporta videos
            </video>
          ) : (
            <Image
              src={imageUrl}
              alt="Hero"
              width={600}
              height={800}
              priority
              className="w-full h-[calc(100dvh-120px)] object-fit"
            />
          )}
        </div>

        {/* Overlay oscuro opcional - cubre TODO el Section.Container */}
        {enableOverlay && (
          <div
            className="absolute inset-0 w-full h-full pointer-events-none z-[5]"
            style={{
              background:
                "linear-gradient(0deg, rgba(0,0,0,0.5), rgba(0,0,0,0.15))",
            }}
          />
        )}

        {/* Contenido - debajo de la imagen (apilado) */}
        <h2
          className={`text-3xl md:text-4xl drop-shadow-lg relative z-10 px-4 ${
            textColor === TEXT_COLORS.WHITE ? "text-white" : "text-black"
          }`}
        >
          {title}
        </h2>
        {showScrollIndicator && (
          <ChevronDown
            className={`h-10 w-10 animate-bounce drop-shadow-lg relative z-10 mb-4 ${
              textColor === TEXT_COLORS.WHITE ? "text-white" : "text-black"
            }`}
          />
        )}
      </Section.Container>
    </div>
  );
}
