"use client";

import { Input, Switch, Button, Card, CardBody } from "@heroui/react";
import { useState } from "react";
import { HeroSectionSettings } from "./HeroSection.metadata";
import { Save } from "lucide-react";
import {
  SectionSettingsFormProps,
  createSettingsUpdater,
  useInitialSettingsSync,
} from "@/types/section-settings-form";

export function HeroSectionSettingsForm({
  initialSettings,
  onSave,
  onSettingsChange,
}: SectionSettingsFormProps<HeroSectionSettings>) {
  const [settings, setSettings] = useState<Partial<HeroSectionSettings>>(
    () => ({
      imageUrl: initialSettings.imageUrl || "/logo-2.jpeg",
      title: initialSettings.title || "NUESTRA BODA",
      showScrollIndicator: initialSettings.showScrollIndicator ?? true,
    }),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Notificar el estado inicial al preview
  useInitialSettingsSync(settings, onSettingsChange);

  // Usar el helper para actualizar settings y notificar cambios
  const updateSettings = createSettingsUpdater(setSettings, onSettingsChange);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      await onSave(settings as HeroSectionSettings);
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
          {/* URL de imagen */}
          <Input
            label="URL de la Imagen"
            description="Ruta o URL de la imagen principal"
            placeholder="/logo-2.jpeg"
            value={settings.imageUrl || ""}
            onChange={(e) =>
              updateSettings((prev) => ({ ...prev, imageUrl: e.target.value }))
            }
          />

          {/* Título */}
          <Input
            label="Título"
            description="Texto que aparece sobre la imagen"
            placeholder="NUESTRA BODA"
            value={settings.title || ""}
            onChange={(e) =>
              updateSettings((prev) => ({ ...prev, title: e.target.value }))
            }
          />

          {/* Switch para scroll indicator */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Indicador de Scroll</p>
              <p className="text-xs text-gray-600">
                Mostrar flecha animada para indicar scroll
              </p>
            </div>
            <Switch
              isSelected={settings.showScrollIndicator}
              onValueChange={(val) =>
                updateSettings((prev) => ({
                  ...prev,
                  showScrollIndicator: val,
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
