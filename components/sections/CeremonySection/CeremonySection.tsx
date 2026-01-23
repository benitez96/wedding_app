import { MapPin } from "lucide-react";
import { Button } from "@heroui/button";
import { Section } from "@/components/section";
import AnimatedSectionCSS from "@/components/AnimatedSectionCSS";
import Link from "next/link";
import { CeremonySectionSettings } from "./CeremonySection.metadata";
import { getAlternateBgClasses } from "@/lib/section-styles";
import { DecorationLayer } from "@/components/ui/DecorationLayer";
import { DecorationSvg, DecorationPattern } from "@/types/decoration";
import { useSectionIcon } from "@/hooks/useSectionIcon";
import { SectionIcon } from "@/types/section-icon";

interface CeremonySectionProps {
  settings?: CeremonySectionSettings;
}

export default function CeremonySection({ settings }: CeremonySectionProps) {
  const time = settings?.time || "19:30hs";
  const venueName = settings?.venueName || "Iglesia Nuestra Señora del Carmen";
  const mapsUrl =
    settings?.mapsUrl || "https://maps.app.goo.gl/pwTwQ4vJzbBt1h1C9";
  const showDirectionsButton = settings?.showDirectionsButton ?? true;
  const hasAlternateBg = settings?.hasAlternateBg ?? false;

  // Ícono de sección
  const sectionIcon = (settings?.icon || "rings-1") as SectionIcon;
  const { IconComponent } = useSectionIcon({
    icon: sectionIcon,
    size: 100,
    alt: "Ceremonia",
  });

  // Decoraciones
  const decorationSvg = (settings?.decorationSvg || "none") as DecorationSvg;
  const decorationPattern = (settings?.decorationPattern ||
    "none") as DecorationPattern;
  const decorationOpacity = settings?.decorationOpacity ?? 10;
  const decorationSize = settings?.decorationSize ?? 60;

  const styles = getAlternateBgClasses(hasAlternateBg);

  return (
    <AnimatedSectionCSS delay={0.4}>
      <DecorationLayer
        svg={decorationSvg}
        pattern={decorationPattern}
        opacity={decorationOpacity}
        size={decorationSize}
        hasAlternateBg={hasAlternateBg}
      >
        <Section.Container hasAlternateBg={hasAlternateBg}>
          {IconComponent && <Section.Icon>{IconComponent}</Section.Icon>}
          <Section.Title>CEREMONIA</Section.Title>
          <Section.Description>
            {time}, en {venueName}
          </Section.Description>
          {showDirectionsButton && (
            <Button
              color={styles.buttonColor}
              variant={styles.buttonVariant}
              className={styles.buttonClassName}
              startContent={<MapPin className="w-4 h-4" />}
              as={Link}
              href={mapsUrl}
              target="_blank"
            >
              LLEGAR A LA CEREMONIA
            </Button>
          )}
        </Section.Container>
      </DecorationLayer>
    </AnimatedSectionCSS>
  );
}
