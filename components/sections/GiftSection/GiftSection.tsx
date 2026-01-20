import { Snippet } from "@heroui/snippet";
import { Section } from "@/components/section";
import AnimatedSectionCSS from "@/components/AnimatedSectionCSS";
import Image from "next/image";
import { GiftSectionSettings } from "./GiftSection.metadata";

interface GiftSectionProps {
  settings?: GiftSectionSettings;
}

export default function GiftSection({ settings }: GiftSectionProps) {
  const title = settings?.title || "REGALOS";
  const description =
    settings?.description ||
    "Tu compañía es el mejor regalo, pero si deseás ayudarnos…";
  const alias = settings?.alias || "DANI.SOL.HONEYMOON";
  const footerText =
    settings?.footerText || "Ayudanos con nuestra luna de miel";
  const iconUrl = settings?.iconUrl || "/icons/regalo-2.gif";

  return (
    <AnimatedSectionCSS delay={0.7}>
      <Section.Container>
        <Section.Icon>
          <Image src={iconUrl} alt="Gift" width={100} height={100} />
        </Section.Icon>
        <Section.Title>{title}</Section.Title>
        <Section.Description isDecorative>{description}</Section.Description>
        <Snippet symbol=" " color="primary" variant="bordered" size="md">
          {alias}
        </Snippet>
        <Section.Description className="font-semibold">
          {footerText}
        </Section.Description>
      </Section.Container>
    </AnimatedSectionCSS>
  );
}
