import { Instagram } from "lucide-react";
import { Button } from "@heroui/button";
import { Section } from "@/components/section";
import AnimatedSectionCSS from "@/components/AnimatedSectionCSS";
import Image from "next/image";
import Link from "next/link";
import { InstagramSectionSettings } from "./InstagramSection.metadata";
import { getAlternateBgClasses } from "@/lib/section-styles";

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
  const iconUrl = settings?.iconUrl || "/icons/instagram.gif";
  const hasAlternateBg = settings?.hasAlternateBg ?? false;

  const styles = getAlternateBgClasses(hasAlternateBg);

  return (
    <AnimatedSectionCSS delay={0.8}>
      <Section.Container hasAlternateBg={hasAlternateBg}>
        <Section.Icon>
          <Image src={iconUrl} alt="Instagram" width={100} height={100} />
        </Section.Icon>
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
    </AnimatedSectionCSS>
  );
}
