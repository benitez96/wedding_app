"use client";

import { useEffect, useState, useRef } from "react";
import { getCurrentUserData } from "@/app/actions/protected-invitations";
import RSVPReminderModal from "./RSVPReminderModal";
import { shouldShowReminder } from "@/lib/rsvp-reminder-utils";

interface RSVPReminderHandlerProps {
  weddingTimestamp: number;
  remindRestingDays: number;
}

export default function RSVPReminderHandler({
  weddingTimestamp,
  remindRestingDays,
}: RSVPReminderHandlerProps) {
  const [showModal, setShowModal] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modalTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let isActive = true;

    const checkAndShowReminder = async () => {
      try {
        // Obtener datos del usuario
        const userResult = await getCurrentUserData();

        if (!userResult.success || !userResult.user) {
          return;
        }

        // Verificar si debe mostrar el recordatorio (lógica pura en utils)
        const { shouldShow } = shouldShowReminder({
          weddingTimestamp,
          remindRestingDays,
          hasResponded: userResult.user.hasResponded,
        });

        if (shouldShow && isActive) {
          setShowModal(true);
        }
      } catch (error) {
        console.error("Error al verificar recordatorio RSVP:", error);
      } finally {
        if (isActive) {
          setHasChecked(true);
        }
      }
    };

    checkAndShowReminder();

    return () => {
      isActive = false;
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (modalTimeoutRef.current) {
        clearTimeout(modalTimeoutRef.current);
      }
    };
  }, [weddingTimestamp, remindRestingDays]);

  const handleGoToRSVP = () => {
    // Cerrar el modal primero y luego hacer scroll
    setShowModal(false);

    // Usar un pequeño delay para asegurar que el modal se cierre y el DOM esté listo
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      const rsvpSection = document.getElementById("rsvp-section");
      if (rsvpSection) {
        // Calcular offset para compensar cualquier header fijo
        const yOffset = -20;
        const y =
          rsvpSection.getBoundingClientRect().top +
          window.pageYOffset +
          yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });

        // Disparar evento personalizado para abrir el modal de RSVP
        // Usar un delay adicional para que el scroll termine primero
        if (modalTimeoutRef.current) {
          clearTimeout(modalTimeoutRef.current);
        }
        modalTimeoutRef.current = setTimeout(() => {
          window.dispatchEvent(new CustomEvent("openRSVPModal"));
        }, 500);
      }
    }, 300);
  };

  if (!hasChecked) {
    return null;
  }

  return (
    <RSVPReminderModal
      isOpen={showModal}
      onClose={() => setShowModal(false)}
      onGoToRSVP={handleGoToRSVP}
      weddingTimestamp={weddingTimestamp}
    />
  );
}
