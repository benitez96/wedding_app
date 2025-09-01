
import { ChevronDown } from "lucide-react";
import { Section } from "@/components/section";
import Image from "next/image";

export default function HeroSection() {
  return (
    <Section.Container className="animate-fade-in">
      <Image src="/logo-2.jpeg" alt="Hero" width={600} height={800} className="h-[calc(100svh-125px)] object-fit" />
      <h2 className="text-3xl md:text-4xl">NUESTRA BODA</h2>
      <ChevronDown className="h-10 w-10 animate-bounce" />
    </Section.Container>
  );
}
