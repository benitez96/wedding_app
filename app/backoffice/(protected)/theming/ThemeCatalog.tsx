"use client";

import { Card } from "@heroui/card";
import { CheckCircle2, Palette } from "lucide-react";
import clsx from "clsx";
import {
  THEME_LIST,
  THEME_IDS,
  type ThemeId,
  type CustomThemeColors,
} from "@/types/theme";

// ============================================================================
// Types
// ============================================================================

interface ThemeOption {
  id: ThemeId;
  name: string;
  description: string;
  colors: CustomThemeColors;
  isDark: boolean;
}

interface ThemeCatalogProps {
  selectedThemeId: ThemeId;
  customColors: CustomThemeColors;
  onSelect: (themeId: ThemeId) => void;
}

// ============================================================================
// Constants - Build theme options with dark/light detection
// ============================================================================

/**
 * Determines if a background color is "dark" based on relative luminance.
 * Uses the WCAG formula for perceived brightness.
 */
function isDarkColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Relative luminance formula (simplified)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

/**
 * Get all theme options (predefined + custom placeholder)
 */
function getThemeOptions(customColors: CustomThemeColors): ThemeOption[] {
  const predefined: ThemeOption[] = THEME_LIST.map((theme) => ({
    id: theme.id,
    name: theme.name,
    description: theme.description,
    colors: theme.colors,
    isDark: isDarkColor(theme.colors.background),
  }));

  const custom: ThemeOption = {
    id: THEME_IDS.CUSTOM,
    name: "Personalizado",
    description: "Tus propios colores",
    colors: customColors,
    isDark: isDarkColor(customColors.background),
  };

  return [...predefined, custom];
}

// ============================================================================
// ThemeCircle - Conic gradient blend of theme colors
// ============================================================================

interface ThemeCircleProps {
  colors: CustomThemeColors;
  isCustom?: boolean;
  size?: "sm" | "md";
}

function ThemeCircle({
  colors,
  isCustom = false,
  size = "md",
}: ThemeCircleProps) {
  const sizeClasses = size === "sm" ? "w-8 h-8" : "w-12 h-12";
  const innerSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";

  // Concentric circles: background (outer) → primary (middle) → accent (inner)
  // Much cleaner and more elegant than conic gradient
  return (
    <div
      className={clsx(
        sizeClasses,
        "rounded-full flex-shrink-0",
        "flex items-center justify-center",
        "shadow-lg",
        "transition-transform group-hover:scale-110",
      )}
      style={{
        backgroundColor: colors.background,
        border: `2px solid ${colors.foreground}`,
      }}
    >
      <div
        className="w-3/4 h-3/4 rounded-full flex items-center justify-center"
        style={{ backgroundColor: colors.primary }}
      >
        <div
          className={clsx(
            innerSize,
            "rounded-full flex items-center justify-center",
          )}
          style={{ backgroundColor: colors.accent }}
        >
          {isCustom ? (
            <Palette className="w-2.5 h-2.5 text-white drop-shadow-md" />
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ThemeCatalog - Horizontal scrollable catalog
// ============================================================================

export default function ThemeCatalog({
  selectedThemeId,
  customColors,
  onSelect,
}: ThemeCatalogProps) {
  const themeOptions = getThemeOptions(customColors);

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground/70">
        Seleccioná un tema base
      </p>

      {/* Horizontal scroll container */}
      <div className="overflow-x-auto -mx-4 pl-4 pr-6 pb-4">
        <div className="flex gap-4 pt-2 pb-1">
          {themeOptions.map((theme) => {
            const isSelected = selectedThemeId === theme.id;
            const isCustom = theme.id === THEME_IDS.CUSTOM;

            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => onSelect(theme.id)}
                className="group flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-2xl"
              >
                <Card
                  className={clsx(
                    "w-32 transition-all",
                    isSelected
                      ? "ring-2 ring-primary shadow-lg"
                      : "hover:shadow-md opacity-75 hover:opacity-100",
                  )}
                >
                  <div className="p-4 flex flex-col items-center gap-3 text-center relative">
                    {/* Selection indicator */}
                    {isSelected ? (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      </div>
                    ) : null}

                    {/* Color blend circle */}
                    <ThemeCircle colors={theme.colors} isCustom={isCustom} />

                    {/* Theme name */}
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground line-clamp-2 text-center leading-tight min-h-[2.5em]">
                        {theme.name}
                      </p>
                      {/* Dark/Light badge */}
                      <span
                        className={clsx(
                          "inline-block text-[10px] px-1.5 py-0.5 rounded-full",
                          theme.isDark
                            ? "bg-gray-800 text-gray-200"
                            : "bg-gray-200 text-gray-700",
                        )}
                      >
                        {theme.isDark ? "Oscuro" : "Claro"}
                      </span>
                    </div>
                  </div>
                </Card>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Exports for testing
// ============================================================================

export { ThemeCircle, isDarkColor, getThemeOptions };
export type { ThemeOption, ThemeCatalogProps, ThemeCircleProps };
