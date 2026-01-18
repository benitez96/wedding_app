"use client";

import { Button } from "@heroui/react";
import { Calendar } from "lucide-react";

export default function FloatingRSVPButton() {
  const scrollToRSVP = () => {
    requestAnimationFrame(() => {
      const rsvpSection = document.getElementById("rsvp-section");
      if (rsvpSection) {
        // Calcular offset para compensar cualquier header fijo
        const yOffset = -20;
        const y =
          rsvpSection.getBoundingClientRect().top +
          window.pageYOffset +
          yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    });
  };

  return (
    <Button
      color="primary"
      onPress={scrollToRSVP}
      size="lg"
      className="fixed bottom-6 right-6 z-50 rounded-full"
      isIconOnly
      aria-label="Ir a confirmar asistencia"
    >
      <Calendar className="w-5 h-5" />
    </Button>
  );
}
