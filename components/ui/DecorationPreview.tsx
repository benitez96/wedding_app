"use client";

import { Card, CardBody } from "@heroui/card";
import { DecorationLayer } from "./DecorationLayer";
import { DecorationPreviewProps } from "@/types/decoration";

/**
 * Preview visual del patrón de decoración seleccionado
 * Se muestra en el formulario de configuración
 */
export function DecorationPreview({
  svg,
  pattern,
  opacity,
  size,
  hasAlternateBg = false,
}: DecorationPreviewProps) {
  if (svg === "none") {
    return (
      <Card className="w-full">
        <CardBody className="h-32 flex items-center justify-center">
          <p className="text-sm text-gray-500">Sin decoración seleccionada</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Vista Previa</p>
      <Card className="w-full overflow-hidden">
        <CardBody className="p-0">
          <DecorationLayer
            svg={svg}
            pattern={pattern}
            opacity={opacity}
            size={Math.max(20, size * 0.4)} // Escalar el tamaño para el preview
            hasAlternateBg={hasAlternateBg}
          >
            <div
              className={`h-40 flex items-center justify-center relative ${
                hasAlternateBg
                  ? "text-secondary-foreground"
                  : "bg-gradient-to-br from-gray-50 to-gray-100"
              }`}
            >
              {/* Background layer si hasAlternateBg */}
              {hasAlternateBg ? (
                <div className="absolute inset-0 -z-10 bg-secondary" />
              ) : null}
              <p
                className={`text-sm font-medium relative z-10 ${
                  hasAlternateBg ? "text-secondary-foreground" : "text-gray-600"
                }`}
              >
                Contenido de ejemplo
              </p>
            </div>
          </DecorationLayer>
        </CardBody>
      </Card>
    </div>
  );
}
