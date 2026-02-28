"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Heart } from "lucide-react";
import SimpleConfetti from "./SimpleConfetti";
import { RSVPStepConfig } from "./sections/RSVPSectionClient";
import { RSVPStepAttendance } from "./RSVPModal/RSVPStepAttendance";
import { RSVPStepGuestCount } from "./RSVPModal/RSVPStepGuestCount";
import { RSVPStepMenu } from "./RSVPModal/RSVPStepMenu";
import { RSVPStepDietary } from "./RSVPModal/RSVPStepDietary";
import { RSVPStepMessage } from "./RSVPModal/RSVPStepMessage";
import { RSVPStepProgress } from "./RSVPModal/RSVPStepProgress";
import {
  getCurrentUserData,
  updateInvitationResponse,
} from "@/app/actions/protected-invitations";
import {
  type AttendanceValue,
  buildSteps,
  isStepValid,
  STEP,
} from "@/lib/rsvp-modal-utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

export interface RSVPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  stepConfig: RSVPStepConfig;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

// TODO: i18n — all user-facing strings in RSVPModal
export default function RSVPModal({
  isOpen,
  onClose,
  onSuccess,
  stepConfig,
}: RSVPModalProps) {
  const [user, setUser] = useState<InvitationUserData | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isProcessingRef = useRef(false);

  // Form state
  const [attendance, setAttendance] = useState<AttendanceValue | null>(null);
  const [guestCount, setGuestCount] = useState(1);
  const [menuPreference, setMenuPreference] = useState<string | null>(null);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string | null>(
    null,
  );
  const [messageForCouple, setMessageForCouple] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Derive active steps from current attendance answer
  const steps = buildSteps(attendance, user?.maxGuests ?? 1, stepConfig);
  const currentStep = steps[currentStepIndex] ?? STEP.ATTENDANCE;
  const isLastStep = currentStepIndex === steps.length - 1;
  const canAdvance = isStepValid(
    currentStep,
    attendance,
    menuPreference,
    dietaryRestrictions,
  );

  function handleSubmit() {
    if (!attendance || !user || isProcessingRef.current) return;
    setSubmitError(null);
    isProcessingRef.current = true;

    startTransition(async () => {
      try {
        const result = await updateInvitationResponse({
          isAttending: attendance === "attending",
          guestCount: attendance === "attending" ? guestCount : null,
          menuPreference: attendance === "attending" ? menuPreference : null,
          dietaryRestrictions:
            attendance === "attending" ? dietaryRestrictions : null,
          messageForCouple:
            attendance === "attending" ? messageForCouple || null : null,
        });

        if (result.success) {
          if (attendance === "attending") {
            setShowConfetti(true);
            if (confettiTimeoutRef.current)
              clearTimeout(confettiTimeoutRef.current);
            confettiTimeoutRef.current = setTimeout(() => {
              setShowConfetti(false);
              confettiTimeoutRef.current = null;
            }, 4000);
          }
          onSuccess();
          onClose();
          resetForm();
        } else {
          setSubmitError(result.error ?? "Error al procesar la respuesta"); // TODO: i18n
        }
      } finally {
        isProcessingRef.current = false;
      }
    });
  }

  // Load user data when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const loadUserData = async () => {
      try {
        const result = await getCurrentUserData();
        if (result.success && result.user) {
          setUser(result.user);

          // Pre-fill with existing response if already responded
          if (result.user.hasResponded) {
            setAttendance(result.user.isAttending ? "attending" : "declining");
            setGuestCount(result.user.guestCount ?? result.user.maxGuests);
          } else {
            setGuestCount(result.user.maxGuests);
          }
        }
      } catch {
        // Silent — modal shows gracefully without user data
      }
    };

    loadUserData();

    return () => {
      if (confettiTimeoutRef.current) clearTimeout(confettiTimeoutRef.current);
    };
  }, [isOpen]);

  // When attendance flips from "attending" to "declining", the step list shrinks.
  // Clamp the index without putting currentStepIndex in deps (would cause a loop).
  useEffect(() => {
    const newSteps = buildSteps(attendance, user?.maxGuests ?? 1, stepConfig);
    setCurrentStepIndex((prev) => Math.min(prev, newSteps.length - 1));
    // stepConfig is intentionally excluded: it's stable after mount and its
    // identity changes on every render of RSVPSection (object literal).
    // Attendance and maxGuests are the only values that actually resize the list.
     
  }, [attendance, user?.maxGuests]);

  function resetForm() {
    setAttendance(null);
    setGuestCount(1);
    setMenuPreference(null);
    setDietaryRestrictions(null);
    setMessageForCouple("");
    setCurrentStepIndex(0);
  }

  function handleClose() {
    if (!isPending) onClose();
  }

  function handleNext() {
    if (!isLastStep) setCurrentStepIndex((i) => i + 1);
  }

  function handleBack() {
    if (currentStepIndex > 0) setCurrentStepIndex((i) => i - 1);
  }

  function handleAttendanceChange(value: AttendanceValue) {
    setAttendance(value);
    // Reset attending-only fields if switching to declining
    if (value === "declining") {
      setMenuPreference(null);
      setDietaryRestrictions(null);
      setMessageForCouple("");
    }
  }

  function renderStep() {
    switch (currentStep) {
      case STEP.ATTENDANCE:
        return (
          <RSVPStepAttendance
            value={attendance}
            onValueChange={handleAttendanceChange}
            attendanceStep={stepConfig.attendanceStep}
          />
        );

      case STEP.GUEST_COUNT:
        return (
          <RSVPStepGuestCount
            value={guestCount}
            max={user?.maxGuests ?? 1}
            onChange={setGuestCount}
          />
        );

      case STEP.MENU:
        return (
          <RSVPStepMenu
            question={stepConfig.menuStep.question}
            options={stepConfig.menuStep.options}
            value={menuPreference}
            onValueChange={setMenuPreference}
          />
        );

      case STEP.DIETARY:
        return (
          <RSVPStepDietary
            question={stepConfig.dietaryStep.question}
            value={dietaryRestrictions}
            onValueChange={setDietaryRestrictions}
          />
        );

      case STEP.MESSAGE:
        return (
          <RSVPStepMessage
            question={stepConfig.messageStep.question}
            value={messageForCouple}
            onValueChange={setMessageForCouple}
          />
        );
    }
  }

  const displayName = user?.guestNickname ?? user?.guestName;
  const modalTitle = user?.hasResponded
    ? "Cambiar Respuesta" // TODO: i18n
    : "Confirmar Asistencia"; // TODO: i18n

  return (
    <>
      {showConfetti ? <SimpleConfetti /> : null}

      <Modal isOpen={isOpen} onClose={handleClose} size="lg">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 text-center">
            <div className="flex justify-center mb-2">
              <Heart className="text-pink-500" size={32} />
            </div>
            <h3 className="text-xl font-bold">{modalTitle}</h3>
            {displayName && (
              <p className="text-sm text-default-500">{displayName}</p>
            )}
            <RSVPStepProgress current={currentStepIndex} total={steps.length} />
          </ModalHeader>

          <>
            <ModalBody className="space-y-6">
              {submitError ? (
                <div className="bg-danger-50 border border-danger-200 rounded-lg p-3">
                  <p className="text-danger-600 text-sm">{submitError}</p>
                </div>
              ) : null}

              {renderStep()}
            </ModalBody>

            <ModalFooter className="flex justify-between">
              {/* Back button — hidden on first step */}
              {currentStepIndex > 0 ? (
                <Button
                  variant="light"
                  onPress={handleBack}
                  isDisabled={isPending}
                >
                  Atrás {/* TODO: i18n */}
                </Button>
              ) : (
                <Button
                  variant="light"
                  onPress={handleClose}
                  isDisabled={isPending}
                >
                  Cancelar {/* TODO: i18n */}
                </Button>
              )}

              {isLastStep ? (
                <Button
                  color="primary"
                  onPress={handleSubmit}
                  isLoading={isPending}
                  isDisabled={!canAdvance || isPending}
                >
                  {/* TODO: i18n */}
                  {user?.hasResponded
                    ? "Actualizar Respuesta"
                    : attendance === "attending"
                      ? "Confirmar Asistencia"
                      : "Enviar Respuesta"}
                </Button>
              ) : (
                // Next on intermediate steps
                <Button
                  color="primary"
                  onPress={handleNext}
                  isDisabled={!canAdvance}
                >
                  Siguiente {/* TODO: i18n */}
                </Button>
              )}
            </ModalFooter>
          </>
        </ModalContent>
      </Modal>
    </>
  );
}
