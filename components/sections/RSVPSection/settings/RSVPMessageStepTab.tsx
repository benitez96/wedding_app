"use client";

import { Switch } from "@heroui/switch";
import { Input } from "@heroui/input";
import { Card, CardBody } from "@heroui/card";
import { RSVPSectionSettings } from "../RSVPSection.metadata";

interface RSVPMessageStepTabProps {
  settings: Partial<RSVPSectionSettings>;
  onChange: (
    updater: (
      prev: Partial<RSVPSectionSettings>,
    ) => Partial<RSVPSectionSettings>,
  ) => void;
}

export function RSVPMessageStepTab({
  settings,
  onChange,
}: RSVPMessageStepTabProps) {
  const messageStep = settings.messageStep ?? {
    enabled: false,
    question: "¿Querés dejarnos un mensaje?", // TODO: i18n
  };

  function updateMessageStep(
    updater: (prev: typeof messageStep) => typeof messageStep,
  ) {
    onChange((prev) => ({ ...prev, messageStep: updater(messageStep) }));
  }

  return (
    <Card>
      <CardBody className="space-y-4">
        {/* TODO: i18n */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">
              Activar mensaje para los novios
            </p>
            <p className="text-xs text-gray-600">
              Invitar al invitado a dejar un mensaje personal
            </p>
          </div>
          <Switch
            isSelected={messageStep.enabled}
            onValueChange={(val) =>
              updateMessageStep((prev) => ({ ...prev, enabled: val }))
            }
            color="success"
          />
        </div>

        {messageStep.enabled && (
          // TODO: i18n
          <Input
            label="Pregunta"
            value={messageStep.question}
            onChange={(e) =>
              updateMessageStep((prev) => ({
                ...prev,
                question: e.target.value,
              }))
            }
            variant="bordered"
          />
        )}
      </CardBody>
    </Card>
  );
}
