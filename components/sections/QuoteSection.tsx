import AnimatedSection from "@/components/AnimatedSection";
import { Section } from "@/components/section";

export default function QuoteSection() {
  return (
    <AnimatedSection delay={0.2}>
      <section className="bg-secondary text-secondary-foreground flex flex-col items-center justify-center p-4">
        <Section.Description isDecorative>El amor nos unió, y queremos compartir nuestra felicidad con vos.</Section.Description>
      </section>
    </AnimatedSection>
  );
}
