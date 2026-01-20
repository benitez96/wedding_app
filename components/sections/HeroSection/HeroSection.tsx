import { ChevronDown } from "lucide-react";
import { Section } from "@/components/section";
import Image from "next/image";
import { HeroSectionSettings } from "./HeroSection.metadata";

interface HeroSectionProps {
  settings?: HeroSectionSettings;
}

export default function HeroSection({ settings }: HeroSectionProps) {
  const imageUrl = settings?.imageUrl || "/logo-2.jpeg";
  const title = settings?.title || "NUESTRA BODA";
  const showScrollIndicator = settings?.showScrollIndicator ?? true;

  return (
    <Section.Container className="animate-fade-in">
      <Image
        src={imageUrl}
        alt="Hero"
        width={600}
        height={800}
        priority
        className="h-[calc(100svh-125px)] object-fit"
      />
      <h2 className="text-3xl md:text-4xl">{title}</h2>
      {showScrollIndicator && (
        <ChevronDown className="h-10 w-10 animate-bounce" />
      )}
    </Section.Container>
  );
}
