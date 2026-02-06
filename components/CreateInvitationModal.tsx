"use client";

import { useRef, useActionState, useEffect, useState } from "react";
import {
  createInvitation,
  getInvitationUsage,
} from "../app/actions/protected-admin-invitations";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Spinner } from "@heroui/spinner";
import { Progress } from "@heroui/progress";

const NumberInput = Input;
import { Form } from "@heroui/form";

interface CreateInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface UsageInfo {
  current: number;
  limit: number | null;
  tier: string;
}

export default function CreateInvitationModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateInvitationModalProps) {
  const isProcessingRef = useRef(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const [loadingEventId, setLoadingEventId] = useState(true);
  const [usage, setUsage] = useState<UsageInfo | null>(null);

  // Obtener el evento y usage cuando se abre el modal
  useEffect(() => {
    if (!isOpen) {
      setLoadingEventId(true);
      setEventId(null);
      setUsage(null);
      return;
    }

    const loadData = async () => {
      try {
        setLoadingEventId(true);

        // Obtener evento
        const eventsResponse = await fetch("/api/events");
        if (!eventsResponse.ok) return;

        const events = await eventsResponse.json();
        if (events.length > 0) {
          setEventId(events[0].id);
        }

        // Obtener usage
        const usageResult = await getInvitationUsage();
        if (usageResult.success && usageResult.data) {
          setUsage(usageResult.data);
        }
      } catch {
        // Silently fail - UI shows appropriate error state
      } finally {
        setLoadingEventId(false);
      }
    };

    loadData();
  }, [isOpen]);

  const limitReached =
    usage !== null && usage.limit !== null && usage.current >= usage.limit;

  // useActionState para manejar el estado del formulario
  const [state, formAction, isPending] = useActionState(
    async (
      prevState: { success: boolean; error?: string } | null,
      formData: FormData,
    ) => {
      if (isProcessingRef.current) return prevState;
      if (!eventId) return { success: false, error: "No event selected" };

      isProcessingRef.current = true;
      try {
        formData.set("eventId", eventId);
        const result = await createInvitation(formData);

        if (result.success) {
          onSuccess();
          onClose();
        }

        return result;
      } finally {
        isProcessingRef.current = false;
      }
    },
    null,
  );

  const handleClose = () => {
    if (!isPending) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
      placement="center"
      scrollBehavior="inside"
      classNames={{
        base: "mx-4 sm:mx-0 max-h-[90vh] sm:max-h-none",
        wrapper: "items-end sm:items-center",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-bold">Crear Nueva Invitación</h2>
        </ModalHeader>

        <Form action={formAction} className="flex flex-col gap-4">
          <ModalBody className="w-full overflow-y-auto max-h-[60vh] sm:max-h-none">
            {loadingEventId && (
              <div className="flex items-center justify-center p-4">
                <Spinner size="sm" />
                <span className="ml-2 text-sm text-default-500">
                  Cargando evento...
                </span>
              </div>
            )}

            {!loadingEventId && !eventId && (
              <div className="p-3 bg-warning-50 border border-warning-200 text-warning-700 rounded-lg text-sm">
                No se encontró un evento. Por favor, crea uno primero.
              </div>
            )}

            {/* Usage indicator */}
            {!loadingEventId && usage && usage.limit !== null && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-default-600">Invitaciones usadas</span>
                  <span className="font-medium">
                    {usage.current}/{usage.limit}
                  </span>
                </div>
                <Progress
                  value={(usage.current / usage.limit) * 100}
                  color={limitReached ? "danger" : "primary"}
                  size="sm"
                />
                {limitReached && (
                  <div className="p-3 bg-warning-50 border border-warning-200 text-warning-700 rounded-lg text-sm">
                    Has alcanzado el límite de invitaciones de tu plan{" "}
                    <span className="font-medium">{usage.tier}</span>. Actualiza
                    tu plan para crear más invitaciones.
                  </div>
                )}
              </div>
            )}

            {state?.error && (
              <div className="p-3 bg-danger-50 border border-danger-200 text-danger-700 rounded-lg text-sm">
                {state.error}
              </div>
            )}

            {!loadingEventId && eventId && !limitReached && (
              <div className="flex flex-col gap-4 w-full">
                <Input
                  label="Nombre del Invitado"
                  name="guestName"
                  placeholder="Ej: Juan Pérez"
                  variant="bordered"
                  isRequired
                  description="Nombre completo del invitado"
                  isDisabled={isPending}
                />

                <Input
                  label="Apodo"
                  name="guestNickname"
                  variant="bordered"
                  description="Apodo o nombre de pila (opcional)"
                  isDisabled={isPending}
                />

                <Input
                  label="Teléfono"
                  name="guestPhone"
                  variant="bordered"
                  type="tel"
                  description="Número de teléfono (opcional)"
                  isDisabled={isPending}
                />

                <NumberInput
                  label="Máximo de Invitados"
                  name="maxGuests"
                  min={1}
                  max={10}
                  defaultValue="1"
                  variant="bordered"
                  isRequired
                  description="Número máximo de invitados permitidos"
                  isDisabled={isPending || loadingEventId}
                />
              </div>
            )}
          </ModalBody>

          <ModalFooter className="w-full">
            <Button
              color="danger"
              variant="light"
              onPress={handleClose}
              isDisabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              color="primary"
              type="submit"
              isLoading={isPending}
              isDisabled={
                isPending || loadingEventId || !eventId || limitReached
              }
            >
              {isPending ? "Creando..." : "Crear Invitación"}
            </Button>
          </ModalFooter>
        </Form>
      </ModalContent>
    </Modal>
  );
}
