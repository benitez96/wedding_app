import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { SECTION_METADATA, isSectionKey } from "@/components/sections/metadata";
import {
  getSectionConfigurations,
  updateSectionSettings,
} from "@/app/actions/sections";
import { SectionEditor } from "./SectionEditor";

// Forzar renderizado dinámico
export const dynamic = "force-dynamic";

interface EditSectionPageProps {
  params: Promise<{ key: string }>;
}

export default async function EditSectionPage({
  params,
}: EditSectionPageProps) {
  // Iniciar fetch de secciones ANTES de await params (parallel fetching)
  const sectionsPromise = getSectionConfigurations();

  const { key } = await params;

  // Verificar que el key sea válido
  if (!isSectionKey(key)) {
    notFound();
  }

  // Obtener metadata
  const metadata = SECTION_METADATA[key];

  // Ahora sí await (ya está corriendo en paralelo)
  const sections = await sectionsPromise;
  const section = sections.find((s) => s.key === key);

  if (!section) {
    notFound();
  }

  // Server action para guardar
  async function handleSave(settings: Record<string, unknown>) {
    "use server";
    if (!section) {
      return { success: false, error: "Sección no encontrada" };
    }
    return await updateSectionSettings(section.id, key, settings);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/backoffice/estructura"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <span className="text-4xl">{metadata.icon}</span>
          {metadata.name}
        </h1>
        <p className="text-gray-600 mt-2">{metadata.description}</p>
      </div>

      {/* Editor con formulario y preview */}
      <SectionEditor
        sectionKey={key}
        initialSettings={section.settings || {}}
        onSave={handleSave}
      />
    </div>
  );
}
