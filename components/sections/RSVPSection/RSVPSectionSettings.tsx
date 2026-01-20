"use client";

import { Switch, Button, Card, CardBody } from "@heroui/react";
import { useState } from "react";
import { RSVPSectionSettings } from "./RSVPSection.metadata";
import { Save } from "lucide-react";
import {
  SectionSettingsFormProps,
  createSettingsUpdater,
} from "@/types/section-settings-form";

export function RSVPSectionSettingsForm({
  initialSettings,
  onSave,
  onSettingsChange,
}: SectionSettingsFormProps<RSVPSectionSettings>) {
  const [settings, setSettings] = useState<Partial<RSVPSectionSettings>>(
    () => ({
      showForm: initialSettings.showForm ?? true,
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
      await onSave(settings as RSVPSectionSettings);
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
          {/* Switch para mostrar formulario */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Mostrar Formulario RSVP</p>
              <p className="text-xs text-gray-600">
                Habilitar o deshabilitar el formulario de confirmación
              </p>
            </div>
            <Switch
              isSelected={settings.showForm}
              onValueChange={(val) =>
                updateSettings((prev) => ({ ...prev, showForm: val }))
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
