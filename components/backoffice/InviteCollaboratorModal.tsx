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
import { Checkbox } from "@heroui/checkbox";
import { Snippet } from "@heroui/snippet";
import { Select, SelectItem } from "@heroui/select";
import { createInviteLink } from "@/app/actions/collaborators";
import PermissionsSelector, {
  type PresetKey,
  getPermissionsBigInt,
} from "@/components/backoffice/PermissionsSelector";
import {
  convertDaysToHours,
  parseMaxUses,
  buildInviteLinkUrl,
  formatLinkDescription,
} from "@/lib/invite-link-utils";

// TODO i18n: expiration option labels
const EXPIRATION_OPTIONS = [
  { key: "1", label: "1 día" },
  { key: "3", label: "3 días" },
  { key: "7", label: "7 días" },
  { key: "14", label: "14 días" },
  { key: "30", label: "30 días" },
] as const;

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
      const expiresInHours = convertDaysToHours(
        parseInt(linkConfig.expirationDays),
      );
      const uses = parseMaxUses(linkConfig.maxUses, linkConfig.isUnlimitedUses);

      const result = await createInviteLink(
        perms.toString(),
        expiresInHours,
        uses,
      );

      if (result.success && result.data) {
        setUIState((prev) => ({
          ...prev,
          generatedLink: buildInviteLinkUrl(result.data.token),
          isLoading: false,
        }));
      } else {
        setUIState((prev) => ({
          ...prev,
          // TODO i18n: error message
          error: result.error ?? "Error al generar el link",
          isLoading: false,
        }));
      }
    } catch {
      setUIState((prev) => ({
        ...prev,
        // TODO i18n: error message
        error: "Error al generar el link de invitación",
        isLoading: false,
      }));
    }
  };

  const handleClose = () => {
    setPermissions({ preset: "EDITOR", custom: 0n });
    setLinkConfig({
      expirationDays: "7",
      maxUses: "1",
      isUnlimitedUses: false,
    });
    setUIState({ generatedLink: null, isLoading: false, error: null });
    onClose();
  };

  const expirationDays = parseInt(linkConfig.expirationDays);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" placement="center">
      <ModalContent>
        {/* TODO i18n: modal header */}
        <ModalHeader>Invitar Colaborador</ModalHeader>

        <ModalBody>
          {uiState.generatedLink ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-default-600">
                {/* TODO i18n: share link description */}
                Comparte este link con la persona que quieras invitar.{" "}
                {formatLinkDescription(
                  expirationDays,
                  linkConfig.maxUses,
                  linkConfig.isUnlimitedUses,
                )}
              </p>
              <Snippet symbol="" variant="bordered" className="overflow-x-auto">
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
                {/* TODO i18n: "Configuración del Link" */}
                <p className="text-sm font-medium">Configuración del Link</p>

                <Select
                  // TODO i18n: label + placeholder
                  label="Expiración"
                  placeholder="Selecciona días"
                  selectedKeys={[linkConfig.expirationDays]}
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as string;
                    setLinkConfig((prev) => ({
                      ...prev,
                      expirationDays: value,
                    }));
                  }}
                  size="sm"
                >
                  {EXPIRATION_OPTIONS.map((opt) => (
                    // HeroUI SelectItem: `key` only — no `value` prop
                    <SelectItem key={opt.key}>{opt.label}</SelectItem>
                  ))}
                </Select>

                <div className="flex flex-col gap-2">
                  <Input
                    type="number"
                    // TODO i18n: label + placeholder
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
                      setLinkConfig((prev) => ({
                        ...prev,
                        isUnlimitedUses: value,
                      }))
                    }
                  >
                    {/* TODO i18n: "Usos ilimitados" */}
                    Usos ilimitados
                  </Checkbox>
                </div>
              </div>
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="light" onPress={handleClose}>
            {/* TODO i18n: "Cerrar" / "Cancelar" */}
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
              {/* TODO i18n: "Generar Link" */}
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
              {/* TODO i18n: "Listo" */}
              Listo
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
