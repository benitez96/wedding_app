"use client";

import { Input, Button, Card, CardBody, Textarea } from "@heroui/react";
import { useState } from "react";
import { AccommodationSectionSettings } from "./AccommodationSection.metadata";
import { Save } from "lucide-react";
import {
  SectionSettingsFormProps,
  createSettingsUpdater,
} from "@/types/section-settings-form";

export function AccommodationSectionSettingsForm({
  initialSettings,
  onSave,
  onSettingsChange,
}: SectionSettingsFormProps<AccommodationSectionSettings>) {
  const [settings, setSettings] = useState<
    Partial<AccommodationSectionSettings>
  >(() => ({
    title: initialSettings.title || "ALOJAMIENTOS",
    description:
      initialSettings.description ||
      "Sabemos que podés venir de lejos, así que te facilitamos algunos teléfonos de alojamientos cercanos",
    iconUrl: initialSettings.iconUrl || "/icons/accommodation.gif",
  }));
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const updateSettings = createSettingsUpdater(setSettings, onSettingsChange);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      await onSave(settings as AccommodationSectionSettings);
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
          {/* Title */}
          <Input
            label="Título"
            description="Título de la sección"
            placeholder="ALOJAMIENTOS"
            value={settings.title || ""}
            onChange={(e) =>
              updateSettings((prev) => ({ ...prev, title: e.target.value }))
            }
          />

          {/* Description */}
          <Textarea
            label="Descripción"
            description="Mensaje introductorio"
            placeholder="Sabemos que podés venir de lejos, así que te facilitamos algunos teléfonos de alojamientos cercanos"
            value={settings.description || ""}
            onChange={(e) =>
              updateSettings((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            minRows={2}
          />

          {/* Icon URL */}
          <Input
            label="URL del Ícono"
            description="Ruta o URL del ícono animado"
            placeholder="/icons/accommodation.gif"
            value={settings.iconUrl || ""}
            onChange={(e) =>
              updateSettings((prev) => ({ ...prev, iconUrl: e.target.value }))
            }
          />
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
