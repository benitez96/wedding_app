"use client";

import { DecorationPreviewProps } from "@/types/decoration";
import { DecorationLayer } from "./DecorationLayer";
import { Card, CardBody } from "@heroui/react";

/**
 * Preview visual del patrón de decoración seleccionado
 * Se muestra en el formulario de configuración
 */
export function DecorationPreview({
  svg,
  pattern,
  opacity,
  size,
}: DecorationPreviewProps) {
  if (svg === "none" || pattern === "none") {
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
          >
            <div className="h-40 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
              <p className="text-sm text-gray-600 font-medium">
                Contenido de ejemplo
              </p>
            </div>
          </DecorationLayer>
        </CardBody>
      </Card>
    </div>
  );
}
