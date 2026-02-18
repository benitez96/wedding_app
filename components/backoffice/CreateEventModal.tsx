"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
} from "@heroui/react";
import { useRouter } from "next/navigation";
import { createEvent } from "@/app/actions/events";
import { z } from "zod";

const createEventSchema = z.object({
  // TODO i18n: validation messages
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
});

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateEventModal({
  isOpen,
  onClose,
}: CreateEventModalProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const validation = createEventSchema.safeParse({ name, description });
    if (!validation.success) {
      // Zod 4: .issues (not .errors)
      setError(validation.error.issues[0]?.message ?? "Error de validación");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      if (description.trim()) {
        formData.append("description", description.trim());
      }

      const result = await createEvent(formData);

      if (!result.success) {
        // TODO i18n: error message
        setError(result.error || "Error al crear el evento");
        setIsLoading(false);
        return;
      }

      await router.refresh();

      setName("");
      setDescription("");
      setError("");
      setIsLoading(false);
      onClose();
    } catch (err) {
      console.error("Error creating event:", err);
      // TODO i18n: error message
      setError("Error inesperado al crear el evento");
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setName("");
      setDescription("");
      setError("");
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      placement="center"
      size="md"
      isDismissable={!isLoading}
    >
      <ModalContent>
        <form onSubmit={handleSubmit}>
          {/* TODO i18n: modal header */}
          <ModalHeader className="flex flex-col gap-1">
            Crear Nuevo Evento
          </ModalHeader>
          <ModalBody>
            <Input
              // TODO i18n: label + placeholder
              label="Nombre del Evento"
              placeholder="Mi Boda 2026"
              value={name}
              onValueChange={setName}
              isRequired
              isDisabled={isLoading}
              errorMessage={error && name.trim().length === 0 ? error : ""}
              isInvalid={!!error && name.trim().length === 0}
            />
            <Textarea
              // TODO i18n: label + placeholder
              label="Descripción (opcional)"
              placeholder="Detalles sobre el evento..."
              value={description}
              onValueChange={setDescription}
              isDisabled={isLoading}
              minRows={3}
            />
            {error && name.trim().length > 0 && (
              <p className="text-sm text-danger">{error}</p>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              variant="light"
              onPress={handleClose}
              isDisabled={isLoading}
            >
              {/* TODO i18n: "Cancelar" */}
              Cancelar
            </Button>
            <Button color="primary" type="submit" isLoading={isLoading}>
              {/* TODO i18n: "Crear Evento" */}
              Crear Evento
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
