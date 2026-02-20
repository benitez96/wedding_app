"use client";

import { useEffect, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Calendar } from "lucide-react";
import { calculateDaysRemaining } from "@/lib/rsvp-reminder-utils";

interface RSVPReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToRSVP: () => void;
  weddingTimestamp: number;
}

export default function RSVPReminderModal({
  isOpen,
  onClose,
  onGoToRSVP,
  weddingTimestamp,
}: RSVPReminderModalProps) {
  const [daysRemaining, setDaysRemaining] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) return;

    const updateDaysRemaining = () => {
      const days = calculateDaysRemaining(weddingTimestamp);
      setDaysRemaining(Math.max(0, days));
    };

    updateDaysRemaining();
    // Actualizar cada minuto para mantener el contador actualizado
    const interval = setInterval(updateDaysRemaining, 60000);
    return () => clearInterval(interval);
  }, [isOpen, weddingTimestamp]);

  const handleGoToRSVP = () => {
    onGoToRSVP();
    onClose();
  };

  return (
    <Modal
      placement="center"
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      isDismissable={false}
      hideCloseButton={false}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 text-center">
          <div className="flex justify-center mb-2">
            <Calendar className="text-primary" size={40} />
          </div>
          <h3 className="text-xl font-bold">¡Falta poco para nuestra boda!</h3>
        </ModalHeader>

        <ModalBody className="space-y-4">
          <p className="text-center text-default-700">
            Nos encantaría saber si vas a acompañarnos en este día tan especial.
          </p>
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 text-center">
            <p className="text-lg font-semibold text-primary-700">
              Faltan {daysRemaining} días
            </p>
            <p className="text-sm text-primary-600 mt-1">
              Por favor confirma tu asistencia
            </p>
          </div>
        </ModalBody>

        <ModalFooter className="flex-col gap-2">
          <Button
            color="primary"
            onPress={handleGoToRSVP}
            className="w-full"
            size="lg"
          >
            Confirmar Asistencia
          </Button>
          <Button variant="light" onPress={onClose} className="w-full">
            Más tarde
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
