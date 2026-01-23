"use client";

import { Input, Switch, Button, Card, CardBody } from "@heroui/react";
import { useState } from "react";
import { CeremonySectionSettings } from "./CeremonySection.metadata";
import { Save } from "lucide-react";
import {
  SectionSettingsFormProps,
  createSettingsUpdater,
} from "@/types/section-settings-form";
import { DecorationSettingsCard } from "@/components/ui/DecorationSettingsCard";
import { DecorationSvg, DecorationPattern } from "@/types/decoration";
import { SectionIconSelector } from "@/components/ui/SectionIconSelector";
import { SectionIcon } from "@/types/section-icon";

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
      icon: initialSettings.icon || "rings-1",
      showDirectionsButton: initialSettings.showDirectionsButton ?? true,
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

          <SectionIconSelector
            value={(settings.icon || "rings-1") as SectionIcon}
            onChange={(value) =>
              updateSettings((prev) => ({ ...prev, icon: value }))
            }
            label="Ícono de la Sección"
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
