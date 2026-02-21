"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card, CardBody } from "@heroui/card";
import { Select, SelectItem } from "@heroui/select";
import { Save, Zap } from "lucide-react";
import { CONFIGURATION_KEYS } from "@/types/configuration";
import { updateConfigurations } from "@/app/actions/settings";
import { useToastFeedback } from "@/hooks/useToastFeedback";
import { CheckInStrategyType } from "@/types/check-in-strategy";

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
  const { toastSuccess, toastError } = useToastFeedback();

  // Reaccionar al resultado del server action via toast
  useEffect(() => {
    if (!state) return;
    if (state.error) toastError(state.error);
    if (state.success && state.message) toastSuccess(state.message);
  }, [state]);

  // Get initial values (read-only, no state)
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

  // Check-in strategy configuration (only strategy selector, timeouts are env vars)
  const checkinStrategy =
    (getConfigValue(
      initialConfigurations,
      CONFIGURATION_KEYS.CHECKIN_STRATEGY,
    ) as CheckInStrategyType) || "HYBRID_SMART";

  // datetime-local format: "YYYY-MM-DDTHH:mm"
  const initialDateTimeLocal = weddingDateTimeISO || "";

  const strategies = [
    {
      key: "IDB_FIRST" as CheckInStrategyType,
      label: "Cache Local Primero",
      description: "Máxima velocidad, sincronización eventual",
    },
    {
      key: "SERVER_FIRST" as CheckInStrategyType,
      label: "Servidor Primero",
      description: "Datos siempre actualizados, requiere buena conexión",
    },
    {
      key: "HYBRID_SMART" as CheckInStrategyType,
      label: "Inteligente (Recomendado)",
      description: "Se adapta automáticamente según la calidad de red",
    },
  ];

  return (
    <form action={formAction} className="space-y-6">
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
                <label className="block text-sm font-medium text-foreground mb-1">
                  Fecha y Hora de la Boda
                </label>
                <p className="text-sm text-foreground/50 mb-3">
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

        {/* CHECK-IN STRATEGY CONFIGURATION */}
        {/* TODO: i18n */}
        <Card className="border-2 border-primary/20">
          <CardBody className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Estrategia de Check-In</h3>
            </div>
            <p className="text-sm text-foreground/60 mb-4">
              Configura cómo los scanners manejarán los check-ins según las
              condiciones de red
            </p>

            {/* Strategy Selection */}
            <Select
              name="checkinStrategy"
              label="Estrategia de Check-In"
              description="Cómo los dispositivos scanner manejarán los check-ins"
              defaultSelectedKeys={[checkinStrategy]}
              variant="bordered"
              isDisabled={isPending}
            >
              {strategies.map((strategy) => (
                <SelectItem
                  key={strategy.key}
                  description={strategy.description}
                >
                  {strategy.label}
                </SelectItem>
              ))}
            </Select>

            <div className="bg-default-100 rounded-lg p-3 text-xs text-foreground/60">
              <p>
                <strong>Nota:</strong> Los timeouts y umbrales técnicos se
                configuran globalmente mediante variables de entorno.
              </p>
            </div>
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
