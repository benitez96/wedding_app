"use client";

import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { updateCollaboratorPermissions } from "@/app/actions/collaborators";
import PermissionsSelector, {
  type PresetKey,
  detectPreset,
  getPermissionsBigInt,
} from "@/components/backoffice/PermissionsSelector";

interface EditPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  memberId: string;
  memberName: string;
  currentPermissions: string;
}

export default function EditPermissionsModal({
  isOpen,
  onClose,
  onSuccess,
  memberId,
  memberName,
  currentPermissions,
}: EditPermissionsModalProps) {
  const permBigInt = BigInt(currentPermissions);
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>(
    detectPreset(permBigInt),
  );
  const [customPermissions, setCustomPermissions] = useState(permBigInt);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const permissions = getPermissionsBigInt(
        selectedPreset,
        customPermissions,
      );
      const result = await updateCollaboratorPermissions(
        memberId,
        permissions.toString(),
      );

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error ?? "Error al actualizar permisos");
      }
    } catch (err) {
      setError("Error al actualizar los permisos");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" placement="center">
      <ModalContent>
        <ModalHeader>Editar permisos de {memberName}</ModalHeader>

        <ModalBody>
          {error && (
            <div className="p-3 bg-danger-50 border border-danger-200 text-danger-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <PermissionsSelector
            selectedPreset={selectedPreset}
            customPermissions={customPermissions}
            onPresetChange={setSelectedPreset}
            onCustomPermissionsChange={setCustomPermissions}
            isDisabled={isLoading}
          />
        </ModalBody>

        <ModalFooter>
          <Button variant="light" onPress={onClose} isDisabled={isLoading}>
            Cancelar
          </Button>
          <Button
            color="primary"
            onPress={handleSave}
            isLoading={isLoading}
            isDisabled={
              isLoading ||
              (selectedPreset === "CUSTOM" && customPermissions === 0n)
            }
          >
            Guardar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
