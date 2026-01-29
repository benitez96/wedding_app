"use client";

import { Input, Textarea } from "@heroui/input";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Switch } from "@heroui/switch";
import { useState } from "react";
import { InstagramSectionSettings } from "./InstagramSection.metadata";
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
      icon: initialSettings.icon || "instagram",
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
        <FeedbackMessage
          type={message.includes("Error") ? MessageTypes.ERROR : MessageTypes.SUCCESS}
          message={message}
        />
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

          {/* Selector de Ícono */}
          <SectionIconSelector
            value={(settings.icon || "instagram") as SectionIcon}
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
