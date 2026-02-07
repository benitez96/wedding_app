"use client";

import { useState, useActionState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Form } from "@heroui/form";
import { UserCheck, AlertTriangle, WifiOff } from "lucide-react";
import CheckInCounter from "./CheckInCounter";
import { createCheckIn } from "@/app/actions/check-in/createCheckIn";

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  invitation: {
    id: string;
    tokenId: string;
    guestName: string;
    guestNickname: string | null;
    maxGuests: number;
    checkInCount: number;
    remaining: number;
  };
  isOffline: boolean;
}

/**
 * Modal de confirmación de check-in
 *
 * Permite al staff seleccionar cuántos invitados ingresan
 * y confirmar el registro de check-in.
 *
 * Soporta modo offline: los check-ins se guardan localmente
 * y se sincronizan cuando vuelve la conexión.
 */
export default function CheckInModal({
  isOpen,
  onClose,
  invitation,
  isOffline,
}: CheckInModalProps) {
  const [guestsCount, setGuestsCount] = useState(
    Math.min(invitation.remaining, 1),
  );

  const [state, formAction, isPending] = useActionState(
    async (
      _prevState: { success: boolean; error?: string; warning?: string } | null,
    ) => {
      const result = await createCheckIn({
        invitationId: invitation.id,
        guestsCount,
      });

      if (result.success) {
        onClose();
      }

      return result;
    },
    null,
  );

  const displayName = invitation.guestNickname || invitation.guestName;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 text-center">
          <div className="flex justify-center mb-2">
            <UserCheck className="text-success" size={32} />
          </div>
          <h3 className="text-xl font-bold">Check-In</h3>
          <p className="text-sm text-default-500">{displayName}</p>
        </ModalHeader>

        <Form action={formAction} className="contents">
          <ModalBody className="space-y-6">
            {/* Indicador offline */}
            {isOffline && (
              <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 flex items-center gap-2">
                <WifiOff className="text-warning-600" size={20} />
                <div className="flex-1">
                  <p className="text-warning-800 text-sm font-medium">
                    Sin conexión
                  </p>
                  <p className="text-warning-700 text-xs">
                    Se sincronizará cuando haya internet
                  </p>
                </div>
              </div>
            )}

            {/* Mensaje de error */}
            {state?.error && (
              <div className="bg-danger-50 border border-danger-200 rounded-lg p-3">
                <p className="text-danger-600 text-sm">{state.error}</p>
              </div>
            )}

            {/* Warning de capacidad excedida */}
            {state?.warning && (
              <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 flex items-center gap-2">
                <AlertTriangle className="text-warning-600" size={20} />
                <p className="text-warning-800 text-sm">{state.warning}</p>
              </div>
            )}

            {/* Información de capacidad */}
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <p className="text-sm text-default-500">Ya ingresaron</p>
                <p className="text-2xl font-bold tabular-nums">
                  {invitation.checkInCount} de {invitation.maxGuests}
                </p>
                <p className="text-sm font-medium text-success">
                  Disponibles: {invitation.remaining}
                </p>
              </div>

              {/* Contador de invitados */}
              {invitation.remaining > 0 && (
                <div className="flex flex-col items-center gap-3">
                  <span className="font-medium">¿Cuántos ingresan ahora?</span>
                  <CheckInCounter
                    value={guestsCount}
                    onChange={setGuestsCount}
                    min={1}
                    max={invitation.maxGuests}
                    remaining={invitation.remaining}
                  />
                </div>
              )}

              {/* Mensaje si ya ingresaron todos */}
              {invitation.remaining === 0 && (
                <div className="bg-default-100 rounded-lg p-4 text-center">
                  <p className="text-sm text-default-700">
                    Todos los invitados ya ingresaron
                  </p>
                </div>
              )}
            </div>
          </ModalBody>

          <ModalFooter>
            <Button variant="light" onPress={onClose} isDisabled={isPending}>
              Cancelar
            </Button>
            <Button
              type="submit"
              color="success"
              isLoading={isPending}
              isDisabled={invitation.remaining === 0 || isPending}
            >
              Confirmar Ingreso
            </Button>
          </ModalFooter>
        </Form>
      </ModalContent>
    </Modal>
  );
}
