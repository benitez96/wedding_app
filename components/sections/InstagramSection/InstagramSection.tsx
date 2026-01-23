import { Instagram } from "lucide-react";
import { Button } from "@heroui/button";
import { Section } from "@/components/section";
import AnimatedSectionCSS from "@/components/AnimatedSectionCSS";
import Link from "next/link";
import { InstagramSectionSettings } from "./InstagramSection.metadata";
import { getAlternateBgClasses } from "@/lib/section-styles";
import { DecorationLayer } from "@/components/ui/DecorationLayer";
import { DecorationSvg, DecorationPattern } from "@/types/decoration";
import { useSectionIcon } from "@/hooks/useSectionIcon";
import { SectionIcon } from "@/types/section-icon";

interface InstagramSectionProps {
  settings?: InstagramSectionSettings;
}

export default function InstagramSection({ settings }: InstagramSectionProps) {
  const quoteText = settings?.quoteText || "Si hay foto, hay historia!";
  const instagramHandle = settings?.instagramHandle || "@wedding_danysol";
  const instagramUrl =
    settings?.instagramUrl || "https://www.instagram.com/wedding_danysol";
  const description =
    settings?.description ||
    "Seguinos en nuestra cuenta de instagram y etiquetanos en tus fotos y videos!";
  const hasAlternateBg = settings?.hasAlternateBg ?? false;

  // Ícono de sección
  const sectionIcon = (settings?.icon || "instagram") as SectionIcon;
  const { IconComponent } = useSectionIcon({
    icon: sectionIcon,
    size: 100,
    alt: "Instagram",
  });

  // Decoraciones
  const decorationSvg = (settings?.decorationSvg || "none") as DecorationSvg;
  const decorationPattern = (settings?.decorationPattern ||
    "none") as DecorationPattern;
  const decorationOpacity = settings?.decorationOpacity ?? 10;
  const decorationSize = settings?.decorationSize ?? 60;

  const styles = getAlternateBgClasses(hasAlternateBg);

  return (
    <AnimatedSectionCSS delay={0.8}>
      <DecorationLayer
        svg={decorationSvg}
        pattern={decorationPattern}
        opacity={decorationOpacity}
        size={decorationSize}
        hasAlternateBg={hasAlternateBg}
      >
        <Section.Container hasAlternateBg={hasAlternateBg}>
          {IconComponent && <Section.Icon>{IconComponent}</Section.Icon>}
          <Section.Description isDecorative>{quoteText}</Section.Description>
          <Button
            color={styles.buttonColor}
            variant={styles.buttonVariant}
            className={styles.buttonClassName}
            startContent={<Instagram className="w-4 h-4" />}
            as={Link}
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {instagramHandle}
          </Button>
          <Section.Description>{description}</Section.Description>
        </Section.Container>
      </DecorationLayer>
    </AnimatedSectionCSS>
  );
}
