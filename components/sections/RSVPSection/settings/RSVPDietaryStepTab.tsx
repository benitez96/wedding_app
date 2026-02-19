"use client";

import { Switch } from "@heroui/switch";
import { Input } from "@heroui/input";
import { Card, CardBody } from "@heroui/card";
import { RSVPSectionSettings } from "../RSVPSection.metadata";

interface RSVPDietaryStepTabProps {
  settings: Partial<RSVPSectionSettings>;
  onChange: (
    updater: (
      prev: Partial<RSVPSectionSettings>,
    ) => Partial<RSVPSectionSettings>,
  ) => void;
}

export function RSVPDietaryStepTab({
  settings,
  onChange,
}: RSVPDietaryStepTabProps) {
  const dietaryStep = settings.dietaryStep ?? {
    enabled: false,
    question: "¿Tenés alguna alergia o restricción alimentaria?", // TODO: i18n
  };

  function updateDietaryStep(
    updater: (prev: typeof dietaryStep) => typeof dietaryStep,
  ) {
    onChange((prev) => ({ ...prev, dietaryStep: updater(dietaryStep) }));
  }

  return (
    <Card>
      <CardBody className="space-y-4">
        {/* TODO: i18n */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Activar paso de alergias</p>
            <p className="text-xs text-gray-600">
              Preguntarle al invitado si tiene alergias o restricciones
            </p>
          </div>
          <Switch
            isSelected={dietaryStep.enabled}
            onValueChange={(val) =>
              updateDietaryStep((prev) => ({ ...prev, enabled: val }))
            }
            color="success"
          />
        </div>

        {dietaryStep.enabled && (
          // TODO: i18n
          <Input
            label="Pregunta"
            value={dietaryStep.question}
            onChange={(e) =>
              updateDietaryStep((prev) => ({
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
