import { Check } from "lucide-react";
import { Button } from "@heroui/button";
import { Section } from "@/components/section";
import Image from "next/image";

interface PendingRSVPProps {
  onOpenModal: () => void;
}

export default function PendingRSVP({ onOpenModal }: PendingRSVPProps) {
  return (
    <>
      <Section.Icon>
        <Image src="/icons/RSVP.gif" alt="Confirmar Asistencia" width={100} height={100} />
      </Section.Icon>
      <Section.Description isDecorative>Decile &ldquo;Si acepto&rdquo; a nuestra invitacion</Section.Description>
      <Button
        color="primary"
        startContent={<Check className="w-4 h-4" />}
        onPress={onOpenModal}
      >
        CONFIRMAR ASISTENCIA
      </Button>
      <Section.Description>
        Tenes tiempo hasta el 10 de Enero!
      </Section.Description>
    </>
  );
}
