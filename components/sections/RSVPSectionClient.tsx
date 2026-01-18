"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Section } from "@/components/section";
import AnimatedSection from "@/components/AnimatedSection";
import RSVPModal from "@/components/RSVPModal";
import { PendingRSVP, ConfirmedRSVP, DeclinedRSVP } from "./RSVPStatus";

interface RSVPSectionClientProps {
  user: {
    hasResponded: boolean;
    isAttending?: boolean | null;
    guestCount?: number | null;
    maxGuests: number;
  };
}

export default function RSVPSectionClient({ user }: RSVPSectionClientProps) {
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
      <AnimatedSection delay={0.9}>
        <Section.Container id="rsvp-section">
          {renderRSVPContent()}
        </Section.Container>
      </AnimatedSection>

      <RSVPModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleRSVPSuccess}
      />
    </>
  );
}
