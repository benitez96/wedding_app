import { Heart, Edit, Frown } from "lucide-react";
import { Button } from "@heroui/button";
import { Section } from "@/components/section";
import { RSVPDeclinedContent } from "@/components/sections/RSVPSection/RSVPSection.metadata";
import { SectionIcon } from "@/components/ui/SectionIcon";
import { SectionIcon as SectionIconType } from "@/types/section-icon";

interface DeclinedRSVPProps {
  onOpenModal: () => void;
  content: RSVPDeclinedContent;
}

export default function DeclinedRSVP({
  onOpenModal,
  content,
}: DeclinedRSVPProps) {
  return (
    <>
      <Section.Icon>
        <SectionIcon
          icon={content.icon as SectionIconType}
          size={100}
          alt="No asiste"
        />
      </Section.Icon>
      <Section.Description isDecorative>
        {content.decorativeText}
      </Section.Description>
      <div className="flex items-center gap-2 text-default-600 font-semibold text-lg">
        <Heart className="w-5 h-5" />
        {/* TODO: i18n */}
        <span>NO PODRÁ ASISTIR</span>
      </div>
      <Section.Description>{content.description}</Section.Description>
      <div className="flex items-center gap-2 text-default-500">
        <Frown className="w-4 h-4" />
        <span className="text-sm">{content.footerText}</span>
      </div>
      <Button
        color="default"
        variant="bordered"
        startContent={<Edit className="w-4 h-4" />}
        onPress={onOpenModal}
        className="mt-4"
      >
        {content.changeLabel}
      </Button>
    </>
  );
}
