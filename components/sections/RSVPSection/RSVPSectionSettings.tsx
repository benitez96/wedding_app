"use client";

import type { FormEvent } from "react";
import { Switch } from "@heroui/switch";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { useState } from "react";
import { RSVPSectionSettings } from "./RSVPSection.metadata";
import { Save } from "lucide-react";
import {
  SectionSettingsFormProps,
  createSettingsUpdater,
} from "@/types/section-settings-form";
import { DecorationSettingsCard } from "@/components/ui/DecorationSettingsCard";
import { DecorationSvg, DecorationPattern } from "@/types/decoration";
import FeedbackMessage, { MessageTypes } from "@/components/ui/FeedbackMessage";

export function RSVPSectionSettingsForm({
  initialSettings,
  onSave,
  onSettingsChange,
}: SectionSettingsFormProps<RSVPSectionSettings>) {
  const [settings, setSettings] = useState<Partial<RSVPSectionSettings>>(
    () => ({
      showForm: initialSettings.showForm ?? true,
      hasAlternateBg: initialSettings.hasAlternateBg ?? false,
      // Decoraciones
      decorationSvg: initialSettings.decorationSvg || "none",
      decorationPattern: initialSettings.decorationPattern || "none",
      decorationOpacity: initialSettings.decorationOpacity ?? 10,
      decorationSize: initialSettings.decorationSize ?? 60,
    }),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const updateSettings = createSettingsUpdater(setSettings, onSettingsChange);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      await onSave(settings as RSVPSectionSettings);
      setMessage("Cambios guardados correctamente");
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage("Error al guardar los cambios");
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mensaje de feedback */}
      {message && (
        <FeedbackMessage
          type={
            message.includes("Error")
              ? MessageTypes.ERROR
              : MessageTypes.SUCCESS
          }
          message={message}
        />
      )}

      <Card>
        <CardBody className="space-y-4">
          {/* Switch para mostrar formulario */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Mostrar Formulario RSVP</p>
              <p className="text-xs text-gray-600">
                Habilitar o deshabilitar el formulario de confirmación
              </p>
            </div>
            <Switch
              isSelected={settings.showForm}
              onValueChange={(val) =>
                updateSettings((prev) => ({ ...prev, showForm: val }))
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
