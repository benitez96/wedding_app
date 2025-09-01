'use client'

import { useState, useEffect } from "react";
import { Section } from "@/components/section";
import AnimatedSection from "@/components/AnimatedSection";
import RSVPModal from "@/components/RSVPModal";
import { getCurrentUserData } from "@/app/actions/protected-invitations";
import { PendingRSVP, ConfirmedRSVP, DeclinedRSVP } from "./RSVPStatus";

export default function RSVPSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const result = await getCurrentUserData();
      if (result.success && result.user) {
        setUser(result.user);
      }
    } catch (error) {
      console.error('Error al cargar datos del usuario:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRSVPSuccess = () => {
    // Recargar los datos del usuario para mostrar el estado actualizado
    loadUserData();
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const renderRSVPContent = () => {
    if (!user) return null;
    
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
    } else {
      return <DeclinedRSVP onOpenModal={handleOpenModal} />;
    }
  };

  if (isLoading) {
    return (
      <AnimatedSection delay={0.9}>
        <Section.Container>
          <div className="animate-pulse space-y-4">
            <div className="w-24 h-24 bg-default-200 rounded-full mx-auto"></div>
            <div className="h-4 bg-default-200 rounded w-3/4 mx-auto"></div>
            <div className="h-10 bg-default-200 rounded w-48 mx-auto"></div>
            <div className="h-4 bg-default-200 rounded w-1/2 mx-auto"></div>
          </div>
        </Section.Container>
      </AnimatedSection>
    );
  }

  return (
    <>
      <AnimatedSection delay={0.9}>
        <Section.Container>
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
