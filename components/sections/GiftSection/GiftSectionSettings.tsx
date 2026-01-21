"use client";

import { Input, Button, Card, CardBody, Textarea, Switch } from "@heroui/react";
import { useState } from "react";
import { GiftSectionSettings } from "./GiftSection.metadata";
import { Save } from "lucide-react";
import {
  SectionSettingsFormProps,
  createSettingsUpdater,
} from "@/types/section-settings-form";

export function GiftSectionSettingsForm({
  initialSettings,
  onSave,
  onSettingsChange,
}: SectionSettingsFormProps<GiftSectionSettings>) {
  const [settings, setSettings] = useState<Partial<GiftSectionSettings>>(
    () => ({
      title: initialSettings.title || "REGALOS",
      description:
        initialSettings.description ||
        "Tu compañía es el mejor regalo, pero si deseás ayudarnos…",
      alias: initialSettings.alias || "DANI.SOL.HONEYMOON",
      footerText:
        initialSettings.footerText || "Ayudanos con nuestra luna de miel",
      iconUrl: initialSettings.iconUrl || "/icons/regalo-2.gif",
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
      await onSave(settings as GiftSectionSettings);
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
            placeholder="REGALOS"
            value={settings.title || ""}
            onChange={(e) =>
              updateSettings((prev) => ({ ...prev, title: e.target.value }))
            }
          />

          {/* Description */}
          <Textarea
            label="Descripción"
            description="Mensaje introductorio"
            placeholder="Tu compañía es el mejor regalo, pero si deseás ayudarnos…"
            value={settings.description || ""}
            onChange={(e) =>
              updateSettings((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            minRows={2}
          />

          {/* Alias */}
          <Input
            label="Alias Bancario"
            description="CBU o alias para transferencias"
            placeholder="DANI.SOL.HONEYMOON"
            value={settings.alias || ""}
            onChange={(e) =>
              updateSettings((prev) => ({ ...prev, alias: e.target.value }))
            }
          />

          {/* Footer Text */}
          <Input
            label="Texto al Pie"
            description="Texto final debajo del alias"
            placeholder="Ayudanos con nuestra luna de miel"
            value={settings.footerText || ""}
            onChange={(e) =>
              updateSettings((prev) => ({
                ...prev,
                footerText: e.target.value,
              }))
            }
          />

          {/* Icon URL */}
          <Input
            label="URL del Ícono"
            description="Ruta o URL del ícono animado"
            placeholder="/icons/regalo-2.gif"
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
