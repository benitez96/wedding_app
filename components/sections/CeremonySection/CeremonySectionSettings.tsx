"use client";

import { Input, Switch, Button, Card, CardBody } from "@heroui/react";
import { useState } from "react";
import { CeremonySectionSettings } from "./CeremonySection.metadata";
import { Save } from "lucide-react";
import {
  SectionSettingsFormProps,
  createSettingsUpdater,
} from "@/types/section-settings-form";

export function CeremonySectionSettingsForm({
  initialSettings,
  onSave,
  onSettingsChange,
}: SectionSettingsFormProps<CeremonySectionSettings>) {
  const [settings, setSettings] = useState<Partial<CeremonySectionSettings>>(
    () => ({
      time: initialSettings.time || "19:30hs",
      venueName:
        initialSettings.venueName || "Iglesia Nuestra Señora del Carmen",
      mapsUrl:
        initialSettings.mapsUrl || "https://maps.app.goo.gl/pwTwQ4vJzbBt1h1C9",
      iconUrl: initialSettings.iconUrl || "/icons/anillos-boda-1.gif",
      showDirectionsButton: initialSettings.showDirectionsButton ?? true,
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
      await onSave(settings as CeremonySectionSettings);
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
          <Input
            label="Hora"
            placeholder="19:30hs"
            value={settings.time || ""}
            onChange={(e) =>
              updateSettings((prev) => ({ ...prev, time: e.target.value }))
            }
          />

          <Input
            label="Lugar"
            placeholder="Iglesia Nuestra Señora del Carmen"
            value={settings.venueName || ""}
            onChange={(e) =>
              updateSettings((prev) => ({ ...prev, venueName: e.target.value }))
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
            placeholder="/icons/anillos-boda-1.gif"
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
                Mostrar botón "Llegar a la Ceremonia"
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
