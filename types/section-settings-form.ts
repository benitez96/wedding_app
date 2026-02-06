import type { Dispatch, SetStateAction } from "react";
import { useEffect } from "react";

// Interfaz base que TODOS los formularios de settings deben implementar
export interface SectionSettingsFormProps<T = Record<string, unknown>> {
  initialSettings: Partial<T>;
  onSave: (settings: T) => Promise<unknown>;
  onSettingsChange?: (settings: T) => void;
}

// Helper para crear la función updateSettings en los forms
export function createSettingsUpdater<T>(
  setSettings: Dispatch<SetStateAction<Partial<T>>>,
  onSettingsChange?: (settings: T) => void,
) {
  return (updater: (prev: Partial<T>) => Partial<T>): void => {
    setSettings((prev) => {
      const newSettings = updater(prev);
      // Notificar cambios en tiempo real si existe el callback
      // Usar queueMicrotask para evitar "Cannot update component while rendering"
      if (onSettingsChange) {
        queueMicrotask(() => {
          onSettingsChange(newSettings as T);
        });
      }
      return newSettings;
    });
  };
}

// Hook para notificar el estado inicial al preview
export function useInitialSettingsSync<T>(
  settings: Partial<T>,
  onSettingsChange?: (settings: T) => void,
) {
  useEffect(() => {
    if (onSettingsChange) {
      onSettingsChange(settings as T);
    }
    // Solo ejecutar en mount
  }, []);
}
