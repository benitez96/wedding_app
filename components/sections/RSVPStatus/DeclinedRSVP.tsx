import { Heart, Edit, Frown } from "lucide-react";
import { Button } from "@heroui/button";
import { Section } from "@/components/section";
import Image from "next/image";

interface DeclinedRSVPProps {
  onOpenModal: () => void;
}

export default function DeclinedRSVP({ onOpenModal }: DeclinedRSVPProps) {
  return (
    <>
      <Section.Icon>
        <Image src="/icons/RSVP.gif" alt="Confirmar Asistencia" width={100} height={100} />
      </Section.Icon>
      <Section.Description isDecorative>
        Entendemos que no puedas asistir
      </Section.Description>
      <div className="flex items-center gap-2 text-default-600 font-semibold text-lg">
        <Heart className="w-5 h-5" />
        <span>NO PODRÁ ASISTIR</span>
      </div>
      <Section.Description>
        ¡Uff que triste! 😢 Nos hubiera encantado compartir este momento especial con vos.
      </Section.Description>
      <div className="flex items-center gap-2 text-default-500">
        <Frown className="w-4 h-4" />
        <span className="text-sm">¡Te vamos a extrañar mucho!</span>
      </div>
      <Button
        color="default"
        variant="bordered"
        startContent={<Edit className="w-4 h-4" />}
        onPress={onOpenModal}
        className="mt-4"
      >
        Cambié de opinión
      </Button>
    </>
  );
}
