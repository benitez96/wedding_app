"use client";

import { Input, Textarea } from "@heroui/input";
import { Button } from "@heroui/button";
import { Switch } from "@heroui/switch";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { useState } from "react";
import { GiftSectionSettings } from "./GiftSection.metadata";
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
      icon: initialSettings.icon || "gift-2",
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
        <FeedbackMessage
          type={message.includes("Error") ? MessageTypes.ERROR : MessageTypes.SUCCESS}
          message={message}
        />
      )}

      <Accordion variant="splitted" defaultExpandedKeys={["content"]}>
        <AccordionItem
          key="content"
          aria-label="Contenido"
          title="📝 Contenido de la Sección"
        >
          <div className="space-y-4 pb-4">
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

            {/* Selector de Ícono */}
            <SectionIconSelector
              value={(settings.icon || "gift-2") as SectionIcon}
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
          </div>
        </AccordionItem>

        <AccordionItem
          key="decorations"
          aria-label="Decoraciones"
          title="🌸 Decoraciones"
        >
          <div className="pb-4">
            <DecorationSettingsCard
              decorationSvg={settings.decorationSvg as DecorationSvg}
              decorationPattern={
                settings.decorationPattern as DecorationPattern
              }
              decorationOpacity={settings.decorationOpacity ?? 10}
              decorationSize={settings.decorationSize ?? 60}
              onDecorationSvgChange={(value) =>
                updateSettings((prev) => ({ ...prev, decorationSvg: value }))
              }
              onDecorationPatternChange={(value) =>
                updateSettings((prev) => ({
                  ...prev,
                  decorationPattern: value,
                }))
              }
              onDecorationOpacityChange={(value) =>
                updateSettings((prev) => ({
                  ...prev,
                  decorationOpacity: value,
                }))
              }
              onDecorationSizeChange={(value) =>
                updateSettings((prev) => ({ ...prev, decorationSize: value }))
              }
            />
          </div>
        </AccordionItem>
      </Accordion>

      <div className="flex justify-end">
        <Button
          type="submit"
          color="primary"
          startContent={<Save className="w-4 h-4" />}
          isLoading={isSaving}
          isDisabled={isSaving}
        >
          {isSaving ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </form>
  );
}
