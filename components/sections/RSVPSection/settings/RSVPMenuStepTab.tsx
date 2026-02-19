"use client";

import { useState } from "react";
import { Switch } from "@heroui/switch";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Plus, X } from "lucide-react";
import { RSVPSectionSettings } from "../RSVPSection.metadata";

interface RSVPMenuStepTabProps {
  settings: Partial<RSVPSectionSettings>;
  onChange: (
    updater: (
      prev: Partial<RSVPSectionSettings>,
    ) => Partial<RSVPSectionSettings>,
  ) => void;
}

const DEFAULT_OPTIONS = ["Carne", "Vegetariano", "Vegano"]; // TODO: i18n

export function RSVPMenuStepTab({ settings, onChange }: RSVPMenuStepTabProps) {
  const menuStep = settings.menuStep ?? {
    enabled: false,
    question: "¿Cuál es tu preferencia de menú?", // TODO: i18n
    options: DEFAULT_OPTIONS,
  };

  const [newOption, setNewOption] = useState("");

  function updateMenuStep(updater: (prev: typeof menuStep) => typeof menuStep) {
    onChange((prev) => ({ ...prev, menuStep: updater(menuStep) }));
  }

  function handleAddOption() {
    const trimmed = newOption.trim();
    if (!trimmed || menuStep.options.includes(trimmed)) return;
    updateMenuStep((prev) => ({
      ...prev,
      options: [...prev.options, trimmed],
    }));
    setNewOption("");
  }

  function handleRemoveOption(option: string) {
    updateMenuStep((prev) => ({
      ...prev,
      options: prev.options.filter((o) => o !== option),
    }));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddOption();
    }
  }

  return (
    <Card>
      <CardBody className="space-y-4">
        {/* TODO: i18n */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Activar paso de menú</p>
            <p className="text-xs text-gray-600">
              Preguntarle al invitado su preferencia de menú
            </p>
          </div>
          <Switch
            isSelected={menuStep.enabled}
            onValueChange={(val) =>
              updateMenuStep((prev) => ({ ...prev, enabled: val }))
            }
            color="success"
          />
        </div>

        {menuStep.enabled && (
          <>
            {/* TODO: i18n */}
            <Input
              label="Pregunta"
              value={menuStep.question}
              onChange={(e) =>
                updateMenuStep((prev) => ({
                  ...prev,
                  question: e.target.value,
                }))
              }
              variant="bordered"
            />

            <div className="space-y-2">
              {/* TODO: i18n */}
              <p className="text-sm font-medium">Opciones</p>
              <div className="flex flex-wrap gap-2">
                {menuStep.options.map((option) => (
                  <Chip
                    key={option}
                    onClose={() => handleRemoveOption(option)}
                    variant="flat"
                    color="primary"
                    isDisabled={menuStep.options.length <= 1}
                  >
                    {option}
                  </Chip>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Nueva opción..." // TODO: i18n
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyDown={handleKeyDown}
                  variant="bordered"
                  size="sm"
                />
                <Button
                  isIconOnly
                  size="sm"
                  variant="flat"
                  onPress={handleAddOption}
                  isDisabled={!newOption.trim()}
                  aria-label="Add option" // TODO: i18n
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
}
