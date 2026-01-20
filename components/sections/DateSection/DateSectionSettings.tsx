"use client";

import { Input, Switch, Button, Card, CardBody } from "@heroui/react";
import { useState } from "react";
import { DateSectionSettings } from "./DateSection.metadata";
import { Save } from "lucide-react";
import {
  SectionSettingsFormProps,
  createSettingsUpdater,
} from "@/types/section-settings-form";

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
    }),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const updateSettings = createSettingsUpdater(setSettings, onSettingsChange);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      await onSave(settings as DateSectionSettings);
      setMessage("Cambios guardados correctamente");
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage("Error al guardar los cambios");
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div
          className={
            message.includes("Error")
              ? "p-3 bg-danger-50 text-danger-700 border border-danger-200 rounded-lg"
              : "p-3 bg-success-50 text-success-700 border border-success-200 rounded-lg"
          }
        >
          {message}
        </div>
      )}

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
