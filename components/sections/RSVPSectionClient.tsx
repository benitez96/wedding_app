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

interface RSVPSectionClientProps {
  user: {
    hasResponded: boolean;
    isAttending?: boolean | null;
    guestCount?: number | null;
    maxGuests: number;
  };
  hasAlternateBg?: boolean;
  decorationSvg: DecorationSvg;
  decorationPattern: DecorationPattern;
  decorationOpacity: number;
  decorationSize: number;
}

export default function RSVPSectionClient({
  user,
  hasAlternateBg = false,
  decorationSvg,
  decorationPattern,
  decorationOpacity,
  decorationSize,
}: RSVPSectionClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleOpenRSVPModal = () => {
      setIsModalOpen(true);
    };

    window.addEventListener("openRSVPModal", handleOpenRSVPModal);

    return () => {
      window.removeEventListener("openRSVPModal", handleOpenRSVPModal);
    };
  }, []);

  const handleRSVPSuccess = () => {
    router.refresh();
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const renderRSVPContent = () => {
    if (!user.hasResponded) {
      return <PendingRSVP onOpenModal={handleOpenModal} />;
    }

    if (user.isAttending) {
      return (
        <ConfirmedRSVP
          guestCount={user.guestCount || 0}
          maxGuests={user.maxGuests}
          onOpenModal={handleOpenModal}
        />
      );
    }

    return <DeclinedRSVP onOpenModal={handleOpenModal} />;
  };

  return (
    <>
      <div className="animate-fade-in-up" style={{ animationDelay: "900ms" }}>
        <DecorationLayer
          svg={decorationSvg}
          pattern={decorationPattern}
          opacity={decorationOpacity}
          size={decorationSize}
        >
          <Section.Container id="rsvp-section" hasAlternateBg={hasAlternateBg}>
            {renderRSVPContent()}
          </Section.Container>
        </DecorationLayer>
      </div>

      <RSVPModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleRSVPSuccess}
      />
    </>
  );
}
