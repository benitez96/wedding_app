"use client";

import { useState, useRef, useEffect } from "react";
import { HexColorPicker } from "react-colorful";
import { Pencil } from "lucide-react";
import clsx from "clsx";
import type { CustomThemeColors } from "@/types/theme";

// ============================================================================
// Constants - Color slots configuration
// ============================================================================

const COLOR_SLOTS = [
  {
    key: "background" as const,
    label: "Fondo",
    description: "Color de fondo de la página",
  },
  {
    key: "foreground" as const,
    label: "Texto",
    description: "Color del texto principal",
  },
  {
    key: "primary" as const,
    label: "Botones",
    description: "Botones y links principales",
  },
  {
    key: "secondary" as const,
    label: "Secciones",
    description: "Fondo de secciones alternas",
  },
  {
    key: "accent" as const,
    label: "Detalles",
    description: "Divisores y decoraciones",
  },
] as const;

// ============================================================================
// Types
// ============================================================================

interface ThemeColorEditorProps {
  colors: CustomThemeColors;
  onChange: (colors: CustomThemeColors) => void;
  isEditable: boolean;
}

interface ColorSlotProps {
  colorKey: keyof CustomThemeColors;
  label: string;
  description: string;
  value: string;
  isEditable: boolean;
  onChange: (key: keyof CustomThemeColors, value: string) => void;
}

// ============================================================================
// ColorSlot - Individual color with optional edit capability
// ============================================================================

function ColorSlot({
  colorKey,
  label,
  // description is available for tooltips if needed in the future
  value,
  isEditable,
  onChange,
}: ColorSlotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  function handleHexInput(raw: string) {
    // Allow partial input while typing
    if (/^#[0-9A-Fa-f]{0,6}$/.test(raw)) {
      onChange(colorKey, raw);
    }
  }

  function handleHexBlur(e: React.FocusEvent<HTMLInputElement>) {
    // Revert to valid value if incomplete
    if (!/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
      onChange(colorKey, value);
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center gap-1"
    >
      {/* Color circle with optional edit button */}
      <button
        type="button"
        onClick={() => isEditable && setIsOpen((prev) => !prev)}
        disabled={!isEditable}
        className={clsx(
          "relative w-10 h-10 rounded-full",
          "ring-2 ring-white/30 shadow-md",
          "transition-transform",
          isEditable
            ? "cursor-pointer hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            : "cursor-default",
        )}
        style={{ backgroundColor: value }}
        aria-label={isEditable ? `Editar ${label}` : label}
        aria-expanded={isOpen}
      >
        {isEditable ? (
          <span className="absolute -bottom-0.5 -right-0.5 bg-primary text-primary-foreground rounded-full p-0.5">
            <Pencil className="w-2.5 h-2.5" />
          </span>
        ) : null}
      </button>

      {/* Label */}
      <div className="text-center min-w-0">
        <p className="text-xs font-medium text-foreground truncate">{label}</p>
      </div>

      {/* Floating color picker */}
      {isOpen && isEditable ? (
        <div
          className={clsx(
            "absolute z-50 top-14",
            "rounded-xl shadow-xl border border-divider bg-content1 p-3",
            "flex flex-col gap-2",
          )}
        >
          <p className="text-xs font-medium text-foreground text-center">
            {label}
          </p>
          <HexColorPicker
            color={value}
            onChange={(newColor: string) => onChange(colorKey, newColor)}
          />
          <input
            type="text"
            value={value}
            onChange={(e) => handleHexInput(e.target.value)}
            onBlur={handleHexBlur}
            placeholder="#000000"
            maxLength={7}
            className={clsx(
              "w-full text-sm font-mono text-center",
              "border border-divider rounded-lg px-2 py-1",
              "focus:outline-none focus:ring-1 focus:ring-primary",
              "bg-content2 text-foreground",
            )}
            aria-label={`Valor hex de ${label}`}
          />
        </div>
      ) : null}
    </div>
  );
}

// ============================================================================
// ThemeColorEditor - Grid of color slots
// ============================================================================

export default function ThemeColorEditor({
  colors,
  onChange,
  isEditable,
}: ThemeColorEditorProps) {
  function handleSlotChange(key: keyof CustomThemeColors, value: string) {
    onChange({ ...colors, [key]: value });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground/70">
        {isEditable ? "Personalizá los colores" : "Colores del tema"}
      </p>

      {/* Grid of color slots */}
      <div className="grid grid-cols-5 gap-3 p-4 rounded-xl bg-content2/50 border border-divider">
        {COLOR_SLOTS.map((slot) => (
          <ColorSlot
            key={slot.key}
            colorKey={slot.key}
            label={slot.label}
            description={slot.description}
            value={colors[slot.key]}
            isEditable={isEditable}
            onChange={handleSlotChange}
          />
        ))}
      </div>

      <p className="text-xs text-foreground/50 text-center">
        {isEditable
          ? "Tocá cualquier color para editarlo"
          : 'Seleccioná "Personalizado" para editar colores'}
      </p>
    </div>
  );
}

// ============================================================================
// Exports for testing
// ============================================================================

export { ColorSlot, COLOR_SLOTS };
export type { ThemeColorEditorProps, ColorSlotProps };
