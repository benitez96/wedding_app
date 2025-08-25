import { Camera } from "lucide-react";
import { Button } from "@heroui/button";
import { Section } from "@/components/section";
import AnimatedSection from "@/components/AnimatedSection";
import Image from "next/image";

export default function PhotoUploadSection() {
  return (
    <AnimatedSection delay={1.0}>
      <Section.Container>
        <Section.Icon>
          <Image src="/icons/fotos.gif" alt="Fotos y Videos" width={100} height={100} />
        </Section.Icon>
        <Section.Description isDecorative>
          Queremos ver como la pasaste!
        </Section.Description>
        
        <Button
          color="primary"
          startContent={<Camera className="w-4 h-4" />}
        >
          SUBIR FOTOS Y VIDEOS
        </Button>
        <Section.Description>
          Subi las fotos y videos desde tu mesa
        </Section.Description>
      </Section.Container>
    </AnimatedSection>
  );
}
