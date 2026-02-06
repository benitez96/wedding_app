"use client";

import type { FormEvent } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Switch } from "@heroui/switch";
import { useState } from "react";
import { PhotoUploadSectionSettings } from "./PhotoUploadSection.metadata";
import { Save } from "lucide-react";
import {
  SectionSettingsFormProps,
  createSettingsUpdater,
} from "@/types/section-settings-form";
import { DecorationSettingsCard } from "@/components/ui/DecorationSettingsCard";
import { DecorationSvg, DecorationPattern } from "@/types/decoration";
import { SectionIconSelector } from "@/components/ui/SectionIconSelector";
import { SectionIcon } from "@/types/section-icon";
import FeedbackMessage, { MessageTypes } from "@/components/ui/FeedbackMessage";

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
      icon: initialSettings.icon || "photos-1",
      uploadUrl: initialSettings.uploadUrl || "",
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

  const handleSubmit = async (e: FormEvent) => {
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
        <FeedbackMessage
          type={
            message.includes("Error")
              ? MessageTypes.ERROR
              : MessageTypes.SUCCESS
          }
          message={message}
        />
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

          {/* Selector de Ícono */}
          <SectionIconSelector
            value={(settings.icon || "photos-1") as SectionIcon}
            onChange={(value) =>
              updateSettings((prev) => ({ ...prev, icon: value }))
            }
            label="Ícono de la Sección"
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
