"use client";

import type { FormEvent } from "react";
import { Input } from "@heroui/input";
import { Switch } from "@heroui/switch";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { useState } from "react";
import { DateSectionSettings } from "./DateSection.metadata";
import { Save } from "lucide-react";
import {
  SectionSettingsFormProps,
  createSettingsUpdater,
} from "@/types/section-settings-form";
import { DecorationSettingsCard } from "@/components/ui/DecorationSettingsCard";
import { DecorationSvg, DecorationPattern } from "@/types/decoration";
import { useToastFeedback } from "@/hooks/useToastFeedback";

export function DateSectionSettingsForm({
  initialSettings,
  onSave,
  onSettingsChange,
}: SectionSettingsFormProps<DateSectionSettings>) {
  const [settings, setSettings] = useState<Partial<DateSectionSettings>>(
    () => ({
      titleText: initialSettings.titleText || "Te esperamos el día",
      showCountdown: initialSettings.showCountdown ?? true,
      weddingDateTime: initialSettings.weddingDateTime || "",
      hasAlternateBg: initialSettings.hasAlternateBg ?? false,
      // Decoraciones
      decorationSvg: initialSettings.decorationSvg || "none",
      decorationPattern: initialSettings.decorationPattern || "none",
      decorationOpacity: initialSettings.decorationOpacity ?? 10,
      decorationSize: initialSettings.decorationSize ?? 60,
    }),
  );
  const [isSaving, setIsSaving] = useState(false);
  const { toastSuccess, toastError } = useToastFeedback();

  const updateSettings = createSettingsUpdater(setSettings, onSettingsChange);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await onSave(settings as DateSectionSettings);
      toastSuccess("Cambios guardados correctamente");
    } catch {
      toastError("Error al guardar los cambios");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardBody className="space-y-4">
          {/* Fecha y hora del evento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha y Hora del Evento
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Fecha y hora que se mostrará en la invitación
            </p>
            <input
              type="datetime-local"
              value={settings.weddingDateTime || ""}
              onChange={(e) =>
                updateSettings((prev) => ({
                  ...prev,
                  weddingDateTime: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-default-200 rounded-medium bg-default-50 hover:bg-default-100 focus:bg-default-100 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <Input
            label="Texto del Título"
            description="Texto que aparece sobre la fecha"
            placeholder="Te esperamos el día"
            value={settings.titleText || ""}
            onChange={(e) =>
              updateSettings((prev) => ({ ...prev, titleText: e.target.value }))
            }
          />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Mostrar Countdown</p>
              <p className="text-xs text-gray-600">
                Mostrar contador regresivo
              </p>
            </div>
            <Switch
              isSelected={settings.showCountdown}
              onValueChange={(val) =>
                updateSettings((prev) => ({ ...prev, showCountdown: val }))
              }
              color="success"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Background de Color</p>
              <p className="text-xs text-gray-600">
                Aplicar color de fondo a esta sección
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

      {/* 🌸 Card de Decoraciones */}
      <DecorationSettingsCard
        decorationSvg={settings.decorationSvg as DecorationSvg}
        decorationPattern={settings.decorationPattern as DecorationPattern}
        decorationOpacity={settings.decorationOpacity ?? 10}
        decorationSize={settings.decorationSize ?? 60}
        onDecorationSvgChange={(value) =>
          updateSettings((prev) => ({ ...prev, decorationSvg: value }))
        }
        onDecorationPatternChange={(value) =>
          updateSettings((prev) => ({ ...prev, decorationPattern: value }))
        }
        onDecorationOpacityChange={(value) =>
          updateSettings((prev) => ({ ...prev, decorationOpacity: value }))
        }
        onDecorationSizeChange={(value) =>
          updateSettings((prev) => ({ ...prev, decorationSize: value }))
        }
      />

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
