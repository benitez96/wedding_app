"use client";

import { useState, useEffect, useRef, useActionState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Form } from "@heroui/form";
import { updateInvitation } from "../app/actions/protected-admin-invitations";

const NumberInput = Input; // NumberInput is just an Input alias
import InvitationStatusSelect from "./InvitationStatusSelect";
import type { Invitation } from "@/types/invitation";

interface EditInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  invitation: Invitation | null;
}

export default function EditInvitationModal({
  isOpen,
  onClose,
  onSuccess,
  invitation,
}: EditInvitationModalProps) {
  const [formData, setFormData] = useState({
    guestName: "",
    guestNickname: "",
    guestPhone: "",
    maxGuests: 1,
  });
  const [invitationStatus, setInvitationStatus] = useState("pending");
  const [guestCount, setGuestCount] = useState(1);
  // Ref para evitar llamar onSuccess/onClose múltiples veces
  const isProcessingRef = useRef(false);

  // useActionState para manejar el estado del formulario
  const [state, formAction, isPending] = useActionState(
    async (
      prevState: { success: boolean; error?: string } | null,
      formData: FormData,
    ) => {
      if (!invitation || isProcessingRef.current) return prevState;

      isProcessingRef.current = true;
      try {
        const result = await updateInvitation(invitation.id, formData);

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

  // Actualizar el formulario cuando cambie la invitación
  useEffect(() => {
    if (invitation) {
      setFormData({
        guestName: invitation.guestName,
        guestNickname: invitation.guestNickname || "",
        guestPhone: invitation.guestPhone || "",
        maxGuests: invitation.maxGuests,
      });

      // Determinar el estado de la invitación
      if (!invitation.hasResponded) {
        setInvitationStatus("pending");
        setGuestCount(1);
      } else if (invitation.isAttending) {
        setInvitationStatus("attending");
        setGuestCount(invitation.guestCount || 1);
      } else {
        setInvitationStatus("not_attending");
        setGuestCount(1);
      }
    }
  }, [invitation]);

  const handleClose = () => {
    if (!isPending) {
      setInvitationStatus("pending");
      setGuestCount(1);
      onClose();
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md" placement="center">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-bold">Editar Invitación</h2>
        </ModalHeader>

        <Form action={formAction} className="flex flex-col gap-4">
          <ModalBody className="w-full">
            {state?.error && (
              <div className="p-3 bg-danger-50 border border-danger-200 text-danger-700 rounded-lg text-sm">
                {state.error}
              </div>
            )}

            <div className="flex flex-col gap-4 w-full">
              <Input
                label="Nombre del Invitado"
                name="guestName"
                placeholder="Ej: Juan Pérez"
                variant="bordered"
                isRequired
                description="Nombre completo del invitado"
                value={formData.guestName}
                onChange={(e) => handleInputChange("guestName", e.target.value)}
                isDisabled={isPending}
              />

              <Input
                label="Apodo"
                name="guestNickname"
                variant="bordered"
                description="Apodo o nombre de pila (opcional)"
                value={formData.guestNickname}
                onChange={(e) =>
                  handleInputChange("guestNickname", e.target.value)
                }
                isDisabled={isPending}
              />

              <Input
                label="Teléfono"
                name="guestPhone"
                variant="bordered"
                type="tel"
                description="Número de teléfono (opcional)"
                value={formData.guestPhone}
                onChange={(e) =>
                  handleInputChange("guestPhone", e.target.value)
                }
                isDisabled={isPending}
              />

              <NumberInput
                label="Máximo de Invitados"
                name="maxGuests"
                min={1}
                max={10}
                variant="bordered"
                isRequired
                description="Número máximo de invitados permitidos"
                value={String(formData.maxGuests)}
                onValueChange={(value) => handleInputChange("maxGuests", value)}
                isDisabled={isPending}
              />

              <InvitationStatusSelect
                status={invitationStatus}
                guestCount={guestCount}
                maxGuests={formData.maxGuests}
                onStatusChange={setInvitationStatus}
                onGuestCountChange={setGuestCount}
              />

              {/* Campos ocultos para enviar los valores */}
              <input
                type="hidden"
                name="hasResponded"
                value={invitationStatus !== "pending" ? "true" : "false"}
              />
              <input
                type="hidden"
                name="isAttending"
                value={invitationStatus === "attending" ? "true" : "false"}
              />
              <input
                type="hidden"
                name="guestCount"
                value={invitationStatus === "attending" ? guestCount : ""}
              />
            </div>
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
              isDisabled={isPending}
            >
              {isPending ? "Actualizando..." : "Actualizar Invitación"}
            </Button>
          </ModalFooter>
        </Form>
      </ModalContent>
    </Modal>
  );
}
