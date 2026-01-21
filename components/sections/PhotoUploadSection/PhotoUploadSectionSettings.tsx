"use client";

import { Input, Button, Card, CardBody, Switch } from "@heroui/react";
import { useState } from "react";
import { PhotoUploadSectionSettings } from "./PhotoUploadSection.metadata";
import { Save } from "lucide-react";
import {
  SectionSettingsFormProps,
  createSettingsUpdater,
} from "@/types/section-settings-form";

export function PhotoUploadSectionSettingsForm({
  initialSettings,
  onSave,
  onSettingsChange,
}: SectionSettingsFormProps<PhotoUploadSectionSettings>) {
  const [settings, setSettings] = useState<Partial<PhotoUploadSectionSettings>>(
    () => ({
      quoteText: initialSettings.quoteText || "Queremos ver como la pasaste!",
      buttonText: initialSettings.buttonText || "SUBIR FOTOS Y VIDEOS",
      description:
        initialSettings.description || "Subi las fotos y videos desde tu mesa",
      iconUrl: initialSettings.iconUrl || "/icons/fotos.gif",
      uploadUrl: initialSettings.uploadUrl || "",
      hasAlternateBg: initialSettings.hasAlternateBg ?? false,
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
      await onSave(settings as PhotoUploadSectionSettings);
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
          {/* Upload URL */}
          <Input
            label="URL de Subida de Fotos"
            description="URL donde los invitados pueden subir fotos y videos"
            placeholder="https://ejemplo.com/subir-fotos"
            type="url"
            value={settings.uploadUrl || ""}
            onChange={(e) =>
              updateSettings((prev) => ({ ...prev, uploadUrl: e.target.value }))
            }
          />

          {/* Quote Text */}
          <Input
            label="Frase Destacada"
            description="Texto decorativo al inicio"
            placeholder="Queremos ver como la pasaste!"
            value={settings.quoteText || ""}
            onChange={(e) =>
              updateSettings((prev) => ({ ...prev, quoteText: e.target.value }))
            }
          />

          {/* Button Text */}
          <Input
            label="Texto del Botón"
            description="Texto que aparece en el botón de subir fotos"
            placeholder="SUBIR FOTOS Y VIDEOS"
            value={settings.buttonText || ""}
            onChange={(e) =>
              updateSettings((prev) => ({
                ...prev,
                buttonText: e.target.value,
              }))
            }
          />

          {/* Description */}
          <Input
            label="Descripción"
            description="Texto adicional debajo del botón"
            placeholder="Subi las fotos y videos desde tu mesa"
            value={settings.description || ""}
            onChange={(e) =>
              updateSettings((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
          />

          {/* Icon URL */}
          <Input
            label="URL del Ícono"
            description="Ruta o URL del ícono animado"
            placeholder="/icons/fotos.gif"
            value={settings.iconUrl || ""}
            onChange={(e) =>
              updateSettings((prev) => ({ ...prev, iconUrl: e.target.value }))
            }
          />

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
