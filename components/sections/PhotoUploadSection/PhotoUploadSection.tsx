import { Camera } from "lucide-react";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { Section } from "@/components/section";
import AnimatedSectionCSS from "@/components/AnimatedSectionCSS";
import Image from "next/image";
import { PhotoUploadSectionSettings } from "./PhotoUploadSection.metadata";

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
  const iconUrl = settings?.iconUrl || "/icons/fotos.gif";

  // URL de settings, o fallback a env variable
  const uploadUrl =
    settings?.uploadUrl || process.env.NEXT_PUBLIC_PHOTO_UPLOAD_URL || "";

  return (
    <AnimatedSectionCSS delay={1.0}>
      <Section.Container>
        <Section.Icon>
          <Image src={iconUrl} alt="Fotos y Videos" width={100} height={100} />
        </Section.Icon>
        <Section.Description isDecorative>{quoteText}</Section.Description>

        <Button
          as={Link}
          href={uploadUrl}
          isExternal
          color="primary"
          startContent={<Camera className="w-4 h-4" />}
        >
          {buttonText}
        </Button>
        <Section.Description>{description}</Section.Description>
      </Section.Container>
    </AnimatedSectionCSS>
  );
}
