"use client";

import { RadioGroup, Radio } from "@heroui/radio";
import { Checkbox } from "@heroui/checkbox";
import {
  PERMISSIONS,
  PERMISSION_PRESETS,
  PERMISSION_GROUPS,
} from "@/lib/permissions";

export const PRESET_OPTIONS = {
  ADMIN: "Admin",
  EDITOR: "Editor",
  VIEWER: "Viewer",
  CLIENT: "Cliente",
  CUSTOM: "Personalizado",
} as const;

export type PresetKey = keyof typeof PRESET_OPTIONS;

export interface PermissionsSelectorProps {
  selectedPreset: PresetKey;
  customPermissions: bigint;
  onPresetChange: (preset: PresetKey) => void;
  onCustomPermissionsChange: (permissions: bigint) => void;
  isDisabled?: boolean;
}

export function detectPreset(permissions: bigint): PresetKey {
  if (permissions === PERMISSION_PRESETS.ADMIN) return "ADMIN";
  if (permissions === PERMISSION_PRESETS.EDITOR) return "EDITOR";
  if (permissions === PERMISSION_PRESETS.VIEWER) return "VIEWER";
  if (permissions === PERMISSION_PRESETS.CLIENT) return "CLIENT";
  return "CUSTOM";
}

export function getPermissionsBigInt(
  selectedPreset: PresetKey,
  customPermissions: bigint,
): bigint {
  if (selectedPreset === "CUSTOM") return customPermissions;
  return PERMISSION_PRESETS[selectedPreset];
}

export default function PermissionsSelector({
  selectedPreset,
  customPermissions,
  onPresetChange,
  onCustomPermissionsChange,
  isDisabled = false,
}: PermissionsSelectorProps) {
  const togglePermission = (permKey: keyof typeof PERMISSIONS) => {
    const perm = PERMISSIONS[permKey];
    onCustomPermissionsChange(
      (customPermissions & perm) === perm
        ? customPermissions & ~perm
        : customPermissions | perm,
    );
  };

  return (
    <>
      <RadioGroup
        label="Tipo de acceso"
        value={selectedPreset}
        onValueChange={(v) => onPresetChange(v as PresetKey)}
        isDisabled={isDisabled}
      >
        <Radio value="ADMIN" description="Todo excepto eliminar evento">
          Admin
        </Radio>
        <Radio value="EDITOR" description="Gestionar invitados y ver analytics">
          Editor
        </Radio>
        <Radio value="VIEWER" description="Solo lectura">
          Viewer
        </Radio>
        <Radio value="CLIENT" description="Gestionar invitados + ver diseño">
          Cliente
        </Radio>
        <Radio value="CUSTOM" description="Seleccionar permisos individualmente">
          Personalizado
        </Radio>
      </RadioGroup>

      {selectedPreset === "CUSTOM" && (
        <div className="flex flex-col gap-3 pl-2">
          {PERMISSION_GROUPS.filter((g) => g.label !== "Evento (Crítico)").map(
            (group) => (
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
                        isDisabled={isDisabled}
                      >
                        {perm.label}
                      </Checkbox>
                    );
                  })}
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </>
  );
}
