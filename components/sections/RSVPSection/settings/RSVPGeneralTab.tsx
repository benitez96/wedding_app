"use client";

import { Switch } from "@heroui/switch";
import { Card, CardBody } from "@heroui/card";
import { RSVPSectionSettings } from "../RSVPSection.metadata";
import { DecorationSettingsCard } from "@/components/ui/DecorationSettingsCard";
import { DecorationSvg, DecorationPattern } from "@/types/decoration";

interface RSVPGeneralTabProps {
  settings: Partial<RSVPSectionSettings>;
  onChange: (
    updater: (
      prev: Partial<RSVPSectionSettings>,
    ) => Partial<RSVPSectionSettings>,
  ) => void;
}

export function RSVPGeneralTab({ settings, onChange }: RSVPGeneralTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardBody className="space-y-4">
          {/* TODO: i18n */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Mostrar Botón Flotante RSVP</p>
              <p className="text-xs text-gray-600">
                Mostrar el botón flotante de acceso rápido al formulario
              </p>
            </div>
            <Switch
              isSelected={settings.showFloatingButton}
              onValueChange={(val) =>
                onChange((prev) => ({ ...prev, showFloatingButton: val }))
              }
              color="success"
            />
          </div>

          {/* TODO: i18n */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Background de Color</p>
              <p className="text-xs text-gray-600">
                Aplicar color de fondo a esta sección
              </p>
            </div>
            <Switch
              isSelected={settings.hasAlternateBg}
              onValueChange={(val) =>
                onChange((prev) => ({ ...prev, hasAlternateBg: val }))
              }
              color="success"
            />
          </div>
        </CardBody>
      </Card>

      <DecorationSettingsCard
        decorationSvg={settings.decorationSvg as DecorationSvg}
        decorationPattern={settings.decorationPattern as DecorationPattern}
        decorationOpacity={settings.decorationOpacity ?? 10}
        decorationSize={settings.decorationSize ?? 60}
        onDecorationSvgChange={(value) =>
          onChange((prev) => ({ ...prev, decorationSvg: value }))
        }
        onDecorationPatternChange={(value) =>
          onChange((prev) => ({ ...prev, decorationPattern: value }))
        }
        onDecorationOpacityChange={(value) =>
          onChange((prev) => ({ ...prev, decorationOpacity: value }))
        }
        onDecorationSizeChange={(value) =>
          onChange((prev) => ({ ...prev, decorationSize: value }))
        }
      />
    </div>
  );
}
