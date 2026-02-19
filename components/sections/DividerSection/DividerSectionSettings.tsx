"use client";

import type { FormEvent } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Select, SelectItem } from "@heroui/select";
import { Slider } from "@heroui/slider";
import { Switch } from "@heroui/switch";
import { useState } from "react";
import { DividerSectionSettings } from "./DividerSection.metadata";
import { Save } from "lucide-react";
import {
  SectionSettingsFormProps,
  createSettingsUpdater,
} from "@/types/section-settings-form";
import { useToastFeedback } from "@/hooks/useToastFeedback";

const VARIANT_OPTIONS = [
  { key: "simple", label: "Simple" },
  { key: "heart", label: "Corazón" },
  { key: "ornate", label: "Ornamentado" },
  { key: "elegant", label: "Elegante" },
] as const;

export function DividerSectionSettingsForm({
  initialSettings,
  onSave,
  onSettingsChange,
}: SectionSettingsFormProps<DividerSectionSettings>) {
  const [settings, setSettings] = useState<Partial<DividerSectionSettings>>(
    () => ({
      variant: initialSettings.variant || "heart",
      delay: initialSettings.delay ?? 0.2,
      hasAlternateBg: initialSettings.hasAlternateBg ?? false,
    }),
  );
  const [isSaving, setIsSaving] = useState(false);
  const { toastSuccess, toastError } = useToastFeedback();

  const updateSettings = createSettingsUpdater(setSettings, onSettingsChange);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await onSave(settings as DividerSectionSettings);
      toastSuccess("Cambios guardados correctamente");
    } catch (error) {
      toastError("Error al guardar los cambios");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardBody className="space-y-6">
          {/* Variante del divisor */}
          <Select
            label="Estilo del Divisor"
            description="Elige el estilo visual del separador"
            selectedKeys={[settings.variant || "heart"]}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as string;
              updateSettings((prev) => ({
                ...prev,
                variant: selected as DividerSectionSettings["variant"],
              }));
            }}
          >
            {VARIANT_OPTIONS.map((option) => (
              <SelectItem key={option.key}>{option.label}</SelectItem>
            ))}
          </Select>

          {/* Delay de animación */}
          <div className="space-y-2">
            <Slider
              label="Retraso de Animación"
              step={0.1}
              minValue={0}
              maxValue={2}
              value={settings.delay ?? 0.2}
              onChange={(value) =>
                updateSettings((prev) => ({
                  ...prev,
                  delay: typeof value === "number" ? value : 0.2,
                }))
              }
              className="max-w-md"
            />
            <p className="text-xs text-gray-600">
              Tiempo de espera antes de que aparezca el divisor (en segundos)
            </p>
          </div>

          {/* Switch para background alternativo */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Background de Color</p>
              <p className="text-xs text-gray-600">
                Aplicar color de fondo a esta sección separadora
              </p>
            </div>
            <Switch
              isSelected={settings.hasAlternateBg}
              onValueChange={(val) =>
                updateSettings((prev) => ({ ...prev, hasAlternateBg: val }))
              }
              color="success"
            />
          </div>
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <Button
          type="submit"
          color="primary"
          startContent={<Save className="w-4 h-4" />}
          isLoading={isSaving}
          isDisabled={isSaving}
        >
          {isSaving ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>
    </form>
  );
}
