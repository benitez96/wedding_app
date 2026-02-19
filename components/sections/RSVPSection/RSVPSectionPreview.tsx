"use client";

import { useState } from "react";
import RSVPSection, { DEFAULT_STEP_CONFIG } from "./RSVPSection";
import { RSVPSectionSettings } from "./RSVPSection.metadata";
import {
  RSVPModalPreview,
  buildPreviewSteps,
} from "@/components/RSVPModal/RSVPModalPreview";
import type { SectionUser } from "@/types/sections";
import type { RSVPStepConfig } from "@/components/sections/RSVPSectionClient";

interface RSVPSectionPreviewProps {
  settings?: RSVPSectionSettings;
}

type PreviewState = "pending" | "confirmed" | "declined";

const MOCK_USERS: Record<PreviewState, SectionUser> = {
  pending: {
    id: "preview-user-123",
    guestName: "Juan Pérez",
    maxGuests: 2,
    hasResponded: false,
    isAttending: null,
    guestCount: null,
  },
  confirmed: {
    id: "preview-user-123",
    guestName: "Juan Pérez",
    maxGuests: 2,
    hasResponded: true,
    isAttending: true,
    guestCount: 2,
  },
  declined: {
    id: "preview-user-123",
    guestName: "Juan Pérez",
    maxGuests: 2,
    hasResponded: true,
    isAttending: false,
    guestCount: null,
  },
};

function buildStepConfig(
  settings: RSVPSectionSettings | undefined,
): RSVPStepConfig {
  return {
    attendanceStep:
      settings?.attendanceStep ?? DEFAULT_STEP_CONFIG.attendanceStep,
    pendingContent:
      settings?.pendingContent ?? DEFAULT_STEP_CONFIG.pendingContent,
    confirmedContent:
      settings?.confirmedContent ?? DEFAULT_STEP_CONFIG.confirmedContent,
    declinedContent:
      settings?.declinedContent ?? DEFAULT_STEP_CONFIG.declinedContent,
    menuStep: settings?.menuStep ?? DEFAULT_STEP_CONFIG.menuStep,
    dietaryStep: settings?.dietaryStep ?? DEFAULT_STEP_CONFIG.dietaryStep,
    messageStep: settings?.messageStep ?? DEFAULT_STEP_CONFIG.messageStep,
  };
}

/**
 * Wrapper de RSVPSection para preview en backoffice.
 *
 * _previewState drives what's rendered:
 *   "pending" | "confirmed" | "declined"  → section status view with mock user
 *   "modal:attendance" | "modal:menu" | etc → inline modal preview for that step
 *
 * Modal navigation state (modalStepIndex) is owned HERE so it survives settings
 * field edits — those only change props, they don't remount this component.
 * When the active tab changes (new _previewState), we sync the index via
 * React's getDerivedStateFromProps pattern (setState during render).
 *
 * _previewState is NOT part of the Zod schema — it gets stripped on save.
 */
export default function RSVPSectionPreview({
  settings,
}: RSVPSectionPreviewProps) {
  const rawPreviewState =
    ((settings as Record<string, unknown>)?._previewState as string) ??
    "pending";

  const stepConfig = buildStepConfig(settings);
  const isModalPreview = rawPreviewState.startsWith("modal:");

  // Modal step navigation — owned here so field edits don't reset it
  const [modalStepIndex, setModalStepIndex] = useState(0);
  const [prevPreviewState, setPrevPreviewState] = useState(rawPreviewState);

  // Sync step index when the tab changes — getDerivedStateFromProps pattern.
  // Calling setState during render is intentional and supported by React for this case.
  if (rawPreviewState !== prevPreviewState) {
    setPrevPreviewState(rawPreviewState);

    if (isModalPreview) {
      const requestedStepId = rawPreviewState.slice("modal:".length);
      const steps = buildPreviewSteps("attending", stepConfig);
      const requestedIndex = steps.indexOf(
        requestedStepId as (typeof steps)[number],
      );
      setModalStepIndex(requestedIndex >= 0 ? requestedIndex : 0);
    }
  }

  if (isModalPreview) {
    return (
      <div className="p-6">
        <RSVPModalPreview
          stepConfig={stepConfig}
          currentStepIndex={modalStepIndex}
          onStepChange={setModalStepIndex}
        />
      </div>
    );
  }

  const previewState = (rawPreviewState as PreviewState) ?? "pending";
  const mockUser = MOCK_USERS[previewState] ?? MOCK_USERS.pending;

  return <RSVPSection settings={settings} user={mockUser} />;
}
