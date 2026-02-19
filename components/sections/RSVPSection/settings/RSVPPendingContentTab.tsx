"use client";

import { Input, Textarea } from "@heroui/input";
import { Card, CardBody } from "@heroui/card";
import { RSVPSectionSettings } from "../RSVPSection.metadata";
import { SectionIconSelector } from "@/components/ui/SectionIconSelector";
import { SectionIcon } from "@/types/section-icon";

interface RSVPPendingContentTabProps {
  settings: Partial<RSVPSectionSettings>;
  onChange: (
    updater: (
      prev: Partial<RSVPSectionSettings>,
    ) => Partial<RSVPSectionSettings>,
  ) => void;
}

export function RSVPPendingContentTab({
  settings,
  onChange,
}: RSVPPendingContentTabProps) {
  const content = settings.pendingContent ?? {
    icon: "rsvp" as const,
    decorativeText: 'Decile "Si acepto" a nuestra invitacion', // TODO: i18n
    ctaLabel: "CONFIRMAR ASISTENCIA", // TODO: i18n
    footerText: "Tenes tiempo hasta el 10 de Enero!", // TODO: i18n
  };

  function update(field: keyof typeof content, value: string) {
    onChange((prev) => ({
      ...prev,
      pendingContent: { ...content, [field]: value },
    }));
  }

  return (
    <Card>
      <CardBody className="space-y-3">
        {/* TODO: i18n — all labels */}
        <SectionIconSelector
          value={content.icon as SectionIcon}
          onChange={(value) =>
            onChange((prev) => ({
              ...prev,
              pendingContent: { ...content, icon: value },
            }))
          }
          label="Ícono" // TODO: i18n
        />
        <Textarea
          label="Texto decorativo"
          value={content.decorativeText}
          onChange={(e) => update("decorativeText", e.target.value)}
          variant="bordered"
          minRows={2}
        />
        <Input
          label="Texto del botón CTA"
          value={content.ctaLabel}
          onChange={(e) => update("ctaLabel", e.target.value)}
          variant="bordered"
        />
        <Input
          label="Texto inferior"
          value={content.footerText}
          onChange={(e) => update("footerText", e.target.value)}
          variant="bordered"
        />
      </CardBody>
    </Card>
  );
}
