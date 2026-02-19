"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Section } from "@/components/section";
import RSVPModal from "@/components/RSVPModal";
import PendingRSVP from "./RSVPStatus/PendingRSVP";
import ConfirmedRSVP from "./RSVPStatus/ConfirmedRSVP";
import DeclinedRSVP from "./RSVPStatus/DeclinedRSVP";
import { DecorationLayer } from "@/components/ui/DecorationLayer";
import { DecorationSvg, DecorationPattern } from "@/types/decoration";
import {
  RSVPAttendanceStep,
  RSVPPendingContent,
  RSVPConfirmedContent,
  RSVPDeclinedContent,
  RSVPMenuStep,
  RSVPDietaryStep,
  RSVPMessageStep,
} from "./RSVPSection/RSVPSection.metadata";

interface RSVPUser {
  hasResponded: boolean;
  isAttending?: boolean | null;
  guestCount?: number | null;
  maxGuests: number;
}

// Full config passed down from section settings to modal and status components
export interface RSVPStepConfig {
  attendanceStep: RSVPAttendanceStep;
  pendingContent: RSVPPendingContent;
  confirmedContent: RSVPConfirmedContent;
  declinedContent: RSVPDeclinedContent;
  menuStep: RSVPMenuStep;
  dietaryStep: RSVPDietaryStep;
  messageStep: RSVPMessageStep;
}

interface RSVPSectionClientProps {
  user: RSVPUser;
  stepConfig: RSVPStepConfig;
  hasAlternateBg?: boolean;
  decorationSvg: DecorationSvg;
  decorationPattern: DecorationPattern;
  decorationOpacity: number;
  decorationSize: number;
}

export default function RSVPSectionClient({
  user,
  stepConfig,
  hasAlternateBg = false,
  decorationSvg,
  decorationPattern,
  decorationOpacity,
  decorationSize,
}: RSVPSectionClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleOpenRSVPModal = () => setIsModalOpen(true);
    window.addEventListener("openRSVPModal", handleOpenRSVPModal);
    return () =>
      window.removeEventListener("openRSVPModal", handleOpenRSVPModal);
  }, []);

  const handleRSVPSuccess = () => router.refresh();
  const handleOpenModal = () => setIsModalOpen(true);

  function renderContent() {
    if (!user.hasResponded) {
      return (
        <PendingRSVP
          onOpenModal={handleOpenModal}
          content={stepConfig.pendingContent}
        />
      );
    }
    if (user.isAttending) {
      return (
        <ConfirmedRSVP
          guestCount={user.guestCount || 0}
          maxGuests={user.maxGuests}
          onOpenModal={handleOpenModal}
          content={stepConfig.confirmedContent}
        />
      );
    }
    return (
      <DeclinedRSVP
        onOpenModal={handleOpenModal}
        content={stepConfig.declinedContent}
      />
    );
  }

  return (
    <>
      <div className="animate-fade-in-up" style={{ animationDelay: "900ms" }}>
        <DecorationLayer
          key={`rsvp-client-decoration-${hasAlternateBg}`}
          svg={decorationSvg}
          pattern={decorationPattern}
          opacity={decorationOpacity}
          size={decorationSize}
          hasAlternateBg={hasAlternateBg}
        >
          <Section.Container id="rsvp-section" hasAlternateBg={hasAlternateBg}>
            {renderContent()}
          </Section.Container>
        </DecorationLayer>
      </div>

      <RSVPModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleRSVPSuccess}
        stepConfig={stepConfig}
      />
    </>
  );
}
