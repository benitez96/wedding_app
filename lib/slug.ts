import "server-only";

import type { PrismaClient } from "@/app/generated/prisma";

/**
 * Genera un slug a partir de un string
 * Convierte a lowercase, remueve acentos, reemplaza espacios por guiones
 *
 * @throws Error si el resultado es un slug vacío (input es solo emojis/unicode)
 */
export function generateSlug(text: string): string {
  // Validar input
  if (!text || text.trim().length === 0) {
    throw new Error("El texto no puede estar vacío");
  }

  const slug = text
    .toLowerCase()
    .normalize("NFD") // Descomponer caracteres acentuados
    .replace(/[\u0300-\u036f]/g, "") // Remover diacríticos
    .replace(/[^a-z0-9\s-]/g, "") // Remover caracteres especiales
    .trim()
    .replace(/\s+/g, "-") // Reemplazar espacios por guiones
    .replace(/-+/g, "-") // Remover guiones duplicados
    .replace(/^-+|-+$/g, "") // Remover guiones al inicio y final
    .substring(0, 100); // Limitar longitud

  // Validar que el slug no esté vacío después de sanitización
  // (puede pasar si el input es solo emojis/unicode)
  if (slug.length === 0) {
    throw new Error(
      "El nombre del evento debe contener al menos caracteres alfanuméricos",
    );
  }

  return slug;
}

/**
 * Verifica si un slug está disponible (no existe en la BD)
 * Excluye el eventId actual para permitir updates
 */
export async function isSlugAvailable(
  slug: string,
  prisma: PrismaClient,
  excludeEventId?: string,
): Promise<boolean> {
  const existing = await prisma.event.findUnique({
    where: { slug },
    select: { id: true },
  });

  // Si no existe, está disponible
  if (!existing) return true;

  // Si existe pero es el mismo evento que estamos editando, está disponible
  if (excludeEventId && existing.id === excludeEventId) return true;

  return false;
}

/**
 * Genera un slug único agregando sufijos numéricos si es necesario
 * Ejemplo: "mi-evento" → "mi-evento-2" → "mi-evento-3"
 */
export async function generateUniqueSlug(
  text: string,
  prisma: PrismaClient,
  excludeEventId?: string,
): Promise<string> {
  const baseSlug = generateSlug(text);

  // Verificar si el slug base está disponible
  if (await isSlugAvailable(baseSlug, prisma, excludeEventId)) {
    return baseSlug;
  }

  // Si no, intentar con sufijos numéricos
  let counter = 2;
  while (counter < 100) {
    // Limitar intentos para evitar loops infinitos
    const candidateSlug = `${baseSlug}-${counter}`;

    if (await isSlugAvailable(candidateSlug, prisma, excludeEventId)) {
      return candidateSlug;
    }

    counter++;
  }

  // Fallback: agregar timestamp si todos los intentos fallan
  return `${baseSlug}-${Date.now()}`;
}
