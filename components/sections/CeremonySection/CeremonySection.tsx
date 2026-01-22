import { MapPin } from "lucide-react";
import { Button } from "@heroui/button";
import { Section } from "@/components/section";
import AnimatedSectionCSS from "@/components/AnimatedSectionCSS";
import Image from "next/image";
import Link from "next/link";
import { CeremonySectionSettings } from "./CeremonySection.metadata";
import { getAlternateBgClasses } from "@/lib/section-styles";
import { DecorationLayer } from "@/components/ui/DecorationLayer";
import { DecorationSvg, DecorationPattern } from "@/types/decoration";

interface CeremonySectionProps {
  settings?: CeremonySectionSettings;
}

export default function CeremonySection({ settings }: CeremonySectionProps) {
  const time = settings?.time || "19:30hs";
  const venueName = settings?.venueName || "Iglesia Nuestra Señora del Carmen";
  const mapsUrl =
    settings?.mapsUrl || "https://maps.app.goo.gl/pwTwQ4vJzbBt1h1C9";
  const iconUrl = settings?.iconUrl || "/icons/anillos-boda-1.gif";
  const showDirectionsButton = settings?.showDirectionsButton ?? true;
  const hasAlternateBg = settings?.hasAlternateBg ?? false;

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
      >
        <Section.Container hasAlternateBg={hasAlternateBg}>
          <Section.Icon>
            <Image src={iconUrl} alt="Ceremonia" width={100} height={100} />
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
