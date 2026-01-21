"use client";

import { useState } from "react";
import { RadioGroup, Radio } from "@heroui/radio";
import { Button } from "@heroui/button";
import { updateActiveTheme } from "@/app/actions/theme";
import { THEME_LIST, type ThemeId } from "@/types/theme";
import { useRouter } from "next/navigation";

interface ThemingFormProps {
  initialThemeId: ThemeId;
}

export default function ThemingForm({ initialThemeId }: ThemingFormProps) {
  const router = useRouter();
  const [selectedTheme, setSelectedTheme] = useState<string>(initialThemeId);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const hasChanges = selectedTheme !== initialThemeId;

  const handleSave = async () => {
    if (!hasChanges) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const result = await updateActiveTheme(selectedTheme as ThemeId);

      if (result.success) {
        setMessage({
          type: "success",
          text: "Theme actualizado correctamente",
        });

        // Recargar la página para aplicar el nuevo theme
        setTimeout(() => {
          router.refresh();
        }, 500);
      } else {
        setMessage({
          type: "error",
          text: result.error || "Error al actualizar el theme",
        });
      }
    } catch (error) {
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
        onValueChange={setSelectedTheme}
        classNames={{
          wrapper: "gap-4",
        }}
      >
        {THEME_LIST.map((theme) => (
          <Radio
            key={theme.id}
            value={theme.id}
            classNames={{
              base: "inline-flex m-0 items-center justify-between flex-row-reverse max-w-full cursor-pointer rounded-lg gap-4 p-4 border-2 border-gray-200 hover:border-gray-300 transition-colors",
              wrapper: "group-data-[selected=true]:border-primary",
            }}
          >
            <div className="flex flex-col gap-2 flex-1">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-base font-semibold">{theme.name}</p>
                  <p className="text-sm text-gray-600">{theme.description}</p>
                </div>
              </div>

              {/* Paleta de colores */}
              <div className="flex gap-2 mt-2">
                <span
                  className="w-8 h-8 rounded-full border-2 inline-block"
                  style={{
                    backgroundColor: theme.colors.primary,
                    borderColor: theme.colors.primary,
                  }}
                  title="Primary"
                />
                <span
                  className="w-8 h-8 rounded-full border-2 inline-block"
                  style={{
                    backgroundColor: theme.colors.secondary,
                    borderColor: theme.colors.secondary,
                  }}
                  title="Secondary"
                />
                <span
                  className="w-8 h-8 rounded-full border-2 inline-block"
                  style={{
                    backgroundColor: theme.colors.accent,
                    borderColor: theme.colors.accent,
                  }}
                  title="Accent"
                />
                <span
                  className="w-8 h-8 rounded-full border-2 inline-block"
                  style={{
                    backgroundColor: theme.colors.warm,
                    borderColor: theme.colors.warm,
                  }}
                  title="Warm"
                />
              </div>
            </div>
          </Radio>
        ))}
      </RadioGroup>

      {/* Mensaje de feedback */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Botón de guardar */}
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
