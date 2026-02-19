"use client";

import { useState } from "react";
import { RadioGroup, Radio } from "@heroui/radio";
import { Button } from "@heroui/button";
import {
  updateActiveTheme,
  updateCustomThemeColors,
} from "@/app/actions/theme";
import {
  THEME_LIST,
  THEME_IDS,
  type ThemeId,
  type CustomThemeColors,
} from "@/types/theme";
import { useRouter } from "next/navigation";
import FeedbackMessage, { MessageTypes } from "@/components/ui/FeedbackMessage";
import CustomThemePicker from "./CustomThemePicker";

interface ThemingFormProps {
  initialThemeId: ThemeId;
  initialCustomColors: CustomThemeColors;
}

export default function ThemingForm({
  initialThemeId,
  initialCustomColors,
}: ThemingFormProps) {
  const router = useRouter();
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>(initialThemeId);
  const [customColors, setCustomColors] =
    useState<CustomThemeColors>(initialCustomColors);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const isCustomSelected = selectedTheme === THEME_IDS.CUSTOM;

  // Has changes if: theme selection changed, OR custom is selected and colors changed
  const hasChanges =
    selectedTheme !== initialThemeId ||
    (isCustomSelected &&
      JSON.stringify(customColors) !== JSON.stringify(initialCustomColors));

  const handleSave = async () => {
    if (!hasChanges) return;

    setIsSaving(true);
    setMessage(null);

    try {
      let result: { success: boolean; error?: string };

      if (isCustomSelected) {
        // Save custom colors (server action also activates the custom theme)
        result = await updateCustomThemeColors(customColors);
      } else {
        result = await updateActiveTheme(selectedTheme);
      }

      if (result.success) {
        setMessage({
          type: "success",
          text: "Theme actualizado correctamente",
        });

        setTimeout(() => {
          router.refresh();
        }, 500);
      } else {
        setMessage({
          type: "error",
          text: result.error || "Error al actualizar el theme",
        });
      }
    } catch {
      setMessage({
        type: "error",
        text: "Error inesperado al actualizar el theme",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <RadioGroup
        label="Selecciona un tema"
        value={selectedTheme}
        onValueChange={(val) => setSelectedTheme(val as ThemeId)}
        classNames={{
          wrapper: "gap-4",
        }}
      >
        {/* Predefined themes */}
        {THEME_LIST.map((theme) => (
          <Radio
            key={theme.id}
            value={theme.id}
            classNames={{
              base: "inline-flex m-0 items-center justify-between flex-row-reverse max-w-full cursor-pointer rounded-lg gap-4 p-4 border-2 border-divider hover:border-default-400 transition-colors",
              wrapper: "group-data-[selected=true]:border-primary",
            }}
          >
            <div className="flex flex-col gap-2 flex-1">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-base font-semibold">{theme.name}</p>
                  <p className="text-sm text-foreground/60">
                    {theme.description}
                  </p>
                </div>
              </div>

              {/* Color palette for predefined theme preview */}
              <div className="flex gap-2 mt-2">
                {(
                  [
                    "background",
                    "foreground",
                    "primary",
                    "secondary",
                    "accent",
                  ] as const
                ).map((key) => (
                  <span
                    key={key}
                    className="w-8 h-8 rounded-full border-2 inline-block"
                    style={{
                      backgroundColor: theme.colors[key],
                      borderColor: theme.colors[key],
                    }}
                    title={key}
                  />
                ))}
              </div>
            </div>
          </Radio>
        ))}

        {/* Custom theme option */}
        <Radio
          value={THEME_IDS.CUSTOM}
          classNames={{
            base: "inline-flex m-0 items-center justify-between flex-row-reverse max-w-full cursor-pointer rounded-lg gap-4 p-4 border-2 border-divider hover:border-default-400 transition-colors",
            wrapper: "group-data-[selected=true]:border-primary",
          }}
        >
          <div className="flex flex-col gap-1">
            <p className="text-base font-semibold">Personalizado</p>
            <p className="text-sm text-foreground/60">
              Elegí tus propios colores
            </p>
          </div>
        </Radio>
      </RadioGroup>

      {/* Picker outside RadioGroup so its events are not captured by the radio */}
      {isCustomSelected && (
        <CustomThemePicker colors={customColors} onChange={setCustomColors} />
      )}

      {/* Feedback message */}
      {message && (
        <FeedbackMessage
          type={
            message.type === "success"
              ? MessageTypes.SUCCESS
              : MessageTypes.ERROR
          }
          message={message.text}
        />
      )}

      {/* Save button */}
      <div className="flex gap-2 justify-end">
        <Button
          color="primary"
          onClick={handleSave}
          isLoading={isSaving}
          isDisabled={!hasChanges || isSaving}
        >
          {isSaving ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>
    </div>
  );
}
