"use client";

import Image from "next/image";
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
  pattern = "none",
  opacity = 10,
  size = 60,
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

    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    // Medición inicial
    updateDimensions();

    // Observer para cambios de tamaño
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [isMounted]);

  // Si no hay decoración, solo renderiza children
  if (svg === "none" || pattern === "none") {
    return <>{children}</>;
  }

  const svgPath = `/tramas/svgs/${svg}.svg`;
  const opacityDecimal = opacity / 100;

  // Patrón especial: TILED usa background-image CSS
  if (pattern === DecorationPatterns.TILED) {
    return (
      <div ref={containerRef} className="relative" suppressHydrationWarning>
        {/* Background tiled pattern (solo después de montar) */}
        {isMounted && (
          <div
            className="absolute inset-0 pointer-events-none text-accent"
            style={{
              backgroundImage: `url(${svgPath})`,
              backgroundRepeat: "repeat",
              backgroundSize: `${size}px ${size}px`,
              opacity: opacityDecimal,
              color: "var(--color-accent)",
            }}
          />
        )}
        {/* Contenido */}
        <div className="relative z-10">{children}</div>
      </div>
    );
  }

  // Resto de patrones: posicionamiento absoluto múltiple con cálculo dinámico
  // Solo calcular posiciones si está montado y tenemos dimensiones
  const positions =
    isMounted && dimensions.width > 0 && dimensions.height > 0
      ? getPatternPositions(pattern, {
          containerHeight: dimensions.height,
          containerWidth: dimensions.width,
          elementSize: size,
        })
      : [];

  return (
    <div ref={containerRef} className="relative" suppressHydrationWarning>
      {/* Elementos decorativos posicionados (solo después de montar) */}
      {isMounted &&
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
              className="absolute pointer-events-none text-accent"
              style={{
                top: pos.top,
                bottom: pos.bottom,
                left: pos.left,
                right: pos.right,
                width: size,
                height: size,
                opacity: opacityDecimal,
                transform,
                color: "var(--color-accent)",
              }}
            >
              <Image
                src={svgPath}
                alt=""
                width={size}
                height={size}
                className="w-full h-full"
                style={{ color: "inherit" }}
              />
            </div>
          );
        })}

      {/* Contenido */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
