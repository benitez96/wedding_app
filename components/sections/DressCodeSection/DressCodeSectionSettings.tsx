"use client";

import { Input, Switch, Button, Card, CardBody } from "@heroui/react";
import { useState } from "react";
import { DressCodeSectionSettings } from "./DressCodeSection.metadata";
import { Save } from "lucide-react";
import {
  SectionSettingsFormProps,
  createSettingsUpdater,
} from "@/types/section-settings-form";

export function DressCodeSectionSettingsForm({
  initialSettings,
  onSave,
  onSettingsChange,
}: SectionSettingsFormProps<DressCodeSectionSettings>) {
  const [settings, setSettings] = useState<Partial<DressCodeSectionSettings>>(
    () => ({
      dressCode: initialSettings.dressCode || "Formal",
      subtitle: initialSettings.subtitle || "(No blanco)",
      showColorSuggestions: initialSettings.showColorSuggestions ?? true,
      iconUrl: initialSettings.iconUrl || "/icons/dress-code.gif",
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
      await onSave(settings as DressCodeSectionSettings);
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
          {/* Dress Code */}
          <Input
            label="Código de Vestimenta"
            description="Ej: Formal, Semi-formal, Casual"
            placeholder="Formal"
            value={settings.dressCode || ""}
            onChange={(e) =>
              updateSettings((prev) => ({ ...prev, dressCode: e.target.value }))
            }
          />

          {/* Subtitle */}
          <Input
            label="Subtítulo"
            description="Texto adicional debajo del dress code"
            placeholder="(No blanco)"
            value={settings.subtitle || ""}
            onChange={(e) =>
              updateSettings((prev) => ({ ...prev, subtitle: e.target.value }))
            }
          />

          {/* Icon URL */}
          <Input
            label="URL del Ícono"
            description="Ruta o URL del ícono animado"
            placeholder="/icons/dress-code.gif"
            value={settings.iconUrl || ""}
            onChange={(e) =>
              updateSettings((prev) => ({ ...prev, iconUrl: e.target.value }))
            }
          />

          {/* Switch para color suggestions */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                Mostrar Sugerencias de Color
              </p>
              <p className="text-xs text-gray-600">
                Mostrar paleta de colores sugeridos
              </p>
            </div>
            <Switch
              isSelected={settings.showColorSuggestions}
              onValueChange={(val) =>
                updateSettings((prev) => ({
                  ...prev,
                  showColorSuggestions: val,
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
