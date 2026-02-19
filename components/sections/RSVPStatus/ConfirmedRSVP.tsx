import { Users, Music, Edit } from "lucide-react";
import { Button } from "@heroui/button";
import { Section } from "@/components/section";
import { RSVPConfirmedContent } from "@/components/sections/RSVPSection/RSVPSection.metadata";
import { SectionIcon } from "@/components/ui/SectionIcon";
import { SectionIcon as SectionIconType } from "@/types/section-icon";

interface ConfirmedRSVPProps {
  guestCount: number;
  maxGuests: number;
  onOpenModal: () => void;
  content: RSVPConfirmedContent;
}

export default function ConfirmedRSVP({
  guestCount,
  maxGuests,
  onOpenModal,
  content,
}: ConfirmedRSVPProps) {
  return (
    <>
      <Section.Icon>
        <SectionIcon
          icon={content.icon as SectionIconType}
          size={100}
          alt="Confirmado"
        />
      </Section.Icon>
      <Section.Description isDecorative>
        {content.decorativeText}
      </Section.Description>
      <div className="flex items-center gap-2 text-success-600 font-semibold md:text-lg text-balance">
        <Users className="w-5 h-5" />
        {/* TODO: i18n — guest count label */}
        <span>
          ¡CONFIRMADO!{" "}
          {maxGuests > 1 ? `(${guestCount} de ${maxGuests} personas)` : ""}
        </span>
      </div>
      <Section.Description>{content.description}</Section.Description>
      <div className="flex items-center gap-2 text-default-600">
        <Music className="w-4 h-4" />
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
