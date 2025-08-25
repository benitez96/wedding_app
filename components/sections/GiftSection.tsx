import { Gift } from "lucide-react";
import { Snippet } from "@heroui/snippet";
import { Section } from "@/components/section";
import AnimatedSection from "@/components/AnimatedSection";
import Image from "next/image";

export default function GiftSection() {
  return (
    <AnimatedSection delay={0.7}>
      <Section.Container>
        <Section.Icon>
          <Image src="/icons/regalo-2.gif" alt="Gift" width={100} height={100} />
        </Section.Icon>
        <Section.Title>REGALOS</Section.Title>
        <Section.Description isDecorative>La asistencia es obligatoria pero el regalo es opcional</Section.Description>
        <Snippet 
          symbol=" " 
          color="primary" 
          variant="bordered" 
          size="md" 
          >
          DANI.SOL.HONEYMOON
        </Snippet>
        <Section.Description className="font-semibold">Ayudanos con nuestra luna de miel</Section.Description>
      </Section.Container>
    </AnimatedSection>
  );
}
