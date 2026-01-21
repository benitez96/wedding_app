"use client";

import { Input, Switch, Button, Card, CardBody } from "@heroui/react";
import { useState } from "react";
import { QuoteSectionSettings } from "./QuoteSection.metadata";
import { Save } from "lucide-react";
import {
  SectionSettingsFormProps,
  createSettingsUpdater,
} from "@/types/section-settings-form";

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
      await onSave(settings as QuoteSectionSettings);
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
