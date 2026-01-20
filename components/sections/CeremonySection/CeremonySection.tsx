import { MapPin } from "lucide-react";
import { Button } from "@heroui/button";
import { Section } from "@/components/section";
import AnimatedSectionCSS from "@/components/AnimatedSectionCSS";
import Image from "next/image";
import Link from "next/link";
import { CeremonySectionSettings } from "./CeremonySection.metadata";

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

  return (
    <AnimatedSectionCSS delay={0.4}>
      <Section.Container>
        <Section.Icon>
          <Image src={iconUrl} alt="Ceremonia" width={100} height={100} />
        </Section.Icon>
        <Section.Title>CEREMONIA</Section.Title>
        <Section.Description>
          {time}, en {venueName}
        </Section.Description>
        {showDirectionsButton && (
          <Button
            color="primary"
            startContent={<MapPin className="w-4 h-4" />}
            as={Link}
            href={mapsUrl}
            target="_blank"
          >
            LLEGAR A LA CEREMONIA
          </Button>
        )}
      </Section.Container>
    </AnimatedSectionCSS>
  );
}
