import { MapPin } from "lucide-react";
import { Button } from "@heroui/button";
import { Section } from "@/components/section";
import AnimatedSectionCSS from "@/components/AnimatedSectionCSS";
import Image from "next/image";
import Link from "next/link";
import { CelebrationSectionSettings } from "./CelebrationSection.metadata";
import { getAlternateBgClasses } from "@/lib/section-styles";
import { DecorationLayer } from "@/components/ui/DecorationLayer";
import { DecorationSvg, DecorationPattern } from "@/types/decoration";

interface CelebrationSectionProps {
  settings?: CelebrationSectionSettings;
}

export default function CelebrationSection({
  settings,
}: CelebrationSectionProps) {
  const description =
    settings?.description ||
    "Despues de la Ceremonia festejaremos en el Club Union";
  const mapsUrl =
    settings?.mapsUrl || "https://maps.app.goo.gl/AjTWBW7Y25sENdw36";
  const iconUrl = settings?.iconUrl || "/icons/copas-fiesta-1.gif";
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
    <AnimatedSectionCSS delay={0.5}>
      <DecorationLayer
        svg={decorationSvg}
        pattern={decorationPattern}
        opacity={decorationOpacity}
        size={decorationSize}
      >
        <Section.Container hasAlternateBg={hasAlternateBg}>
          <Section.Icon>
            <Image src={iconUrl} alt="Celebración" width={100} height={100} />
          </Section.Icon>
          <Section.Title>CELEBRACIÓN</Section.Title>
          <Section.Description>{description}</Section.Description>
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
              LLEGAR A LA CELEBRACIÓN
            </Button>
          )}
        </Section.Container>
      </DecorationLayer>
    </AnimatedSectionCSS>
  );
}
