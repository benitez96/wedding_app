"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { useRouter } from "next/navigation";
import ThemeCatalog from "./ThemeCatalog";
import ThemeColorEditor from "./ThemeColorEditor";
import { useThemePreview } from "./useThemePreview";
import {
  updateActiveTheme,
  updateCustomThemeColors,
} from "@/app/actions/theme";
import {
  THEMES,
  THEME_IDS,
  type ThemeId,
  type CustomThemeColors,
} from "@/types/theme";
import { useToastFeedback } from "@/hooks/useToastFeedback";

// ============================================================================
// Types
// ============================================================================

interface ThemingFormProps {
  initialThemeId: ThemeId;
  initialCustomColors: CustomThemeColors;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Get the display colors for a theme.
 * - For predefined themes: returns the theme's colors (read-only display)
 * - For custom: returns the user's custom colors (editable)
 */
function getDisplayColors(
  themeId: ThemeId,
  customColors: CustomThemeColors,
): CustomThemeColors {
  if (themeId === THEME_IDS.CUSTOM) {
    return customColors;
  }

  const predefinedTheme = THEMES[themeId as Exclude<ThemeId, "custom">];
  return predefinedTheme.colors;
}

// ============================================================================
// ThemingForm
// ============================================================================

export default function ThemingForm({
  initialThemeId,
  initialCustomColors,
}: ThemingFormProps) {
  const router = useRouter();
  const { toastSuccess, toastError } = useToastFeedback();

  // State
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>(initialThemeId);
  const [customColors, setCustomColors] =
    useState<CustomThemeColors>(initialCustomColors);
  const [isSaving, setIsSaving] = useState(false);

  // Derived state
  const isCustomSelected = selectedTheme === THEME_IDS.CUSTOM;
  const displayColors = getDisplayColors(selectedTheme, customColors);

  // Live preview of custom theme colors (injects CSS variables in real-time)
  useThemePreview(selectedTheme, customColors);

  // Detect changes
  const themeChanged = selectedTheme !== initialThemeId;
  const colorsChanged =
    isCustomSelected &&
    JSON.stringify(customColors) !== JSON.stringify(initialCustomColors);
  const hasChanges = themeChanged || colorsChanged;

  // Handlers
  function handleThemeSelect(themeId: ThemeId) {
    // When switching TO custom, copy colors from the currently selected theme
    if (themeId === THEME_IDS.CUSTOM && selectedTheme !== THEME_IDS.CUSTOM) {
      const colorsToClone = getDisplayColors(selectedTheme, customColors);
      setCustomColors(colorsToClone);
    }

    setSelectedTheme(themeId);
  }

  function handleColorsChange(newColors: CustomThemeColors) {
    setCustomColors(newColors);
  }

  async function handleSave() {
    if (!hasChanges) return;

    setIsSaving(true);

    try {
      let result: { success: boolean; error?: string };

      if (isCustomSelected) {
        // Save custom colors (server action also activates the custom theme)
        result = await updateCustomThemeColors(customColors);
      } else {
        // Save predefined theme
        result = await updateActiveTheme(selectedTheme);
      }

      if (result.success) {
        toastSuccess("Theme actualizado correctamente");
        setTimeout(() => {
          router.refresh();
        }, 500);
      } else {
        toastError(result.error ?? "Error al actualizar el theme");
      }
    } catch {
      toastError("Error inesperado al actualizar el theme");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Theme Catalog - horizontal scrollable */}
      <ThemeCatalog
        selectedThemeId={selectedTheme}
        customColors={customColors}
        onSelect={handleThemeSelect}
      />

      {/* Color Editor - shows theme colors, only editable for custom */}
      <ThemeColorEditor
        colors={displayColors}
        onChange={handleColorsChange}
        isEditable={isCustomSelected}
      />

      {/* Save button */}
      <div className="flex justify-end pt-2">
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
