"use client";

import type { FormEvent } from "react";
import { Input } from "@heroui/input";
import { Switch } from "@heroui/switch";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { useState } from "react";
import { QuoteSectionSettings } from "./QuoteSection.metadata";
import { Save } from "lucide-react";
import {
  SectionSettingsFormProps,
  createSettingsUpdater,
} from "@/types/section-settings-form";
import { DecorationSettingsCard } from "@/components/ui/DecorationSettingsCard";
import { DecorationSvg, DecorationPattern } from "@/types/decoration";
import { useToastFeedback } from "@/hooks/useToastFeedback";

export function QuoteSectionSettingsForm({
  initialSettings,
  onSave,
  onSettingsChange,
}: SectionSettingsFormProps<QuoteSectionSettings>) {
  const [settings, setSettings] = useState<Partial<QuoteSectionSettings>>(
    () => ({
      quoteText:
        initialSettings.quoteText ||
        "El amor nos unió, y queremos compartir nuestra felicidad con vos.",
      showQuote: initialSettings.showQuote ?? true,
      hasAlternateBg: initialSettings.hasAlternateBg ?? true,
      // Decoraciones
      decorationSvg: initialSettings.decorationSvg || "none",
      decorationPattern: initialSettings.decorationPattern || "none",
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
      await onSave(settings as QuoteSectionSettings);
      toastSuccess("Cambios guardados correctamente");
    } catch (error) {
      toastError("Error al guardar los cambios");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardBody className="space-y-4">
          {/* Texto de la frase */}
          <Input
            label="Frase o Cita"
            description="Texto que se mostrará en esta sección"
            placeholder="El amor nos unió..."
            value={settings.quoteText || ""}
            onChange={(e) =>
              updateSettings((prev) => ({ ...prev, quoteText: e.target.value }))
            }
          />

          {/* Switch para mostrar/ocultar */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Mostrar Frase</p>
              <p className="text-xs text-gray-600">
                Habilitar o deshabilitar esta sección
              </p>
            </div>
            <Switch
              isSelected={settings.showQuote}
              onValueChange={(val) =>
                updateSettings((prev) => ({ ...prev, showQuote: val }))
              }
              color="success"
            />
          </div>

          {/* Switch para background alternativo */}
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
