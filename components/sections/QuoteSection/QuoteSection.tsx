import AnimatedSectionCSS from "@/components/AnimatedSectionCSS";
import { Section } from "@/components/section";
import { QuoteSectionSettings } from "./QuoteSection.metadata";

interface QuoteSectionProps {
  settings?: QuoteSectionSettings;
}

export default function QuoteSection({ settings }: QuoteSectionProps) {
  const quoteText =
    settings?.quoteText ||
    "El amor nos unió, y queremos compartir nuestra felicidad con vos.";
  const showQuote = settings?.showQuote ?? true;

  if (!showQuote) {
    return null;
  }

  return (
    <AnimatedSectionCSS delay={0.2}>
      <section className="bg-secondary text-secondary-foreground flex flex-col items-center justify-center p-4">
        <Section.Description isDecorative>{quoteText}</Section.Description>
      </section>
    </AnimatedSectionCSS>
  );
}
