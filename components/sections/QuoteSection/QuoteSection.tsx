import AnimatedSectionCSS from "@/components/AnimatedSectionCSS";
import { Section } from "@/components/section";
import { QuoteSectionSettings } from "./QuoteSection.metadata";
import { getAlternateBgClasses } from "@/lib/section-styles";
import clsx from "clsx";
import { DecorationLayer } from "@/components/ui/DecorationLayer";
import { DecorationSvg, DecorationPattern } from "@/types/decoration";

interface QuoteSectionProps {
  settings?: QuoteSectionSettings;
}

export default function QuoteSection({ settings }: QuoteSectionProps) {
  const quoteText =
    settings?.quoteText ||
    "El amor nos unió, y queremos compartir nuestra felicidad con vos.";
  const showQuote = settings?.showQuote ?? true;
  const hasAlternateBg = settings?.hasAlternateBg ?? true;

  // Decoraciones
  const decorationSvg = (settings?.decorationSvg || "none") as DecorationSvg;
  const decorationPattern = (settings?.decorationPattern ||
    "none") as DecorationPattern;
  const decorationOpacity = settings?.decorationOpacity ?? 10;
  const decorationSize = settings?.decorationSize ?? 60;

  const styles = getAlternateBgClasses(hasAlternateBg);

  if (!showQuote) {
    return null;
  }

  return (
    <AnimatedSectionCSS delay={0.2}>
      <DecorationLayer
        svg={decorationSvg}
        pattern={decorationPattern}
        opacity={decorationOpacity}
        size={decorationSize}
        hasAlternateBg={hasAlternateBg}
      >
        <section
          className={clsx(
            "relative flex flex-col items-center justify-center p-4",
            styles.text,
          )}
        >
          {/* Background layer (-z-10) */}
          {hasAlternateBg && (
            <div className={clsx("absolute inset-0 -z-10", styles.container)} />
          )}
          {/* Content layer (z-10) */}
          <div className="relative z-10 flex flex-col items-center justify-center w-full">
            <Section.Description isDecorative>{quoteText}</Section.Description>
          </div>
        </section>
      </DecorationLayer>
    </AnimatedSectionCSS>
  );
}
