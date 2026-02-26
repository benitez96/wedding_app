"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { Select, SelectItem } from "@heroui/select";
import { Save, Info, Zap, AlertTriangle, ArrowRight } from "lucide-react";
import { CONFIGURATION_KEYS } from "@/types/configuration";
import { updateEventSettings } from "@/app/actions/settings";
import { useToastFeedback } from "@/hooks/useToastFeedback";
import { useSlugPreview } from "@/hooks/useSlugPreview";
import { CheckInStrategyType } from "@/types/check-in-strategy";
import DangerZone from "./DangerZone";

interface ConfigurationItem {
  id: string;
  key: string;
  value: string;
  description: string | null;
}

interface EventData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface SettingsFormProps {
  event: EventData;
  initialConfigurations: ConfigurationItem[];
}

// Helper: Obtener valor de configuración
function getConfigValue(configs: ConfigurationItem[], key: string): string {
  return configs.find((c) => c.key === key)?.value || "";
}

export default function SettingsForm({
  event,
  initialConfigurations,
}: SettingsFormProps) {
  // useActionState para manejar el estado del formulario
  const [state, formAction, isPending] = useActionState(
    updateEventSettings,
    null,
  );
  const { toastSuccess, toastError } = useToastFeedback();

  // Hook para manejar slug preview en tiempo real
  const { eventName, setEventName, slugPreview, slugWillChange } =
    useSlugPreview(event.name, event.slug);

  // Reaccionar al resultado del server action via toast
  useEffect(() => {
    if (!state) return;
    if (state.error) toastError(state.error);
    if (state.success && state.message) toastSuccess(state.message);
  }, [state, toastError, toastSuccess]);

  // Check-in strategy configuration (only strategy selector, timeouts are env vars)
  const checkinStrategy =
    (getConfigValue(
      initialConfigurations,
      CONFIGURATION_KEYS.CHECKIN_STRATEGY,
    ) as CheckInStrategyType) || "HYBRID_SMART";

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
    <div className="space-y-6">
      <form action={formAction}>
        <Accordion
          variant="splitted"
          defaultExpandedKeys={["event-info", "checkin-strategy"]}
        >
          {/* INFORMACIÓN DEL EVENTO */}
          <AccordionItem
            key="event-info"
            title={
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                <span className="font-semibold">Información del Evento</span>
              </div>
            }
            subtitle="Configuración básica de tu evento"
          >
            <div className="space-y-4 pb-4">
              <Input
                name="eventName"
                label="Nombre del Evento"
                description="El nombre de tu boda, fiesta o celebración"
                value={eventName}
                onValueChange={setEventName}
                placeholder="Ej: Boda de Ana y Juan"
                variant="bordered"
                isDisabled={isPending}
                isRequired
              />

              <Textarea
                name="eventDescription"
                label="Descripción (Opcional)"
                description="Una breve descripción de tu evento"
                defaultValue={event.description || ""}
                placeholder="Ej: Celebramos nuestra boda en un día especial..."
                variant="bordered"
                isDisabled={isPending}
                minRows={3}
                maxRows={6}
              />

              <div
                className={`border rounded-lg p-3 transition-colors ${
                  slugWillChange
                    ? "bg-warning/5 border-warning/30"
                    : "bg-default-50 border-default-200"
                }`}
              >
                <div className="flex items-start gap-2">
                  <Info
                    className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      slugWillChange ? "text-warning" : "text-foreground/60"
                    }`}
                  />
                  <div className="flex-1 space-y-2">
                    {slugWillChange ? (
                      <>
                        <div className="flex items-center gap-2 text-sm">
                          <code className="bg-default-200 px-2 py-1 rounded font-mono text-xs">
                            {event.slug}
                          </code>
                          <ArrowRight className="w-3 h-3 text-warning" />
                          <code className="bg-warning/20 text-warning px-2 py-1 rounded font-mono text-xs font-semibold">
                            {slugPreview}
                          </code>
                        </div>
                        <p className="text-xs text-warning">
                          El slug se actualizará al guardar los cambios
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-foreground/70">
                          <strong>Slug:</strong>{" "}
                          <code className="bg-default-200 px-2 py-1 rounded font-mono text-xs">
                            {event.slug}
                          </code>
                        </p>
                        <p className="text-xs text-foreground/50">
                          Se regenera automáticamente cuando cambias el nombre
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-4">
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
            </div>
          </AccordionItem>

          {/* CHECK-IN STRATEGY CONFIGURATION */}
          <AccordionItem
            key="checkin-strategy"
            title={
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                <span className="font-semibold">Estrategia de Check-In</span>
              </div>
            }
            subtitle="Configura cómo los scanners manejarán los check-ins"
          >
            <div className="space-y-4 pb-4">
              <p className="text-sm text-foreground/60">
                Configura cómo los scanners manejarán los check-ins según las
                condiciones de red
              </p>

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

              <div className="flex justify-end mt-4">
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
            </div>
          </AccordionItem>
        </Accordion>
      </form>

      {/* DANGER ZONE - Colapsada por defecto */}
      <Accordion variant="splitted">
        <AccordionItem
          key="danger-zone"
          title="Zona de Peligro"
          subtitle="Acciones irreversibles"
          startContent={<AlertTriangle className="w-5 h-5 text-danger" />}
          classNames={{
            base: "border-2 border-danger/20",
            title: "text-danger font-semibold",
            subtitle: "text-danger/70",
            trigger: "hover:bg-danger/5",
            startContent: "text-danger",
          }}
        >
          <div className="pb-4">
            <DangerZone eventId={event.id} eventName={event.name} />
          </div>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
