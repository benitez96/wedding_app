"use client";

import { Card, CardBody } from "@heroui/card";
import { Select, SelectItem } from "@heroui/select";
import { Slider } from "@heroui/slider";
import {
  DecorationSvg,
  DecorationPattern,
  DecorationPatterns,
} from "@/types/decoration";
import { getPatternLabel } from "@/lib/decoration-patterns";
import { DecorationSvgSelector } from "./DecorationSvgSelector";

export interface DecorationSettingsCardProps {
  decorationSvg: DecorationSvg;
  decorationPattern: DecorationPattern;
  decorationOpacity: number;
  decorationSize: number;
  onDecorationSvgChange: (value: DecorationSvg) => void;
  onDecorationPatternChange: (value: DecorationPattern) => void;
  onDecorationOpacityChange: (value: number) => void;
  onDecorationSizeChange: (value: number) => void;
}

/**
 * Componente reutilizable para los controles de decoraciones
 * Usado en todos los formularios de settings de secciones
 */
export function DecorationSettingsCard({
  decorationSvg,
  decorationPattern,
  decorationOpacity,
  decorationSize,
  onDecorationSvgChange,
  onDecorationPatternChange,
  onDecorationOpacityChange,
  onDecorationSizeChange,
}: DecorationSettingsCardProps) {
  return (
    <Card>
      <CardBody className="space-y-4">
        <h3 className="text-lg font-semibold">🌸 Decoraciones</h3>

        {/* Selector de SVG con cards visuales */}
        <DecorationSvgSelector
          value={decorationSvg}
          onChange={onDecorationSvgChange}
        />

        {/* Controles adicionales solo si hay SVG seleccionado */}
        {decorationSvg !== "none" && (
          <>
            {/* Select Pattern */}
            <Select
              label="Patrón de Repetición"
              description="Elegí cómo se distribuyen los elementos"
              selectedKeys={[decorationPattern || "none"]}
              onChange={(e) =>
                onDecorationPatternChange(e.target.value as DecorationPattern)
              }
            >
              {Object.values(DecorationPatterns).map((pattern) => (
                <SelectItem key={pattern}>
                  {getPatternLabel(pattern)}
                </SelectItem>
              ))}
            </Select>

            {/* Slider Opacidad */}
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium">Opacidad</label>
                <span className="text-sm text-gray-600">
                  {decorationOpacity}%
                </span>
              </div>
              <Slider
                size="sm"
                step={5}
                maxValue={100}
                minValue={0}
                value={decorationOpacity}
                onChange={(value) =>
                  onDecorationOpacityChange(
                    Array.isArray(value) ? value[0] : value,
                  )
                }
                marks={[
                  { value: 0, label: "0%" },
                  { value: 50, label: "50%" },
                  { value: 100, label: "100%" },
                ]}
                className="max-w-full"
              />
            </div>

            {/* Slider Tamaño */}
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium">
                  Tamaño del elemento
                </label>
                <span className="text-sm text-gray-600">
                  {decorationSize}px
                </span>
              </div>
              <Slider
                size="sm"
                step={10}
                maxValue={200}
                minValue={20}
                value={decorationSize}
                onChange={(value) =>
                  onDecorationSizeChange(
                    Array.isArray(value) ? value[0] : value,
                  )
                }
                marks={[
                  { value: 40, label: "Pequeño" },
                  { value: 80, label: "Medio" },
                  { value: 120, label: "Grande" },
                ]}
                className="max-w-full"
              />
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
}
