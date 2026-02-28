"use client";

import type { FormEvent } from "react";
import { Input, Textarea } from "@heroui/input";
import { Switch } from "@heroui/switch";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { useState } from "react";
import { Save } from "lucide-react";
import { CelebrationSectionSettings } from "./CelebrationSection.metadata";
import {
  SectionSettingsFormProps,
  createSettingsUpdater,
} from "@/types/section-settings-form";
import { DecorationSettingsCard } from "@/components/ui/DecorationSettingsCard";
import {
  DecorationSvg,
  DecorationSVGs,
  DecorationPattern,
  DecorationPatterns,
} from "@/types/decoration";
import { SectionIconSelector } from "@/components/ui/SectionIconSelector";
import { SectionIcon } from "@/types/section-icon";
import { useToastFeedback } from "@/hooks/useToastFeedback";

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
      icon: initialSettings.icon || "celebration-1",
      showDirectionsButton: initialSettings.showDirectionsButton ?? true,
      hasAlternateBg: initialSettings.hasAlternateBg ?? false,
      // Decoraciones
      decorationSvg: initialSettings.decorationSvg || DecorationSVGs.NONE,
      decorationPattern:
        initialSettings.decorationPattern || DecorationPatterns.CORNERS,
      decorationOpacity: initialSettings.decorationOpacity ?? 10,
      decorationSize: initialSettings.decorationSize ?? 60,
    }),
  );
  const [isSaving, setIsSaving] = useState(false);
  const { toastSuccess, toastError } = useToastFeedback();

  const updateSettings = createSettingsUpdater(setSettings, onSettingsChange);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await onSave(settings as CelebrationSectionSettings);
      toastSuccess("Cambios guardados correctamente");
    } catch {
      toastError("Error al guardar los cambios");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

          <SectionIconSelector
            value={(settings.icon || "celebration-1") as SectionIcon}
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
