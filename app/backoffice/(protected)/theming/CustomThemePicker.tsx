"use client";

import { useState, useRef, useEffect } from "react";
import { HexColorPicker } from "react-colorful";
import type { CustomThemeColors } from "@/types/theme";

// 5 user-configurable color slots — module constant, not recreated on each render
const COLOR_SLOTS = [
  {
    key: "background" as const,
    label: "Fondo de página",
    description: "Color base de toda la invitación",
  },
  {
    key: "foreground" as const,
    label: "Texto principal",
    description: "Color del texto sobre el fondo",
  },
  {
    key: "primary" as const,
    label: "Color principal",
    description: "Botones, links y elementos de acción",
  },
  {
    key: "secondary" as const,
    label: "Fondo de sección",
    description: "Fondo de secciones con fondo alternativo",
  },
  {
    key: "accent" as const,
    label: "Acento decorativo",
    description: "Divisores, gradientes y detalles de música",
  },
] as const;

// ============================================================================
// ColorSlot — a single color slot with its floating picker
// Single responsibility: manage open/close state of ONE color picker
// ============================================================================

interface ColorSlotProps {
  colorKey: keyof CustomThemeColors;
  label: string;
  description: string;
  value: string;
  onChange: (key: keyof CustomThemeColors, value: string) => void;
}

function ColorSlot({
  colorKey,
  label,
  description,
  value,
  onChange,
}: ColorSlotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside the picker
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleHexInput = (raw: string) => {
    // Only update if format is valid while typing
    if (/^#[0-9A-Fa-f]{0,6}$/.test(raw)) {
      onChange(colorKey, raw);
    }
  };

  const handleHexBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // On blur: if hex is incomplete, revert to the last valid value
    if (!/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
      onChange(colorKey, value); // revert to last valid value
    }
  };

  return (
    <div ref={containerRef} className="relative flex items-center gap-3">
      {/* Swatch — opens/closes the picker */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex-shrink-0 w-10 h-10 rounded-full border-2 border-white shadow-md ring-1 ring-gray-200 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400"
        style={{ backgroundColor: value }}
        aria-label={`Cambiar ${label}`}
        aria-expanded={isOpen}
      />

      {/* Floating picker */}
      {isOpen && (
        <div className="absolute left-0 top-12 z-50 rounded-xl shadow-xl border border-divider bg-content1 p-3 flex flex-col gap-2">
          <HexColorPicker
            color={value}
            onChange={(newColor: string) => onChange(colorKey, newColor)}
          />
          {/* Manual hex input below the picker */}
          <input
            type="text"
            value={value}
            onChange={(e) => handleHexInput(e.target.value)}
            onBlur={handleHexBlur}
            placeholder="#000000"
            maxLength={7}
            className="w-full text-sm font-mono text-center border border-divider rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary bg-content2 text-foreground"
            aria-label={`Valor hex de ${label}`}
          />
        </div>
      )}

      {/* Slot info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-foreground/50 truncate">{description}</p>
        {/* Hex value always visible */}
        <p className="mt-0.5 text-xs font-mono text-foreground/40">{value}</p>
      </div>
    </div>
  );
}

// ============================================================================
// CustomThemePicker — composes the 5 ColorSlots
// Controlled: no local state, just orchestrates the slots
// ============================================================================

interface CustomThemePickerProps {
  colors: CustomThemeColors;
  onChange: (colors: CustomThemeColors) => void;
}

export default function CustomThemePicker({
  colors,
  onChange,
}: CustomThemePickerProps) {
  const handleSlotChange = (key: keyof CustomThemeColors, value: string) => {
    onChange({ ...colors, [key]: value });
  };

  return (
    <div className="space-y-4 p-4 border border-divider rounded-lg bg-content1">
      <p className="text-sm font-medium text-foreground">
        Personalizá los colores de tu tema
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {COLOR_SLOTS.map((slot) => (
          <ColorSlot
            key={slot.key}
            colorKey={slot.key}
            label={slot.label}
            description={slot.description}
            value={colors[slot.key]}
            onChange={handleSlotChange}
          />
        ))}
      </div>

      {/* Full palette preview */}
      <div className="flex items-center gap-2 pt-2 border-t border-divider">
        <span className="text-xs text-foreground/50">Vista previa:</span>
        {COLOR_SLOTS.map((slot) => (
          <span
            key={slot.key}
            className="w-7 h-7 rounded-full border-2 border-white shadow-sm ring-1 ring-gray-200"
            style={{ backgroundColor: colors[slot.key] }}
            title={`${slot.label}: ${colors[slot.key]}`}
          />
        ))}
      </div>
    </div>
  );
}
