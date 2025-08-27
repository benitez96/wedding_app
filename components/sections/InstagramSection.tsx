import { Instagram } from "lucide-react";
import { Button } from "@heroui/button";
import { Section } from "@/components/section";
import AnimatedSection from "@/components/AnimatedSection";
import Image from "next/image";
import Link from "next/link";

export default function InstagramSection() {
  return (
    <AnimatedSection delay={0.8}>
      <Section.Container>
        <Section.Icon>
          <Image src="/icons/instagram.gif" alt="Instagram" width={100} height={100} />
        </Section.Icon>
        <Section.Description isDecorative >
          Si hay foto, hay historia!
        </Section.Description>
        <Button 
          color="primary"
          startContent={<Instagram className="w-4 h-4" />}
          as={Link}
          href="https://www.instagram.com/wedding_danysol"
          target="_blank"
          rel="noopener noreferrer"
        >
          @wedding_danysol
        </Button>
        <Section.Description>
          Seguinos en nuestra cuenta de instagram y etiquetanos en tus fotos y videos!
        </Section.Description>
      </Section.Container>
    </AnimatedSection>
  );
}
