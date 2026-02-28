import { MapPin } from "lucide-react";
import { Button } from "@heroui/button";
import Link from "next/link";
import { CeremonySectionSettings } from "./CeremonySection.metadata";
import { Section } from "@/components/section";
import AnimatedSectionCSS from "@/components/AnimatedSectionCSS";
import { getAlternateBgClasses } from "@/lib/section-styles";
import { DecorationLayer } from "@/components/ui/DecorationLayer";
import { DecorationSVGs, DecorationPatterns } from "@/types/decoration";
import { SectionIcon } from "@/components/ui/SectionIcon";
import { SectionIcon as SectionIconType } from "@/types/section-icon";

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

  // Section icon
  const sectionIcon = (settings?.icon || "rings-1") as SectionIconType;

  // Decoraciones
  const decorationSvg = settings?.decorationSvg ?? DecorationSVGs.NONE;
  const decorationPattern =
    settings?.decorationPattern ?? DecorationPatterns.CORNERS;
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
          <Section.Icon>
            <SectionIcon icon={sectionIcon} size={100} alt="Ceremony" />
          </Section.Icon>
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
