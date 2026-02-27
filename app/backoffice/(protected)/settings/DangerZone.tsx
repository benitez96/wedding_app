"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Input } from "@heroui/input";
import { AlertTriangle, Trash2 } from "lucide-react";
import { deleteEvent } from "@/app/actions/settings";
import { useToastFeedback } from "@/hooks/useToastFeedback";

interface DangerZoneProps {
  eventId: string;
  eventName: string;
}

export default function DangerZone({ eventId, eventName }: DangerZoneProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { toastSuccess, toastError } = useToastFeedback();

  const handleDelete = async () => {
    if (confirmationText !== eventName) {
      toastError("El nombre del evento no coincide");
      return;
    }

    setIsDeleting(true);

    try {
      const result = await deleteEvent(eventId);

      // Si hay error, mostrarlo
      if (!result.success) {
        toastError(result.error || "Error al eliminar el evento");
        setIsDeleting(false);
        return;
      }

      // Éxito - mostrar toast y redirigir según eventos restantes
      toastSuccess(result.message || "Evento eliminado exitosamente");

      // Decidir a dónde redirigir
      if (result.remainingEvents && result.remainingEvents.length > 0) {
        // Tiene otros eventos - redirigir al backoffice (seleccionará automáticamente otro evento)
        router.push("/backoffice");
        router.refresh();
      } else {
        // No tiene más eventos - redirigir a página de "no events"
        router.push("/backoffice/no-events");
        router.refresh();
      }
    } catch {
      toastError("Error inesperado al eliminar el evento");
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <p className="text-sm text-foreground/60">
          Eliminar este evento es una acción <strong>irreversible</strong>. Se
          eliminarán todas las invitaciones, secciones, configuraciones y datos
          relacionados permanentemente.
        </p>

        <div className="flex justify-start">
          <Button
            color="danger"
            variant="bordered"
            startContent={<Trash2 className="w-4 h-4" />}
            onPress={() => setIsOpen(true)}
          >
            Eliminar Evento
          </Button>
        </div>
      </div>

      <Modal
        isOpen={isOpen}
        onClose={() => !isDeleting && setIsOpen(false)}
        isDismissable={!isDeleting}
        hideCloseButton={isDeleting}
      >
        <ModalContent>
          <ModalHeader className="flex gap-2 items-center text-danger">
            <AlertTriangle className="w-5 h-5" />
            Confirmar Eliminación
          </ModalHeader>
          <ModalBody>
            <p className="text-sm">
              Esta acción <strong>NO SE PUEDE DESHACER</strong>. Se eliminarán
              permanentemente:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 text-foreground/70">
              <li>Todas las invitaciones y grupos</li>
              <li>Todas las secciones y configuraciones</li>
              <li>Todos los links de invitación</li>
              <li>Todos los datos relacionados al evento</li>
            </ul>

            <p className="text-sm mt-4">
              Para confirmar, escribe el nombre del evento:{" "}
              <code className="bg-danger-50 text-danger px-2 py-1 rounded text-xs">
                {eventName}
              </code>
            </p>

            <Input
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={`Escribe: ${eventName}`}
              variant="bordered"
              isDisabled={isDeleting}
              // eslint-disable-next-line jsx-a11y/no-autofocus -- Deliberate UX: focus input on modal open
              autoFocus
            />
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => setIsOpen(false)}
              isDisabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              color="danger"
              onPress={handleDelete}
              isLoading={isDeleting}
              isDisabled={confirmationText !== eventName || isDeleting}
              startContent={isDeleting ? null : <Trash2 className="w-4 h-4" />}
            >
              {isDeleting ? "Eliminando..." : "Eliminar Permanentemente"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
