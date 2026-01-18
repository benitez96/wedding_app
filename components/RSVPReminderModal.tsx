"use client";

import { useEffect, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { Calendar, ArrowRight } from "lucide-react";
import { getWeddingDate } from "@/utils/date";

interface RSVPReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToRSVP: () => void;
}

export default function RSVPReminderModal({
  isOpen,
  onClose,
  onGoToRSVP,
}: RSVPReminderModalProps) {
  const [daysRemaining, setDaysRemaining] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) return;

    const calculateDaysRemaining = () => {
      // Como el contenedor Docker está configurado con timezone Argentina,
      // new Date() ya devuelve la hora correcta de Argentina
      const weddingDate = getWeddingDate();
      const today = new Date();
      const diffTime = weddingDate.getTime() - today.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      setDaysRemaining(Math.max(0, diffDays));
    };

    calculateDaysRemaining();
    // Actualizar cada minuto para mantener el contador actualizado
    const interval = setInterval(calculateDaysRemaining, 60000);
    return () => clearInterval(interval);
  }, [isOpen]);

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
