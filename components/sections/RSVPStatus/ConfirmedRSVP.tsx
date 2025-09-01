import { Users, Music, Edit } from "lucide-react";
import { Button } from "@heroui/button";
import { Section } from "@/components/section";
import Image from "next/image";

interface ConfirmedRSVPProps {
  guestCount: number;
  maxGuests: number;
  onOpenModal: () => void;
}

export default function ConfirmedRSVP({ guestCount, maxGuests, onOpenModal }: ConfirmedRSVPProps) {
  return (
    <>
      <Section.Icon>
        <Image src="/icons/disco-ball.gif" alt="Confirmar Asistencia" width={100} height={100} />
      </Section.Icon>
      <Section.Description isDecorative>
        ¡Gracias por confirmar tu asistencia!
      </Section.Description>
      <div className="flex items-center gap-2 text-success-600 font-semibold md:text-lg text-balance">
        <Users className="w-5 h-5" />
        <span>¡CONFIRMADO! {maxGuests > 1 ? `(${guestCount} de ${maxGuests} personas)` : ''}</span>
      </div>
      <Section.Description>
        ¡Anda recargando baterías que vamos a bailar toda la noche! 🕺💃
      </Section.Description>
      <div className="flex items-center gap-2 text-default-600">
        <Music className="w-4 h-4" />
        <span className="text-sm">¡Prepárate para una noche inolvidable!</span>
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
