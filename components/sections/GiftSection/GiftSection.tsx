import { Snippet } from "@heroui/snippet";
import { Section } from "@/components/section";
import AnimatedSectionCSS from "@/components/AnimatedSectionCSS";
import { GiftSectionSettings } from "./GiftSection.metadata";
import { DecorationLayer } from "@/components/ui/DecorationLayer";
import { DecorationSvg, DecorationPattern } from "@/types/decoration";
import { SectionIcon } from "@/components/ui/SectionIcon";
import { SectionIcon as SectionIconType } from "@/types/section-icon";

interface GiftSectionProps {
  settings?: GiftSectionSettings;
}

export default function GiftSection({ settings }: GiftSectionProps) {
  const title = settings?.title || "REGALOS";
  const description =
    settings?.description ||
    "Tu compañía es el mejor regalo, pero si deseás ayudarnos…";
  const alias = settings?.alias || "DANI.SOL.HONEYMOON";
  const footerText =
    settings?.footerText || "Ayudanos con nuestra luna de miel";
  const hasAlternateBg = settings?.hasAlternateBg ?? false;

  // Section icon
  const sectionIcon = (settings?.icon || "gift-2") as SectionIconType;

  // Decoraciones
  const decorationSvg = (settings?.decorationSvg || "none") as DecorationSvg;
  const decorationPattern = (settings?.decorationPattern ||
    "none") as DecorationPattern;
  const decorationOpacity = settings?.decorationOpacity ?? 10;
  const decorationSize = settings?.decorationSize ?? 60;

  return (
    <AnimatedSectionCSS delay={0.7}>
      <DecorationLayer
        svg={decorationSvg}
        pattern={decorationPattern}
        opacity={decorationOpacity}
        size={decorationSize}
        hasAlternateBg={hasAlternateBg}
      >
        <Section.Container hasAlternateBg={hasAlternateBg}>
          <Section.Icon>
            <SectionIcon icon={sectionIcon} size={100} alt="Gift" />
          </Section.Icon>
          <Section.Title>{title}</Section.Title>
          <Section.Description isDecorative>{description}</Section.Description>
          <Snippet symbol=" " color="primary" variant="bordered" size="md">
            {alias}
          </Snippet>
          <Section.Description className="font-semibold">
            {footerText}
          </Section.Description>
        </Section.Container>
      </DecorationLayer>
    </AnimatedSectionCSS>
  );
}
