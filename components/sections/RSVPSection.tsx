import { Heart, Check } from "lucide-react";
import { Button } from "@heroui/button";
import { Section } from "@/components/section";
import AnimatedSection from "@/components/AnimatedSection";
import Image from "next/image";

export default function RSVPSection() {
  return (
    <AnimatedSection delay={0.9}>
      <Section.Container>
        <Section.Icon>
          <Image src="/icons/RSVP.gif" alt="Confirmar Asistencia" width={100} height={100} />
        </Section.Icon>
        <Section.Description isDecorative>Decile "Si acepto" a nuestra invitacion</Section.Description>
        <Button
          color="primary"
          startContent={<Check className="w-4 h-4" />}
        >
          CONFIRMAR ASISTENCIA
        </Button>
        <Section.Description>
          Tenes tiempo hasta el 10 de Enero!
        </Section.Description>
      </Section.Container>
    </AnimatedSection>
  );
}
