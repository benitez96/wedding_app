import AnimatedSectionCSS from "@/components/AnimatedSectionCSS";
import { Section } from "@/components/section";
import { QuoteSectionSettings } from "./QuoteSection.metadata";
import { getAlternateBgClasses } from "@/lib/section-styles";
import clsx from "clsx";

interface QuoteSectionProps {
  settings?: QuoteSectionSettings;
}

export default function QuoteSection({ settings }: QuoteSectionProps) {
  const quoteText =
    settings?.quoteText ||
    "El amor nos unió, y queremos compartir nuestra felicidad con vos.";
  const showQuote = settings?.showQuote ?? true;
  const hasAlternateBg = settings?.hasAlternateBg ?? true;

  const styles = getAlternateBgClasses(hasAlternateBg);

  if (!showQuote) {
    return null;
  }

  return (
    <AnimatedSectionCSS delay={0.2}>
      <section
        className={clsx(
          "flex flex-col items-center justify-center p-4",
          styles.container,
        )}
      >
        <Section.Description isDecorative>{quoteText}</Section.Description>
      </section>
    </AnimatedSectionCSS>
  );
}
