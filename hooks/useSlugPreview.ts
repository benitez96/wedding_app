import { useState, useEffect } from "react";

/**
 * Genera un slug preview a partir de un string (sin validación de unicidad)
 * Esta es la versión cliente de generateSlug para preview en tiempo real
 */
export function generateSlugPreview(text: string): string {
  if (!text || text.trim().length === 0) return "";

  return text
    .toLowerCase()
    .normalize("NFD") // Descomponer caracteres acentuados
    .replace(/[\u0300-\u036f]/g, "") // Remover diacríticos
    .replace(/[^a-z0-9\s-]/g, "") // Remover caracteres especiales
    .trim()
    .replace(/\s+/g, "-") // Reemplazar espacios por guiones
    .replace(/-+/g, "-") // Remover guiones duplicados
    .substring(0, 100); // Limitar longitud
}

interface UseSlugPreviewResult {
  /** El nombre actual del evento (controlled) */
  eventName: string;
  /** Setter para actualizar el nombre */
  setEventName: (name: string) => void;
  /** Preview del slug basado en el nombre actual */
  slugPreview: string;
  /** Si el nombre cambió respecto al original */
  nameChanged: boolean;
  /** Si el slug cambiará al guardar */
  slugWillChange: boolean;
}

/**
 * Hook para manejar la lógica de preview de slug en tiempo real
 *
 * @param initialName - Nombre inicial del evento
 * @param currentSlug - Slug actual del evento en la BD
 * @returns Estado y helpers para manejar el preview del slug
 */
export function useSlugPreview(
  initialName: string,
  currentSlug: string,
): UseSlugPreviewResult {
  const [eventName, setEventName] = useState(initialName);
  const [slugPreview, setSlugPreview] = useState(currentSlug);

  // Calcular si el nombre cambió respecto al inicial
  const nameChanged = eventName.trim() !== initialName;

  // Actualizar preview del slug cuando cambia el nombre o el slug actual
  useEffect(() => {
    // Si el nombre NO ha cambiado, usar el slug actual de la BD
    // (caso: después de un save, el slug puede haber cambiado por colisiones)
    if (!nameChanged) {
      setSlugPreview(currentSlug);
      return;
    }

    // Si el nombre cambió, calcular preview basado en el nuevo nombre
    const preview = generateSlugPreview(eventName);
    setSlugPreview(preview || currentSlug);
  }, [eventName, currentSlug, nameChanged]);

  const slugWillChange = nameChanged && slugPreview !== currentSlug;

  return {
    eventName,
    setEventName,
    slugPreview,
    nameChanged,
    slugWillChange,
  };
}
