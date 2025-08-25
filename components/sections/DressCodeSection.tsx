import { Shirt } from "lucide-react";
import { Section } from "@/components/section";
import AnimatedSection from "@/components/AnimatedSection";
import Image from "next/image";

export default function DressCodeSection() {
  return (
    <AnimatedSection delay={0.6}>
      <Section.Container>
        <Section.Icon>
          <Image src="/icons/dress-code.gif" alt="Dress Code" width={100} height={100} />
        </Section.Icon>
        <Section.Title>DRESS CODE</Section.Title>
        <Section.Description isDecorative className="text-4xl font-semibold">
          Formal
        </Section.Description>
        <Section.Description className="text-sm text-foreground/70">
          (No blanco)
        </Section.Description>
        <Section.Description >
          Sugerencia de colores
        </Section.Description>
      <div className="flex flex-row gap-4 mt-4">
        <span className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-850 inline-block" title="Negro"></span>
        <span className="w-8 h-8 rounded-full bg-sky-900 border-2 border-sky-950 inline-block" title="Azul marino"></span>
        <span className="w-8 h-8 rounded-full bg-amber-200 border-2 border-amber-300 inline-block" title="Beige"></span>
        <span className="w-8 h-8 rounded-full bg-stone-400 border-2 border-stone-600 inline-block" title="Gris"></span>
        <span className="w-8 h-8 rounded-full bg-yellow-700 border-2 border-yellow-800 inline-block" title="Marrón"></span>
      </div>
      </Section.Container>
    </AnimatedSection>
  );
}
