import { Section } from "@/components/section";
import AnimatedSectionCSS from "@/components/AnimatedSectionCSS";
import AccommodationList from "@/components/sections/AccommodationList";
import {
  AccommodationSectionSettings,
  AccommodationSectionSettingsSchema,
} from "./AccommodationSection.metadata";
import { DecorationLayer } from "@/components/ui/DecorationLayer";
import { DecorationSvg, DecorationPattern } from "@/types/decoration";
import { SectionIcon } from "@/components/ui/SectionIcon";
import { SectionIcon as SectionIconType } from "@/types/section-icon";

interface AccommodationSectionProps {
  settings?: AccommodationSectionSettings;
}

export default function AccommodationSection({
  settings,
}: AccommodationSectionProps) {
  // Use safeParse to handle potentially invalid data gracefully
  const result = AccommodationSectionSettingsSchema.safeParse(settings || {});

  // If validation fails, use defaults from schema
  if (!result.success) {
    console.error(
      "AccommodationSection schema validation failed:",
      result.error.issues,
    );
    console.log("Settings received:", settings);
  }

  const parsed = result.success
    ? result.data
    : AccommodationSectionSettingsSchema.parse({});

  const title = parsed.title;
  const description = parsed.description;
  const accommodations = parsed.accommodations;
  const hasAlternateBg = parsed.hasAlternateBg;

  // Section icon
  const sectionIcon = parsed.icon as SectionIconType;

  // Decorations
  const decorationSvg = parsed.decorationSvg as DecorationSvg;
  const decorationPattern = parsed.decorationPattern as DecorationPattern;
  const decorationOpacity = parsed.decorationOpacity;
  const decorationSize = parsed.decorationSize;

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
