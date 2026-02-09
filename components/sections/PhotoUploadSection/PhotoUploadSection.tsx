import { Camera } from "lucide-react";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { Section } from "@/components/section";
import AnimatedSectionCSS from "@/components/AnimatedSectionCSS";
import { PhotoUploadSectionSettings } from "./PhotoUploadSection.metadata";
import { getAlternateBgClasses } from "@/lib/section-styles";
import { DecorationLayer } from "@/components/ui/DecorationLayer";
import { DecorationSvg, DecorationPattern } from "@/types/decoration";
import { SectionIcon } from "@/components/ui/SectionIcon";
import { SectionIcon as SectionIconType } from "@/types/section-icon";

interface PhotoUploadSectionProps {
  settings?: PhotoUploadSectionSettings;
}

export default function PhotoUploadSection({
  settings,
}: PhotoUploadSectionProps) {
  const quoteText = settings?.quoteText || "Queremos ver como la pasaste!";
  const buttonText = settings?.buttonText || "SUBIR FOTOS Y VIDEOS";
  const description =
    settings?.description || "Subi las fotos y videos desde tu mesa";
  const hasAlternateBg = settings?.hasAlternateBg ?? false;

  // Section icon
  const sectionIcon = (settings?.icon || "photos-1") as SectionIconType;

  // Decoraciones
  const decorationSvg = (settings?.decorationSvg || "none") as DecorationSvg;
  const decorationPattern = (settings?.decorationPattern ||
    "none") as DecorationPattern;
  const decorationOpacity = settings?.decorationOpacity ?? 10;
  const decorationSize = settings?.decorationSize ?? 60;

  const styles = getAlternateBgClasses(hasAlternateBg);

  // URL de settings, o fallback a env variable
  const uploadUrl =
    settings?.uploadUrl || process.env.NEXT_PUBLIC_PHOTO_UPLOAD_URL || "";

  return (
    <AnimatedSectionCSS delay={1.0}>
      <DecorationLayer
        key={`photoupload-decoration-${hasAlternateBg}`}
        svg={decorationSvg}
        pattern={decorationPattern}
        opacity={decorationOpacity}
        size={decorationSize}
        hasAlternateBg={hasAlternateBg}
      >
        <Section.Container hasAlternateBg={hasAlternateBg}>
          <Section.Icon>
            <SectionIcon
              icon={sectionIcon}
              size={100}
              alt="Photos and Videos"
            />
          </Section.Icon>
          <Section.Description isDecorative>{quoteText}</Section.Description>

          <Button
            as={Link}
            href={uploadUrl}
            isExternal
            color={styles.buttonColor}
            variant={styles.buttonVariant}
            className={styles.buttonClassName}
            startContent={<Camera className="w-4 h-4" />}
          >
            {buttonText}
          </Button>
          <Section.Description>{description}</Section.Description>
        </Section.Container>
      </DecorationLayer>
    </AnimatedSectionCSS>
  );
}
