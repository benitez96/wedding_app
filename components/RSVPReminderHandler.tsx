"use client";

import { useEffect, useState, useRef } from "react";
import { getCurrentUserData } from "@/app/actions/protected-invitations";
import RSVPReminderModal from "./RSVPReminderModal";

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

        // Verificar si el usuario ya respondió
        if (userResult.user.hasResponded) {
          return;
        }

        // Calcular días restantes
        // Como el contenedor Docker está configurado con timezone Argentina,
        // new Date() ya devuelve la hora correcta de Argentina
        const today = new Date();
        const diffTime = weddingTimestamp - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Mostrar modal si faltan menos de los días configurados
        if (diffDays < remindRestingDays && diffDays > 0 && isActive) {
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
