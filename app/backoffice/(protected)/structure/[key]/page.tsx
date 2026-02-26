import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getUserEventContext } from "@/lib/event-context-prisma";
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
  const { key } = await params;

  // Obtener el evento del usuario
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/backoffice/login");
  }

  const eventContext = await getUserEventContext(session.user.id);

  if (!eventContext?.eventId) {
    redirect("/backoffice");
  }

  // Obtener secciones del evento
  const sections = await getSectionConfigurations(eventContext.eventId);

  // Verificar que el key sea válido
  if (!isSectionKey(key)) {
    notFound();
  }

  // Obtener metadata
  const metadata = SECTION_METADATA[key];

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
    if (!isSectionKey(key)) {
      return { success: false, error: "Clave de sección inválida" };
    }
    return await updateSectionSettings(section.id, key, settings);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/backoffice/structure"
          className="flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <span className="text-4xl">{metadata.icon}</span>
          {metadata.name}
        </h1>
        <p className="text-foreground/60 mt-2">{metadata.description}</p>
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
