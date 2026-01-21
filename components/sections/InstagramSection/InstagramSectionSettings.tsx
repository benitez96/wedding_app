"use client";

import { Input, Button, Card, CardBody, Textarea, Switch } from "@heroui/react";
import { useState } from "react";
import { InstagramSectionSettings } from "./InstagramSection.metadata";
import { Save } from "lucide-react";
import {
  SectionSettingsFormProps,
  createSettingsUpdater,
} from "@/types/section-settings-form";

export function InstagramSectionSettingsForm({
  initialSettings,
  onSave,
  onSettingsChange,
}: SectionSettingsFormProps<InstagramSectionSettings>) {
  const [settings, setSettings] = useState<Partial<InstagramSectionSettings>>(
    () => ({
      quoteText: initialSettings.quoteText || "Si hay foto, hay historia!",
      instagramHandle: initialSettings.instagramHandle || "@wedding_danysol",
      instagramUrl:
        initialSettings.instagramUrl ||
        "https://www.instagram.com/wedding_danysol",
      description:
        initialSettings.description ||
        "Seguinos en nuestra cuenta de instagram y etiquetanos en tus fotos y videos!",
      iconUrl: initialSettings.iconUrl || "/icons/instagram.gif",
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
      await onSave(settings as InstagramSectionSettings);
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
          {/* Quote Text */}
          <Input
            label="Frase Destacada"
            description="Texto decorativo al inicio"
            placeholder="Si hay foto, hay historia!"
            value={settings.quoteText || ""}
            onChange={(e) =>
              updateSettings((prev) => ({ ...prev, quoteText: e.target.value }))
            }
          />

          {/* Instagram Handle */}
          <Input
            label="Usuario de Instagram"
            description="Handle de Instagram (con @)"
            placeholder="@wedding_danysol"
            value={settings.instagramHandle || ""}
            onChange={(e) =>
              updateSettings((prev) => ({
                ...prev,
                instagramHandle: e.target.value,
              }))
            }
          />

          {/* Instagram URL */}
          <Input
            label="URL de Instagram"
            description="Link completo al perfil de Instagram"
            placeholder="https://www.instagram.com/wedding_danysol"
            value={settings.instagramUrl || ""}
            onChange={(e) =>
              updateSettings((prev) => ({
                ...prev,
                instagramUrl: e.target.value,
              }))
            }
          />

          {/* Description */}
          <Textarea
            label="Descripción"
            description="Texto adicional debajo del botón"
            placeholder="Seguinos en nuestra cuenta de instagram y etiquetanos en tus fotos y videos!"
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
            placeholder="/icons/instagram.gif"
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
