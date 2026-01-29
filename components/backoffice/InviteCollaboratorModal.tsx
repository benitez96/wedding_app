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
import { Input } from "@heroui/input";
import { RadioGroup, Radio } from "@heroui/radio";
import { Checkbox } from "@heroui/checkbox";
import { Snippet } from "@heroui/snippet";
import { createInviteLink } from "@/app/actions/collaborators";
import {
  PERMISSION_PRESETS,
  PERMISSION_GROUPS,
  PERMISSIONS,
} from "@/lib/permissions";

const PRESET_OPTIONS = {
  ADMIN: "Admin",
  EDITOR: "Editor",
  VIEWER: "Viewer",
  CLIENT: "Cliente",
  CUSTOM: "Personalizado",
} as const;

type PresetKey = keyof typeof PRESET_OPTIONS;

interface InviteCollaboratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InviteCollaboratorModal({
  isOpen,
  onClose,
  onSuccess,
}: InviteCollaboratorModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>("EDITOR");
  const [customPermissions, setCustomPermissions] = useState<bigint>(0n);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPermissionsBigInt = (): bigint => {
    if (selectedPreset === "CUSTOM") return customPermissions;
    return PERMISSION_PRESETS[selectedPreset];
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const permissions = getPermissionsBigInt();
      const result = await createInviteLink(permissions.toString(), 72); // 72 hours

      if (result.success && result.data) {
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
        setGeneratedLink(`${baseUrl}/join/${result.data.token}`);
      } else {
        setError(result.error ?? "Error al generar el link");
      }
    } catch (err) {
      setError("Error al generar el link de invitación");
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

  const handleClose = () => {
    setGeneratedLink(null);
    setError(null);
    setSelectedPreset("EDITOR");
    setCustomPermissions(0n);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" placement="center">
      <ModalContent>
        <ModalHeader>Invitar Colaborador</ModalHeader>

        <ModalBody>
          {generatedLink ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-default-600">
                Comparte este link con la persona que quieras invitar. El link
                expira en 72 horas.
              </p>
              <Snippet
                symbol=""
                variant="bordered"
                className="overflow-x-auto"
              >
                {generatedLink}
              </Snippet>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
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
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="light" onPress={handleClose}>
            {generatedLink ? "Cerrar" : "Cancelar"}
          </Button>
          {!generatedLink && (
            <Button
              color="primary"
              onPress={handleGenerate}
              isLoading={isLoading}
              isDisabled={
                isLoading ||
                (selectedPreset === "CUSTOM" && customPermissions === 0n)
              }
            >
              Generar Link
            </Button>
          )}
          {generatedLink && (
            <Button
              color="primary"
              onPress={() => {
                handleClose();
                onSuccess();
              }}
            >
              Listo
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
