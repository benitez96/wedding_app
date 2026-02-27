"use client";

import { useState, useEffect, useRef } from "react";
import { DecorationLayerProps, DecorationPatterns } from "@/types/decoration";
import { getPatternPositions } from "@/lib/decoration-patterns";

/**
 * Componente que aplica decoraciones SVG con diferentes patrones de repetición
 * Envuelve el contenido de una sección agregando elementos decorativos
 * Calcula dinámicamente la cantidad de elementos según el tamaño del contenedor
 */
export function DecorationLayer({
  svg = "none",
  pattern = "corners",
  opacity = 10,
  size = 60,
  hasAlternateBg = false,
  children,
}: DecorationLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isMounted, setIsMounted] = useState(false);

  // Marcar como montado para evitar hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Medir el contenedor cuando se monta y en resize
  useEffect(() => {
    if (!containerRef.current || !isMounted) return;

    const element = containerRef.current;

    const updateDimensions = () => {
      if (element) {
        setDimensions({
          width: element.offsetWidth,
          height: element.offsetHeight,
        });
      }
    };

    // Medición inicial
    updateDimensions();

    // Observer para cambios de tamaño
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(element);

    // ✅ Cleanup garantizado con referencia capturada
    return () => {
      resizeObserver.disconnect();
    };
  }, [isMounted]);

  const svgPath = `/tramas/svgs/${svg}.svg`;
  const opacityDecimal = opacity / 100;

  // Color dinámico: si hasAlternateBg, usamos bg (neutral), sino secondary (brand)
  const decorationColor = hasAlternateBg
    ? "var(--color-background)"
    : "var(--color-secondary)";

  // Si no hay decoración, solo renderiza children sin decoraciones
  const hasDecoration = svg !== "none";

  // Patrón especial: TILED usa background-image CSS
  if (hasDecoration && pattern === DecorationPatterns.TILED) {
    return (
      <div ref={containerRef} className="relative" suppressHydrationWarning>
        {/* Background tiled pattern (solo después de montar) */}
        {/* Contenido */}
        <div className="relative">{children}</div>
        {/* Background tiled pattern (solo después de montar) - z-[5] para estar entre bg y contenido */}
        {isMounted && (
          <div
            className="absolute inset-0 pointer-events-none z-[5]"
            style={{
              backgroundColor: decorationColor,
              maskImage: `url(${svgPath})`,
              WebkitMaskImage: `url(${svgPath})`,
              maskSize: `${size}px ${size}px`,
              WebkitMaskSize: `${size}px ${size}px`,
              maskRepeat: "repeat",
              WebkitMaskRepeat: "repeat",
              opacity: opacityDecimal,
            }}
          />
        )}
      </div>
    );
  }

  // Resto de patrones: posicionamiento absoluto múltiple con cálculo dinámico
  // Solo calcular posiciones si está montado y tenemos dimensiones Y hay decoración activa
  const positions =
    hasDecoration && isMounted && dimensions.width > 0 && dimensions.height > 0
      ? getPatternPositions(pattern, {
          containerHeight: dimensions.height,
          containerWidth: dimensions.width,
          elementSize: size,
        })
      : [];

  return (
    <div ref={containerRef} className="relative" suppressHydrationWarning>
      {/* Contenido */}
      <div className="relative">{children}</div>

      {/* Elementos decorativos posicionados (solo después de montar y si hay decoración) - z-[5] para estar entre bg y contenido */}
      {hasDecoration &&
        isMounted &&
        positions.map((pos, index) => {
          const transforms = [];

          if (pos.rotate !== undefined) {
            transforms.push(`rotate(${pos.rotate}deg)`);
          }

          if (pos.scale !== undefined) {
            transforms.push(`scale(${pos.scale})`);
          }

          // Translate para centrar según el tipo de posicionamiento
          const hasPercentTop =
            typeof pos.top === "string" && pos.top.includes("%");
          const hasPercentLeft =
            typeof pos.left === "string" && pos.left.includes("%");

          if (hasPercentTop && hasPercentLeft) {
            // Ambos son %: centrar en ambas direcciones
            transforms.push("translate(-50%, -50%)");
          } else if (hasPercentTop) {
            // Solo top es %: centrar verticalmente
            transforms.push("translateY(-50%)");
          } else if (hasPercentLeft) {
            // Solo left es %: centrar horizontalmente
            transforms.push("translateX(-50%)");
          }

          const transform =
            transforms.length > 0 ? transforms.join(" ") : undefined;

          return (
            <div
              key={index}
              className="absolute pointer-events-none z-[5]"
              style={{
                top: pos.top,
                bottom: pos.bottom,
                left: pos.left,
                right: pos.right,
                width: size,
                height: size,
                opacity: opacityDecimal,
                transform,
                backgroundColor: decorationColor,
                maskImage: `url(${svgPath})`,
                WebkitMaskImage: `url(${svgPath})`,
                maskSize: "contain",
                WebkitMaskSize: "contain",
                maskRepeat: "no-repeat",
                WebkitMaskRepeat: "no-repeat",
                maskPosition: "center",
                WebkitMaskPosition: "center",
              }}
            />
          );
        })}
    </div>
  );
}
