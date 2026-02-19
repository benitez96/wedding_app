"use client";

import { Input, Textarea } from "@heroui/input";
import { Card, CardBody } from "@heroui/card";
import { RSVPSectionSettings } from "../RSVPSection.metadata";
import { SectionIconSelector } from "@/components/ui/SectionIconSelector";
import { SectionIcon } from "@/types/section-icon";

interface RSVPDeclinedContentTabProps {
  settings: Partial<RSVPSectionSettings>;
  onChange: (
    updater: (
      prev: Partial<RSVPSectionSettings>,
    ) => Partial<RSVPSectionSettings>,
  ) => void;
}

export function RSVPDeclinedContentTab({
  settings,
  onChange,
}: RSVPDeclinedContentTabProps) {
  const content = settings.declinedContent ?? {
    icon: "rsvp" as const,
    decorativeText: "Entendemos que no puedas asistir", // TODO: i18n
    description:
      "¡Uff que triste! 😢 Nos hubiera encantado compartir este momento especial con vos.", // TODO: i18n
    footerText: "¡Te vamos a extrañar mucho!", // TODO: i18n
    changeLabel: "Cambié de opinión", // TODO: i18n
  };

  function update(field: keyof typeof content, value: string) {
    onChange((prev) => ({
      ...prev,
      declinedContent: { ...content, [field]: value },
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
              declinedContent: { ...content, icon: value },
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
        <Textarea
          label="Descripción"
          value={content.description}
          onChange={(e) => update("description", e.target.value)}
          variant="bordered"
          minRows={2}
        />
        <Input
          label="Texto inferior"
          value={content.footerText}
          onChange={(e) => update("footerText", e.target.value)}
          variant="bordered"
        />
        <Input
          label="Texto botón cambiar respuesta"
          value={content.changeLabel}
          onChange={(e) => update("changeLabel", e.target.value)}
          variant="bordered"
        />
      </CardBody>
    </Card>
  );
}
