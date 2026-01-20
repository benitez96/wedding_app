"use client";

import { Input, Switch, Button, Card, CardBody, Textarea } from "@heroui/react";
import { useState } from "react";
import { CelebrationSectionSettings } from "./CelebrationSection.metadata";
import { Save } from "lucide-react";
import {
  SectionSettingsFormProps,
  createSettingsUpdater,
} from "@/types/section-settings-form";

export function CelebrationSectionSettingsForm({
  initialSettings,
  onSave,
  onSettingsChange,
}: SectionSettingsFormProps<CelebrationSectionSettings>) {
  const [settings, setSettings] = useState<Partial<CelebrationSectionSettings>>(
    () => ({
      description:
        initialSettings.description ||
        "Despues de la Ceremonia festejaremos en el Club Union",
      mapsUrl:
        initialSettings.mapsUrl || "https://maps.app.goo.gl/AjTWBW7Y25sENdw36",
      iconUrl: initialSettings.iconUrl || "/icons/copas-fiesta-1.gif",
      showDirectionsButton: initialSettings.showDirectionsButton ?? true,
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
      await onSave(settings as CelebrationSectionSettings);
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
          <Textarea
            label="Descripción"
            placeholder="Despues de la Ceremonia festejaremos..."
            value={settings.description || ""}
            onChange={(e) =>
              updateSettings((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
          />

          <Input
            label="URL de Google Maps"
            placeholder="https://maps.app.goo.gl/..."
            value={settings.mapsUrl || ""}
            onChange={(e) =>
              updateSettings((prev) => ({ ...prev, mapsUrl: e.target.value }))
            }
          />

          <Input
            label="URL del Ícono"
            placeholder="/icons/copas-fiesta-1.gif"
            value={settings.iconUrl || ""}
            onChange={(e) =>
              updateSettings((prev) => ({ ...prev, iconUrl: e.target.value }))
            }
          />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                Mostrar Botón de Direcciones
              </p>
              <p className="text-xs text-gray-600">
                Mostrar botón "Llegar a la Celebración"
              </p>
            </div>
            <Switch
              isSelected={settings.showDirectionsButton}
              onValueChange={(val) =>
                updateSettings((prev) => ({
                  ...prev,
                  showDirectionsButton: val,
                }))
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
