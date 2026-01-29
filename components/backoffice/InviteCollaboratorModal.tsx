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
import { Select, SelectItem } from "@heroui/select";
import { createInviteLink } from "@/app/actions/collaborators";
import PermissionsSelector, {
  type PresetKey,
  getPermissionsBigInt,
} from "@/components/backoffice/PermissionsSelector";

interface LinkConfig {
  expirationDays: string;
  maxUses: string;
  isUnlimitedUses: boolean;
}

interface UIState {
  generatedLink: string | null;
  isLoading: boolean;
  error: string | null;
}

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
  const [permissions, setPermissions] = useState({
    preset: "EDITOR" as PresetKey,
    custom: 0n,
  });

  const [linkConfig, setLinkConfig] = useState<LinkConfig>({
    expirationDays: "7",
    maxUses: "1",
    isUnlimitedUses: false,
  });

  const [uiState, setUIState] = useState<UIState>({
    generatedLink: null,
    isLoading: false,
    error: null,
  });

  const handleGenerate = async () => {
    setUIState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const perms = getPermissionsBigInt(
        permissions.preset,
        permissions.custom,
      );
      const expiresInHours = parseInt(linkConfig.expirationDays) * 24;
      const uses = linkConfig.isUnlimitedUses
        ? undefined
        : parseInt(linkConfig.maxUses);

      const result = await createInviteLink(
        perms.toString(),
        expiresInHours,
        uses,
      );

      if (result.success && result.data) {
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
        setUIState((prev) => ({
          ...prev,
          generatedLink: `${baseUrl}/join/${result.data.token}`,
          isLoading: false,
        }));
      } else {
        setUIState((prev) => ({
          ...prev,
          error: result.error ?? "Error al generar el link",
          isLoading: false,
        }));
      }
    } catch (err) {
      setUIState((prev) => ({
        ...prev,
        error: "Error al generar el link de invitación",
        isLoading: false,
      }));
    }
  };

  const handleClose = () => {
    setPermissions({ preset: "EDITOR", custom: 0n });
    setLinkConfig({ expirationDays: "7", maxUses: "1", isUnlimitedUses: false });
    setUIState({ generatedLink: null, isLoading: false, error: null });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" placement="center">
      <ModalContent>
        <ModalHeader>Invitar Colaborador</ModalHeader>

        <ModalBody>
          {uiState.generatedLink ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-default-600">
                Comparte este link con la persona que quieras invitar.
                {parseInt(linkConfig.expirationDays) === 1
                  ? " El link expira en 1 día."
                  : ` El link expira en ${linkConfig.expirationDays} días.`}
                {linkConfig.isUnlimitedUses
                  ? " Usos ilimitados."
                  : ` Máximo ${linkConfig.maxUses} uso${parseInt(linkConfig.maxUses) > 1 ? "s" : ""}.`}
              </p>
              <Snippet
                symbol=""
                variant="bordered"
                className="overflow-x-auto"
              >
                {uiState.generatedLink}
              </Snippet>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {uiState.error && (
                <div className="p-3 bg-danger-50 border border-danger-200 text-danger-700 rounded-lg text-sm">
                  {uiState.error}
                </div>
              )}

              <PermissionsSelector
                selectedPreset={permissions.preset}
                customPermissions={permissions.custom}
                onPresetChange={(preset) =>
                  setPermissions((prev) => ({ ...prev, preset }))
                }
                onCustomPermissionsChange={(custom) =>
                  setPermissions((prev) => ({ ...prev, custom }))
                }
              />

              <div className="flex flex-col gap-3 pt-2 border-t border-divider">
                <p className="text-sm font-medium">Configuración del Link</p>

                <Select
                  label="Expiración"
                  placeholder="Selecciona días"
                  selectedKeys={[linkConfig.expirationDays]}
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as string;
                    setLinkConfig((prev) => ({ ...prev, expirationDays: value }));
                  }}
                  size="sm"
                >
                  <SelectItem key="1" value="1">1 día</SelectItem>
                  <SelectItem key="3" value="3">3 días</SelectItem>
                  <SelectItem key="7" value="7">7 días</SelectItem>
                  <SelectItem key="14" value="14">14 días</SelectItem>
                  <SelectItem key="30" value="30">30 días</SelectItem>
                </Select>

                <div className="flex flex-col gap-2">
                  <Input
                    type="number"
                    label="Número de usos"
                    placeholder="1"
                    value={linkConfig.maxUses}
                    onValueChange={(value) =>
                      setLinkConfig((prev) => ({ ...prev, maxUses: value }))
                    }
                    min="1"
                    max="999"
                    size="sm"
                    isDisabled={linkConfig.isUnlimitedUses}
                  />
                  <Checkbox
                    size="sm"
                    isSelected={linkConfig.isUnlimitedUses}
                    onValueChange={(value) =>
                      setLinkConfig((prev) => ({ ...prev, isUnlimitedUses: value }))
                    }
                  >
                    Usos ilimitados
                  </Checkbox>
                </div>
              </div>
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="light" onPress={handleClose}>
            {uiState.generatedLink ? "Cerrar" : "Cancelar"}
          </Button>
          {!uiState.generatedLink && (
            <Button
              color="primary"
              onPress={handleGenerate}
              isLoading={uiState.isLoading}
              isDisabled={
                uiState.isLoading ||
                (permissions.preset === "CUSTOM" && permissions.custom === 0n)
              }
            >
              Generar Link
            </Button>
          )}
          {uiState.generatedLink && (
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
