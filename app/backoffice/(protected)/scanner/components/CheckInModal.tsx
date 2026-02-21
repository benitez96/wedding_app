"use client";

import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { UserCheck, AlertTriangle, WifiOff } from "lucide-react";
import CheckInCounter from "./CheckInCounter";
import { saveCheckInToQueue } from "@/lib/offline/indexedDB";
import { updateCachedInvitationCheckInCount } from "@/lib/offline/indexedDB";

interface CheckInInvitation {
  id: string;
  tokenId: string;
  guestName: string;
  guestNickname: string | null;
  maxGuests: number;
  checkInCount: number;
  remaining: number;
}

interface CheckInResult {
  success: boolean;
  error?: string;
  warning?: string;
  queued?: boolean;
}

interface CheckInModalProps {
  isOpen: boolean;
  onClose: (checkInWasMade?: boolean) => void;
  invitation: CheckInInvitation;
  isOnline: boolean;
}

/**
 * Modal de confirmación de check-in
 *
 * Permite al staff seleccionar cuántos invitados ingresan
 * y confirmar el registro de check-in.
 *
 * Usa fetch POST a /api/check-in para que el Service Worker
 * pueda interceptar cuando estamos offline y hacer queue.
 *
 * Online: POST llega al Route Handler → crea check-in en DB
 * Offline: SW intercepta → responde {queued:true} → guarda en IndexedDB
 */
export default function CheckInModal({
  isOpen,
  onClose,
  invitation,
  isOnline,
}: CheckInModalProps) {
  const [guestsCount, setGuestsCount] = useState(
    Math.min(invitation.remaining, 1),
  );
  const [state, setState] = useState<CheckInResult | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async () => {
    setIsPending(true);
    setState(null);

    // TODO: delete test comment
    console.log(
      `[💳 Check-In] Submitting check-in | Invitation: ${invitation.id} | Guests: ${guestsCount} | Online: ${isOnline}`,
    );

    // OFFLINE MODE: Save directly to IDB queue
    if (!isOnline) {
      try {
        // TODO: delete test comment
        console.log(
          `[📴 Check-In] Offline mode detected → Saving to IDB queue`,
        );

        const queuedCheckIn = await saveCheckInToQueue({
          invitationId: invitation.id,
          tokenId: invitation.tokenId,
          guestsCount,
          timestamp: Date.now(),
        });

        // TODO: delete test comment
        console.log(
          `[✅ Check-In] Saved to offline queue: ${queuedCheckIn.id} | Will sync when online`,
        );

        setIsPending(false);
        onClose(true); // true = check-in was made
        return;
      } catch (error) {
        // TODO: delete test comment
        console.error(`[❌ Check-In] Failed to save to offline queue:`, error);

        setState({
          success: false,
          error: "No se pudo guardar el check-in offline. Intenta de nuevo.",
        });
        setIsPending(false);
        return;
      }
    }

    // ONLINE MODE: Try server first, fallback to queue if fails
    try {
      // TODO: delete test comment
      console.log(`[🌐 Check-In] Online mode → POSTing to server`);

      const response = await fetch("/api/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitationId: invitation.id,
          tokenId: invitation.tokenId,
          guestsCount,
        }),
      });

      const result: CheckInResult = await response.json();

      if (result.success) {
        // TODO: delete test comment
        console.log(
          `[✅ Check-In] Server accepted check-in | Response:`,
          result,
        );

        // Update local cache immediately (optimistic UI)
        await updateCachedInvitationCheckInCount(invitation.id, guestsCount);

        onClose(true); // true = check-in was made
        return;
      }

      // TODO: delete test comment
      console.warn(`[⚠️ Check-In] Server rejected check-in:`, result);
      setState(result);
    } catch (error) {
      // Network error during online mode → fallback to offline queue
      // TODO: delete test comment
      console.error(
        `[❌ Check-In] Server request failed, falling back to offline queue:`,
        error,
      );

      try {
        const queuedCheckIn = await saveCheckInToQueue({
          invitationId: invitation.id,
          tokenId: invitation.tokenId,
          guestsCount,
          timestamp: Date.now(),
        });

        // TODO: delete test comment
        console.log(
          `[✅ Check-In] Saved to offline queue as fallback: ${queuedCheckIn.id}`,
        );

        onClose(true); // true = check-in was made
        return;
      } catch (queueError) {
        // TODO: delete test comment
        console.error(`[❌ Check-In] Even offline queue failed:`, queueError);

        setState({
          success: false,
          error: "No se pudo registrar el check-in. Intenta de nuevo.",
        });
      }
    } finally {
      setIsPending(false);
    }
  };

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

        <ModalBody className="space-y-6">
          {/* Indicador offline */}
          {!isOnline && (
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
          <Button
            variant="light"
            onPress={() => onClose(false)}
            isDisabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            color="success"
            isLoading={isPending}
            isDisabled={invitation.remaining === 0 || isPending}
            onPress={handleSubmit}
          >
            Confirmar Ingreso
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
