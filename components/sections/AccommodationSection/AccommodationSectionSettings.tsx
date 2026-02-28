"use client";

import type { FormEvent } from "react";
import { Input, Textarea } from "@heroui/input";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Checkbox } from "@heroui/checkbox";
import { Switch } from "@heroui/switch";
import { Select, SelectItem } from "@heroui/select";
import { useState } from "react";
import { Save, Plus, Trash2, GripVertical } from "lucide-react";
import {
  AccommodationSectionSettings,
  AccommodationItem,
  AccommodationItemValidationSchema,
} from "./AccommodationSection.metadata";
import {
  SectionSettingsFormProps,
  createSettingsUpdater,
} from "@/types/section-settings-form";
import { DecorationSettingsCard } from "@/components/ui/DecorationSettingsCard";
import {
  DecorationSvg,
  DecorationSVGs,
  DecorationPattern,
  DecorationPatterns,
} from "@/types/decoration";
import { SectionIconSelector } from "@/components/ui/SectionIconSelector";
import { SectionIcon } from "@/types/section-icon";
import { useToastFeedback } from "@/hooks/useToastFeedback";
import { sanitizeName, sanitizePhone, sanitizeText } from "@/lib/sanitize";
import { logError } from "@/lib/logger";

export function AccommodationSectionSettingsForm({
  initialSettings,
  onSave,
  onSettingsChange,
}: SectionSettingsFormProps<AccommodationSectionSettings>) {
  const [settings, setSettings] = useState<
    Partial<AccommodationSectionSettings>
  >(() => ({
    title: initialSettings.title || "ALOJAMIENTOS",
    description:
      initialSettings.description ||
      "Sabemos que podés venir de lejos, así que te facilitamos algunos teléfonos de alojamientos cercanos",
    accommodations: initialSettings.accommodations || [],
    icon: initialSettings.icon || "accommodation",
    hasAlternateBg: initialSettings.hasAlternateBg ?? false,
    decorationSvg: initialSettings.decorationSvg || DecorationSVGs.NONE,
    decorationPattern:
      initialSettings.decorationPattern || DecorationPatterns.CORNERS,
    decorationOpacity: initialSettings.decorationOpacity ?? 10,
    decorationSize: initialSettings.decorationSize ?? 60,
  }));
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<number, Record<string, string>>
  >({});
  const { toastSuccess, toastError } = useToastFeedback();

  const updateSettings = createSettingsUpdater(setSettings, onSettingsChange);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Sanitize all accommodations before saving
      const sanitizedAccommodations = (settings.accommodations || []).map(
        (acc) => ({
          name: sanitizeName(acc.name, 100),
          contactType: acc.contactType,
          contactValue:
            acc.contactType === "phone"
              ? sanitizePhone(acc.contactValue)
              : sanitizeText(acc.contactValue, 200),
          hasDescription: acc.hasDescription,
          description: acc.hasDescription
            ? sanitizeText(acc.description, 200)
            : "",
          hasDistance: acc.hasDistance,
          distance: acc.hasDistance ? sanitizeText(acc.distance, 100) : "",
        }),
      );

      // Validate each accommodation
      const errors: Record<number, Record<string, string>> = {};
      sanitizedAccommodations.forEach((acc, index) => {
        const result = AccommodationItemValidationSchema.safeParse(acc);
        if (!result.success) {
          logError(`Validation error for accommodation ${index}`, result.error);
          errors[index] = {};
          result.error.issues.forEach((issue) => {
            const field = issue.path[0] as string;
            errors[index][field] = issue.message;
          });
        }
      });

      if (Object.keys(errors).length > 0) {
        logError(
          "Total validation errors in accommodations",
          new Error("Validation failed"),
          { metadata: { errors } },
        );
        setValidationErrors(errors);
        toastError("Hay errores en los alojamientos. Por favor verificá.");
        setIsSaving(false);
        return;
      }

      await onSave({
        ...settings,
        accommodations: sanitizedAccommodations,
      } as AccommodationSectionSettings);
      setValidationErrors({});
      toastSuccess("Cambios guardados correctamente");
    } catch {
      toastError("Error al guardar los cambios");
    } finally {
      setIsSaving(false);
    }
  };

  const addAccommodation = () => {
    const newAccommodation: AccommodationItem = {
      name: "",
      contactType: "link",
      contactValue: "",
      hasDescription: false,
      description: "",
      hasDistance: false,
      distance: "",
    };
    updateSettings((prev) => ({
      ...prev,
      accommodations: [...(prev.accommodations || []), newAccommodation],
    }));
  };

  const removeAccommodation = (index: number) => {
    updateSettings((prev) => ({
      ...prev,
      accommodations: (prev.accommodations || []).filter((_, i) => i !== index),
    }));
    // Clear validation errors for this index
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[index];
      return newErrors;
    });
  };

  const updateAccommodation = (
    index: number,
    field: keyof AccommodationItem,
    value: string | boolean,
  ) => {
    updateSettings((prev) => ({
      ...prev,
      accommodations: (prev.accommodations || []).map((acc, i) =>
        i === index ? { ...acc, [field]: value } : acc,
      ),
    }));
    // Clear validation error for this field
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      if (newErrors[index]) {
        delete newErrors[index][field];
        if (Object.keys(newErrors[index]).length === 0) {
          delete newErrors[index];
        }
      }
      return newErrors;
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardBody className="space-y-4">
          {/* Title */}
          <Input
            label="Título"
            description="Título de la sección"
            placeholder="ALOJAMIENTOS"
            value={settings.title || ""}
            onChange={(e) =>
              updateSettings((prev) => ({ ...prev, title: e.target.value }))
            }
          />

          {/* Description */}
          <Textarea
            label="Descripción"
            description="Mensaje introductorio"
            placeholder="Sabemos que podés venir de lejos, así que te facilitamos algunos teléfonos de alojamientos cercanos"
            value={settings.description || ""}
            onChange={(e) =>
              updateSettings((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            minRows={2}
          />

          {/* Icon Selector */}
          <SectionIconSelector
            value={(settings.icon || "accommodation") as SectionIcon}
            onChange={(value) =>
              updateSettings((prev) => ({ ...prev, icon: value }))
            }
            label="Ícono de la Sección"
          />

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
                updateSettings((prev) => ({ ...prev, hasAlternateBg: val }))
              }
              color="success"
            />
          </div>
        </CardBody>
      </Card>

      {/* Accommodations List */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Alojamientos</h3>
            <p className="text-sm text-gray-600">
              Agregá y editá los lugares de alojamiento
            </p>
          </div>
          <Button
            color="primary"
            variant="flat"
            size="sm"
            startContent={<Plus className="w-4 h-4" />}
            onPress={addAccommodation}
            type="button"
          >
            Agregar Alojamiento
          </Button>
        </CardHeader>
        <CardBody className="space-y-4 max-h-[600px] overflow-y-auto">
          {(settings.accommodations || []).length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No hay alojamientos. Hacé clic en "Agregar Alojamiento" para
              comenzar.
            </p>
          ) : (
            (settings.accommodations || []).map((acc, index) => (
              <Card key={index} className="border-2 border-default-200">
                <CardBody className="space-y-3">
                  {/* Header with drag handle and delete */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-semibold text-gray-600">
                        #{index + 1}
                      </span>
                    </div>
                    <Button
                      color="danger"
                      variant="light"
                      size="sm"
                      isIconOnly
                      onPress={() => removeAccommodation(index)}
                      type="button"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Grid layout for compact form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      label="Nombre"
                      placeholder="Hotel Santa Ines"
                      value={acc.name}
                      onChange={(e) =>
                        updateAccommodation(index, "name", e.target.value)
                      }
                      isInvalid={!!validationErrors[index]?.name}
                      errorMessage={validationErrors[index]?.name}
                      isRequired
                      size="sm"
                      classNames={{ label: "text-xs" }}
                    />

                    <Select
                      label="Tipo"
                      selectedKeys={[acc.contactType]}
                      onChange={(e) =>
                        updateAccommodation(
                          index,
                          "contactType",
                          e.target.value as "link" | "phone",
                        )
                      }
                      size="sm"
                      classNames={{ label: "text-xs" }}
                    >
                      <SelectItem key="link">Link</SelectItem>
                      <SelectItem key="phone">Tel</SelectItem>
                    </Select>

                    <Input
                      label={acc.contactType === "phone" ? "Teléfono" : "URL"}
                      placeholder={
                        acc.contactType === "phone"
                          ? "+54 9 3777 20-0505"
                          : "https://maps.google.com/..."
                      }
                      value={acc.contactValue}
                      onChange={(e) =>
                        updateAccommodation(
                          index,
                          "contactValue",
                          e.target.value,
                        )
                      }
                      isInvalid={!!validationErrors[index]?.contactValue}
                      errorMessage={validationErrors[index]?.contactValue}
                      isRequired
                      size="sm"
                      classNames={{ label: "text-xs" }}
                      className="md:col-span-2"
                    />

                    {/* Description with inline checkbox */}
                    <div className="md:col-span-2 flex items-start gap-2">
                      <Checkbox
                        isSelected={acc.hasDescription}
                        onValueChange={(val) =>
                          updateAccommodation(index, "hasDescription", val)
                        }
                        size="sm"
                        className="mt-2"
                      />
                      <Input
                        label="Descripción"
                        placeholder="Ubicado en el centro de la ciudad"
                        value={acc.description}
                        onChange={(e) =>
                          updateAccommodation(
                            index,
                            "description",
                            e.target.value,
                          )
                        }
                        isInvalid={!!validationErrors[index]?.description}
                        errorMessage={validationErrors[index]?.description}
                        isDisabled={!acc.hasDescription}
                        size="sm"
                        classNames={{ label: "text-xs" }}
                        className="flex-1"
                      />
                    </div>

                    {/* Distance with inline checkbox */}
                    <div className="md:col-span-2 flex items-start gap-2">
                      <Checkbox
                        isSelected={acc.hasDistance}
                        onValueChange={(val) =>
                          updateAccommodation(index, "hasDistance", val)
                        }
                        size="sm"
                        className="mt-2"
                      />
                      <Input
                        label="Distancia"
                        placeholder="3 min del salón a pie"
                        value={acc.distance}
                        onChange={(e) =>
                          updateAccommodation(index, "distance", e.target.value)
                        }
                        isInvalid={!!validationErrors[index]?.distance}
                        errorMessage={validationErrors[index]?.distance}
                        isDisabled={!acc.hasDistance}
                        size="sm"
                        classNames={{ label: "text-xs" }}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))
          )}
        </CardBody>
      </Card>

      {/* Decoration Settings Card */}
      <DecorationSettingsCard
        decorationSvg={settings.decorationSvg as DecorationSvg}
        decorationPattern={settings.decorationPattern as DecorationPattern}
        decorationOpacity={settings.decorationOpacity ?? 10}
        decorationSize={settings.decorationSize ?? 60}
        onDecorationSvgChange={(value) =>
          updateSettings((prev) => ({ ...prev, decorationSvg: value }))
        }
        onDecorationPatternChange={(value) =>
          updateSettings((prev) => ({ ...prev, decorationPattern: value }))
        }
        onDecorationOpacityChange={(value) =>
          updateSettings((prev) => ({ ...prev, decorationOpacity: value }))
        }
        onDecorationSizeChange={(value) =>
          updateSettings((prev) => ({ ...prev, decorationSize: value }))
        }
      />

      <div className="flex justify-end">
        <Button
          type="submit"
          color="primary"
          startContent={<Save className="w-4 h-4" />}
          isLoading={isSaving}
          isDisabled={isSaving}
        >
          {isSaving ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>
    </form>
  );
}
