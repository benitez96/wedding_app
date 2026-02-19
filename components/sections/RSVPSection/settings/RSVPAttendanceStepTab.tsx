"use client";

import { Input } from "@heroui/input";
import { Card, CardBody } from "@heroui/card";
import { RSVPSectionSettings } from "../RSVPSection.metadata";

interface RSVPAttendanceStepTabProps {
  settings: Partial<RSVPSectionSettings>;
  onChange: (
    updater: (
      prev: Partial<RSVPSectionSettings>,
    ) => Partial<RSVPSectionSettings>,
  ) => void;
}

export function RSVPAttendanceStepTab({
  settings,
  onChange,
}: RSVPAttendanceStepTabProps) {
  const step = settings.attendanceStep ?? {
    question: "¿Vas a asistir a nuestra boda?", // TODO: i18n
    acceptLabel: "¡Sí, acepto!", // TODO: i18n
    acceptSubtitle: "Voy a estar ahí", // TODO: i18n
    declineLabel: "No puedo ir :(", // TODO: i18n
    declineSubtitle: "Lo siento mucho", // TODO: i18n
  };

  function update(field: keyof typeof step, value: string) {
    onChange((prev) => ({
      ...prev,
      attendanceStep: { ...step, [field]: value },
    }));
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardBody className="space-y-3">
          {/* TODO: i18n — all labels */}
          <p className="text-xs text-default-500 font-medium uppercase tracking-wide">
            Pregunta principal
          </p>
          <Input
            label="Pregunta"
            value={step.question}
            onChange={(e) => update("question", e.target.value)}
            variant="bordered"
          />
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <p className="text-xs text-default-500 font-medium uppercase tracking-wide">
            Opción "Sí asisto"
          </p>
          <Input
            label="Título"
            value={step.acceptLabel}
            onChange={(e) => update("acceptLabel", e.target.value)}
            variant="bordered"
          />
          <Input
            label="Subtítulo"
            value={step.acceptSubtitle}
            onChange={(e) => update("acceptSubtitle", e.target.value)}
            variant="bordered"
          />
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <p className="text-xs text-default-500 font-medium uppercase tracking-wide">
            Opción "No asisto"
          </p>
          <Input
            label="Título"
            value={step.declineLabel}
            onChange={(e) => update("declineLabel", e.target.value)}
            variant="bordered"
          />
          <Input
            label="Subtítulo"
            value={step.declineSubtitle}
            onChange={(e) => update("declineSubtitle", e.target.value)}
            variant="bordered"
          />
        </CardBody>
      </Card>
    </div>
  );
}
