import { Card, CardBody, CardHeader } from "@heroui/card";
import SectionsList from "./SectionsList";
import { getSectionConfigurations } from "@/app/actions/sections";

// Forzar renderizado dinámico (no estático)
export const dynamic = "force-dynamic";

export default async function EstructuraPage() {
  // Obtener secciones de la BD
  const sections = await getSectionConfigurations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Estructura</h1>
        <p className="text-gray-600 mt-2">
          Configurá el orden y visibilidad de las secciones de la invitación
        </p>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Secciones de la Invitación</h3>
          <p className="text-sm text-gray-600 mt-1">
            Arrastrá para reordenar, usá el switch para habilitar/deshabilitar
          </p>
        </CardHeader>
        <CardBody>
          <SectionsList initialSections={sections} />
        </CardBody>
      </Card>
    </div>
  );
}
