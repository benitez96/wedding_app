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
import { Form } from "@heroui/form";
import { Users, Heart } from "lucide-react";
import {
  getCurrentUserData,
  updateInvitationResponse,
} from "@/app/actions/protected-invitations";
import CustomRadioGroup from "./sections/RSVPStatus/CustomRadioGroup";
import GuestCountSelector from "./GuestCountSelector";
import SimpleConfetti from "./SimpleConfetti";

interface InvitationUserData {
  invitationId: string;
  tokenId: string;
  guestName: string;
  guestNickname: string | null;
  maxGuests: number;
  hasResponded: boolean;
  isAttending: boolean | null;
  guestCount: number | null;
  respondedAt: Date | null;
}

interface RSVPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// TODO i18n: All user-facing text in RSVPModal needs translation
export default function RSVPModal({
  isOpen,
  onClose,
  onSuccess,
}: RSVPModalProps) {
  const [user, setUser] = useState<InvitationUserData | null>(null);
  const [response, setResponse] = useState<"attending" | "declining" | null>(
    null,
  );
  const [guestCount, setGuestCount] = useState<number>(1);
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isProcessingRef = useRef(false);

  // useActionState para manejar el estado del formulario
  const [state, formAction, isPending] = useActionState(
    async (prevState: { success: boolean; error?: string } | null) => {
      if (!response || !user || isProcessingRef.current) return prevState;

      isProcessingRef.current = true;
      try {
        const result = await updateInvitationResponse({
          isAttending: response === "attending",
          guestCount: response === "attending" ? guestCount : null,
        });

        if (result.success) {
          // Mostrar confetis si está confirmando asistencia
          if (response === "attending") {
            setShowConfetti(true);
            if (confettiTimeoutRef.current) {
              clearTimeout(confettiTimeoutRef.current);
            }
            confettiTimeoutRef.current = setTimeout(() => {
              setShowConfetti(false);
              confettiTimeoutRef.current = null;
            }, 4000);
          }

          onSuccess();
          onClose();
          // Resetear el formulario
          setResponse(null);
          setGuestCount(1);
        }

        return result;
      } finally {
        isProcessingRef.current = false;
      }
    },
    null,
  );

  useEffect(() => {
    if (!isOpen) return;

    const loadUserData = async () => {
      try {
        const result = await getCurrentUserData();
        if (result.success && result.user) {
          setUser(result.user);

          // Si ya respondió, cargar su respuesta actual
          if (result.user.hasResponded) {
            setResponse(result.user.isAttending ? "attending" : "declining");
            setGuestCount(result.user.guestCount || result.user.maxGuests);
          } else {
            setResponse(null);
            setGuestCount(result.user.maxGuests);
          }
        }
      } catch (error) {
        console.error("Error al cargar datos del usuario:", error);
      }
    };

    loadUserData();

    return () => {
      if (confettiTimeoutRef.current) {
        clearTimeout(confettiTimeoutRef.current);
      }
    };
  }, [isOpen]);

  const handleClose = () => {
    if (!isPending) {
      onClose();
    }
  };

  const getModalTitle = () => {
    if (!user) return "Confirmar Asistencia";
    return user.hasResponded ? "Cambiar Respuesta" : "Confirmar Asistencia";
  };

  return (
    <>
      {showConfetti ? <SimpleConfetti /> : null}
      <Modal isOpen={isOpen} onClose={handleClose} size="lg">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 text-center">
            <div className="flex justify-center mb-2">
              <Heart className="text-pink-500" size={32} />
            </div>
            <h3 className="text-xl font-bold">{getModalTitle()}</h3>
            <p className="text-sm text-default-500">
              {user?.guestNickname ? `${user.guestNickname}` : user?.guestName}
            </p>
          </ModalHeader>

          <Form action={formAction} className="contents">
            <ModalBody className="space-y-6">
              {state?.error ? (
                <div className="bg-danger-50 border border-danger-200 rounded-lg p-3">
                  <p className="text-danger-600 text-sm">{state.error}</p>
                </div>
              ) : null}

              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-4 text-center">
                    ¿Vas a asistir a nuestra boda?
                  </h4>
                  <CustomRadioGroup
                    value={response}
                    onValueChange={setResponse}
                  />
                </div>

                {response === "attending" && (user?.maxGuests ?? 0) > 1 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="font-medium">
                        ¿Cuántas personas van a asistir?
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <GuestCountSelector
                        value={guestCount}
                        onChange={setGuestCount}
                        min={1}
                        max={user?.maxGuests || 1}
                      />
                      <span className="text-sm text-default-500">
                        de {user?.maxGuests} máximo
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            </ModalBody>

            <ModalFooter>
              <Button
                variant="light"
                onPress={handleClose}
                isDisabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                color="primary"
                isLoading={isPending}
                isDisabled={!response || isPending}
              >
                {user?.hasResponded
                  ? "Actualizar Respuesta"
                  : response === "attending"
                    ? "Confirmar Asistencia"
                    : "Enviar Respuesta"}
              </Button>
            </ModalFooter>
          </Form>
        </ModalContent>
      </Modal>
    </>
  );
}
