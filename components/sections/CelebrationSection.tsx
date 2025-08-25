import { Martini, MapPin } from "lucide-react";
import { Button } from "@heroui/button";
import { Section } from "@/components/section";
import AnimatedSection from "@/components/AnimatedSection";
import Image from "next/image";

export default function CelebrationSection() {
  return (
    <AnimatedSection delay={0.5}>
      <Section.Container>
          <Section.Icon>
            <Image src="/icons/copas-fiesta-1.gif" alt="Ceremonia" width={100} height={100} />
        </Section.Icon>
        <Section.Title>CELEBRACIÓN</Section.Title>
        <Section.Description>
          Despues de la Ceremonia festejaremos en el Club Union
        </Section.Description>
        <Button
          color="primary"
          startContent={<MapPin className="w-4 h-4" />}
        >
          LLEGAR A LA CELEBRACIÓN
        </Button>
      </Section.Container>
    </AnimatedSection>
  );
}
