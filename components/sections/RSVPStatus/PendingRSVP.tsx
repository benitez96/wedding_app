import { Check } from "lucide-react";
import { Section } from "@/components/section";
import AttentionButton from "@/components/AttentionButton";
import { RSVPPendingContent } from "@/components/sections/RSVPSection/RSVPSection.metadata";
import { SectionIcon } from "@/components/ui/SectionIcon";
import { SectionIcon as SectionIconType } from "@/types/section-icon";

interface PendingRSVPProps {
  onOpenModal: () => void;
  content: RSVPPendingContent;
}

export default function PendingRSVP({
  onOpenModal,
  content,
}: PendingRSVPProps) {
  return (
    <>
      <Section.Icon>
        <SectionIcon
          icon={content.icon as SectionIconType}
          size={100}
          alt="Confirmar Asistencia"
        />
      </Section.Icon>
      <Section.Description isDecorative>
        {content.decorativeText}
      </Section.Description>
      <AttentionButton
        startContent={<Check className="w-4 h-4" />}
        onPress={onOpenModal}
      >
        {content.ctaLabel}
      </AttentionButton>
      <Section.Description>{content.footerText}</Section.Description>
    </>
  );
}
