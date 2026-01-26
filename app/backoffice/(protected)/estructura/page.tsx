import EstructuraClient from "./EstructuraClient";
import { getSectionConfigurations } from "@/app/actions/sections";

// Forzar renderizado dinámico (no estático)
export const dynamic = "force-dynamic";

export default async function EstructuraPage() {
  // Obtener secciones de la BD
  const sections = await getSectionConfigurations();

  return <EstructuraClient initialSections={sections} />;
}
