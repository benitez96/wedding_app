"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@heroui/button";
import { RSVPStepAttendance } from "./RSVPStepAttendance";
import { RSVPStepGuestCount } from "./RSVPStepGuestCount";
import { RSVPStepMenu } from "./RSVPStepMenu";
import { RSVPStepDietary } from "./RSVPStepDietary";
import { RSVPStepMessage } from "./RSVPStepMessage";
import { RSVPStepConfig } from "@/components/sections/RSVPSectionClient";

import { type AttendanceValue, buildSteps, STEP } from "@/lib/rsvp-modal-utils";

// Preview uses a fixed maxGuests value for display purposes
const PREVIEW_MAX_GUESTS = 2;

// ---------------------------------------------------------------------------
// Clickable dot progress indicator
// ---------------------------------------------------------------------------

interface ClickableProgressProps {
  current: number;
  total: number;
  onChange: (index: number) => void;
}

function ClickableProgress({
  current,
  total,
  onChange,
}: ClickableProgressProps) {
  if (total <= 1) return null;
  return (
    <div
      className="flex justify-center gap-2"
      role="tablist"
      aria-label="Pasos del formulario" // TODO: i18n
    >
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          type="button"
          role="tab"
          aria-selected={i === current}
          aria-label={`Paso ${i + 1}`} // TODO: i18n
          onClick={() => onChange(i)}
          className={`rounded-full transition-all duration-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            i === current
              ? "bg-primary w-4 h-2"
              : i < current
                ? "bg-primary opacity-50 w-2 h-2"
                : "bg-default-300 w-2 h-2"
          }`}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// RSVPModalPreview — fully controlled navigation state (lifted to parent)
// Internal form state (attendance mock, etc.) stays local — no submit happens.
// ---------------------------------------------------------------------------

export interface RSVPModalPreviewProps {
  stepConfig: RSVPStepConfig;
  /** Controlled: current step index, owned by RSVPSectionPreview */
  currentStepIndex: number;
  onStepChange: (index: number) => void;
}

export function RSVPModalPreview({
  stepConfig,
  currentStepIndex,
  onStepChange,
}: RSVPModalPreviewProps) {
  // Mock form state — purely visual, no submit
  const [attendance, setAttendance] = useState<AttendanceValue | null>(
    "attending",
  );
  const [guestCount, setGuestCount] = useState(2);
  const [menuPreference, setMenuPreference] = useState<string | null>(null);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string | null>(
    null,
  );
  const [messageForCouple, setMessageForCouple] = useState("");

  const steps = buildSteps(attendance, PREVIEW_MAX_GUESTS, stepConfig);
  // Clamp index in case steps shrink (e.g. attendance switches to declining)
  const safeIndex = Math.min(currentStepIndex, steps.length - 1);
  const currentStep = steps[safeIndex] ?? STEP.ATTENDANCE;
  const isLastStep = safeIndex === steps.length - 1;

  function handleAttendanceChange(value: AttendanceValue) {
    setAttendance(value);
    if (value === "declining") {
      setMenuPreference(null);
      setDietaryRestrictions(null);
      setMessageForCouple("");
      onStepChange(0);
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
            max={PREVIEW_MAX_GUESTS}
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

  return (
    // Mimics Modal shell visually — card with shadow, no overlay
    <div className="mx-auto max-w-lg w-full rounded-2xl border border-default-200 bg-content1 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex flex-col items-center gap-1 px-6 pt-6 pb-4 text-center">
        <Heart className="text-pink-500 mb-1" size={32} />
        {/* TODO: i18n */}
        <h3 className="text-xl font-bold">Confirmar Asistencia</h3>
        <p className="text-sm text-default-500">Juan Pérez</p>
        <div className="mt-2 w-full">
          <ClickableProgress
            current={safeIndex}
            total={steps.length}
            onChange={onStepChange}
          />
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-4 space-y-6">{renderStep()}</div>

      {/* Footer */}
      <div className="flex justify-between px-6 pb-6 pt-2">
        {safeIndex > 0 ? (
          <Button variant="light" onPress={() => onStepChange(safeIndex - 1)}>
            Atrás {/* TODO: i18n */}
          </Button>
        ) : (
          <Button variant="light" isDisabled>
            Cancelar {/* TODO: i18n */}
          </Button>
        )}

        {isLastStep ? (
          <Button color="primary" isDisabled>
            {attendance === "attending"
              ? "Confirmar Asistencia"
              : "Enviar Respuesta"}{" "}
            {/* TODO: i18n */}
          </Button>
        ) : (
          <Button color="primary" onPress={() => onStepChange(safeIndex + 1)}>
            Siguiente {/* TODO: i18n */}
          </Button>
        )}
      </div>
    </div>
  );
}
