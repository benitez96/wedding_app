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
import { RadioGroup, Radio } from "@heroui/radio";
import { Checkbox } from "@heroui/checkbox";
import { updateCollaboratorPermissions } from "@/app/actions/collaborators";
import {
  PERMISSIONS,
  PERMISSION_PRESETS,
  PERMISSION_GROUPS,
} from "@/lib/permissions";

const PRESET_OPTIONS = {
  ADMIN: "Admin",
  EDITOR: "Editor",
  VIEWER: "Viewer",
  CLIENT: "Cliente",
  CUSTOM: "Personalizado",
} as const;

type PresetKey = keyof typeof PRESET_OPTIONS;

function detectPreset(permissions: bigint): PresetKey {
  if (permissions === PERMISSION_PRESETS.ADMIN) return "ADMIN";
  if (permissions === PERMISSION_PRESETS.EDITOR) return "EDITOR";
  if (permissions === PERMISSION_PRESETS.VIEWER) return "VIEWER";
  if (permissions === PERMISSION_PRESETS.CLIENT) return "CLIENT";
  return "CUSTOM";
}

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

  const getPermissionsBigInt = (): bigint => {
    if (selectedPreset === "CUSTOM") return customPermissions;
    return PERMISSION_PRESETS[selectedPreset];
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const permissions = getPermissionsBigInt();
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

  const togglePermission = (permKey: keyof typeof PERMISSIONS) => {
    const perm = PERMISSIONS[permKey];
    setCustomPermissions((prev) =>
      (prev & perm) === perm ? prev & ~perm : prev | perm,
    );
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

          <RadioGroup
            label="Tipo de acceso"
            value={selectedPreset}
            onValueChange={(v) => setSelectedPreset(v as PresetKey)}
          >
            <Radio value="ADMIN" description="Todo excepto eliminar evento">
              Admin
            </Radio>
            <Radio
              value="EDITOR"
              description="Gestionar invitados y ver analytics"
            >
              Editor
            </Radio>
            <Radio value="VIEWER" description="Solo lectura">
              Viewer
            </Radio>
            <Radio
              value="CLIENT"
              description="Gestionar invitados + ver diseño"
            >
              Cliente
            </Radio>
            <Radio
              value="CUSTOM"
              description="Seleccionar permisos individualmente"
            >
              Personalizado
            </Radio>
          </RadioGroup>

          {selectedPreset === "CUSTOM" && (
            <div className="flex flex-col gap-3 pl-2">
              {PERMISSION_GROUPS.filter(
                (g) => g.label !== "Evento (Crítico)",
              ).map((group) => (
                <div key={group.label}>
                  <p className="text-sm font-medium mb-1">{group.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.permissions.map((perm) => {
                      const permValue = PERMISSIONS[perm.key];
                      const isChecked =
                        (customPermissions & permValue) === permValue;
                      return (
                        <Checkbox
                          key={perm.key}
                          size="sm"
                          isSelected={isChecked}
                          onValueChange={() => togglePermission(perm.key)}
                        >
                          {perm.label}
                        </Checkbox>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
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
