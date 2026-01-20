// ============================================
// TYPES
// ============================================
// Los SECTION_KEYS y SECTIONS_METADATA se auto-generan ahora
// en components/sections/metadata.ts via scripts/sync-sections.ts
// Este archivo solo mantiene tipos compartidos

// Re-export SectionKey desde el metadata auto-generado
export type { SectionKey } from "@/components/sections/metadata";

// Configuración de una sección (lo que se guarda en BD)
export interface SectionConfiguration {
  id: string;
  key: string; // Usamos string genérico aquí para evitar import circular
  isEnabled: boolean;
  order: number;
  settings?: Record<string, unknown>; // Configuraciones específicas de cada sección
}

// ============================================
// SECTION COMPONENT PROPS
// ============================================

// User data para secciones que lo necesitan (ej: RSVP)
export interface SectionUser {
  id: string;
  guestName: string;
  maxGuests: number;
  hasResponded: boolean;
  isAttending: boolean | null;
  guestCount: number | null;
}

// Props base que reciben TODAS las secciones
export interface BaseSectionProps {
  settings?: Record<string, unknown>;
}

// Props extendidas para secciones que necesitan user (solo RSVP por ahora)
export interface SectionPropsWithUser extends BaseSectionProps {
  user?: SectionUser | null;
}

// Tipo del componente de sección
export type SectionComponent = React.ComponentType<BaseSectionProps>;
export type SectionComponentWithUser =
  React.ComponentType<SectionPropsWithUser>;
