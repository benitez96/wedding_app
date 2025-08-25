import { Church, MapPin } from "lucide-react";
import { Button } from "@heroui/button";
import { Section } from "@/components/section";
import AnimatedSection from "@/components/AnimatedSection";
import Image from "next/image";

export default function CeremonySection() {
  return (
    <AnimatedSection delay={0.4}>
      <Section.Container>
        <Section.Icon>
          <Image src="/icons/anillos-boda-1.gif" alt="Ceremonia" width={100} height={100} />
        </Section.Icon>
        <Section.Title>CEREMONIA</Section.Title>
        <Section.Description>19:00hs, en la Iglesia Nuestra Señora del Carmen</Section.Description>
        <Button
          color="primary"
          startContent={<MapPin className="w-4 h-4" />}
        >
          LLEGAR A LA CEREMONIA
        </Button>
      </Section.Container>
    </AnimatedSection>
  );
}
