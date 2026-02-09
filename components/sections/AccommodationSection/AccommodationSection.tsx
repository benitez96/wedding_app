import { Section } from "@/components/section";
import AnimatedSectionCSS from "@/components/AnimatedSectionCSS";
import AccommodationList from "@/components/sections/AccommodationList";
import { AccommodationSectionSettings } from "./AccommodationSection.metadata";
import { DecorationLayer } from "@/components/ui/DecorationLayer";
import { DecorationSvg, DecorationPattern } from "@/types/decoration";
import { SectionIcon } from "@/components/ui/SectionIcon";
import { SectionIcon as SectionIconType } from "@/types/section-icon";

const accommodations = [
  {
    name: "Hotel Santa Ines",
    phone: "+54 9 3777 20-0505",
    description: "Ubicado en el centro de la ciudad",
    distance: "3 min del salón a pie",
  },
  {
    name: "Hotel La Casona",
    phone: "+54 9 3777 45-2357",
    description: "Ubicado en el centro de la ciudad",
    distance: "3 min del salón a pie",
  },
  {
    name: "Hotel Victoria",
    phone: "+54 9 3777 45-2348",
    description: "Ubicado en el centro de la ciudad",
    distance: "11 min del salón a pie",
  },
  {
    name: "Hotel Rio Arriba",
    phone: "+54 9 3777 45-0376",
    description: "Ubicado sobre la costanera de la ciudad",
    distance: "12 min del salón a pie",
  },
  {
    name: "Cabañas Bella Vista",
    phone: "+54 9 3777 45-1555",
    description: "Ubicado sobre la costanera de la ciudad",
    distance: "13 min del salón a pie",
  },
];

interface AccommodationSectionProps {
  settings?: AccommodationSectionSettings;
}

export default function AccommodationSection({
  settings,
}: AccommodationSectionProps) {
  const title = settings?.title || "ALOJAMIENTOS";
  const description =
    settings?.description ||
    "Sabemos que podés venir de lejos, así que te facilitamos algunos teléfonos de alojamientos cercanos";
  const hasAlternateBg = settings?.hasAlternateBg ?? false;

  // Section icon
  const sectionIcon = (settings?.icon || "accommodation") as SectionIconType;

  // Decoraciones
  const decorationSvg = (settings?.decorationSvg || "none") as DecorationSvg;
  const decorationPattern = (settings?.decorationPattern ||
    "none") as DecorationPattern;
  const decorationOpacity = settings?.decorationOpacity ?? 10;
  const decorationSize = settings?.decorationSize ?? 60;

  return (
    <AnimatedSectionCSS delay={0.6}>
      <DecorationLayer
        svg={decorationSvg}
        pattern={decorationPattern}
        opacity={decorationOpacity}
        size={decorationSize}
        hasAlternateBg={hasAlternateBg}
      >
        <Section.Container hasAlternateBg={hasAlternateBg}>
          <Section.Icon>
            <SectionIcon icon={sectionIcon} size={100} alt="Accommodation" />
          </Section.Icon>
          <Section.Title>{title}</Section.Title>
          <Section.Description isDecorative>{description}</Section.Description>
          <AccommodationList accommodations={accommodations} />
        </Section.Container>
      </DecorationLayer>
    </AnimatedSectionCSS>
  );
}
