"use client";

import { useActionState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card, CardBody } from "@heroui/card";
import { Save, CheckCircle } from "lucide-react";
import { CONFIGURATION_KEYS } from "@/types/configuration";
import { updateConfigurations } from "@/app/actions/settings";

interface ConfigurationItem {
  id: string;
  key: string;
  value: string;
  description: string | null;
}

interface SettingsFormProps {
  initialConfigurations: ConfigurationItem[];
}

// Helper: Obtener valor de configuración
function getConfigValue(configs: ConfigurationItem[], key: string): string {
  return configs.find((c) => c.key === key)?.value || "";
}

export default function SettingsForm({
  initialConfigurations,
}: SettingsFormProps) {
  // useActionState para manejar el estado del formulario
  const [state, formAction, isPending] = useActionState(
    updateConfigurations,
    null,
  );

  // Obtener valores iniciales (solo lectura, sin estado)
  const photoUploadUrl = getConfigValue(
    initialConfigurations,
    CONFIGURATION_KEYS.PHOTO_UPLOAD_URL,
  );
  const weddingDateTimeISO = getConfigValue(
    initialConfigurations,
    CONFIGURATION_KEYS.WEDDING_DATE,
  );
  const remindRestingDays =
    getConfigValue(
      initialConfigurations,
      CONFIGURATION_KEYS.REMIND_RESTING_DAYS,
    ) || "40";

  // El valor viene en formato datetime-local: "YYYY-MM-DDTHH:mm"
  // Lo usamos directamente sin conversión
  const initialDateTimeLocal = weddingDateTimeISO || "";

  return (
    <form action={formAction} className="space-y-6">
      {/* Mensaje de error */}
      {state?.error ? (
        <div className="p-3 bg-danger-50 border border-danger-200 text-danger-700 rounded-lg">
          {state.error}
        </div>
      ) : null}

      {/* Mensaje de éxito */}
      {state?.success ? (
        <div className="p-3 bg-success-50 border border-success-200 text-success-700 rounded-lg flex items-center gap-2">
          <CheckCircle size={16} />
          {state.message}
        </div>
      ) : null}

      <div className="grid gap-4">
        {/* PHOTO_UPLOAD_URL */}
        <Card>
          <CardBody>
            <Input
              name="photoUploadUrl"
              label="URL de Subida de Fotos"
              description="URL donde los invitados pueden subir fotos y videos"
              defaultValue={photoUploadUrl}
              placeholder="https://ejemplo.com/subir-fotos"
              variant="bordered"
              isDisabled={isPending}
            />
          </CardBody>
        </Card>

        {/* WEDDING_DATE */}
        <Card>
          <CardBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha y Hora de la Boda
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  Fecha y hora de la ceremonia
                </p>
              </div>

              <input
                type="datetime-local"
                name="weddingDateTime"
                defaultValue={initialDateTimeLocal}
                required
                disabled={isPending}
                className="w-full px-3 py-2 border border-default-200 rounded-medium bg-default-50 hover:bg-default-100 focus:bg-default-100 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </CardBody>
        </Card>

        {/* REMIND_RESTING_DAYS */}
        <Card>
          <CardBody>
            <Input
              name="remindRestingDays"
              label="Días de Recordatorio RSVP"
              description="Mostrar recordatorio cuando falten menos de X días (default: 40)"
              defaultValue={remindRestingDays}
              type="number"
              min="1"
              max="365"
              placeholder="40"
              variant="bordered"
              isDisabled={isPending}
            />
          </CardBody>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          color="primary"
          isLoading={isPending}
          isDisabled={isPending}
          startContent={isPending ? null : <Save className="w-4 h-4" />}
        >
          {isPending ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>
    </form>
  );
}
