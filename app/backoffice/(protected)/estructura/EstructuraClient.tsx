"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import SectionsList from "./SectionsList";
import SectionCatalog from "./SectionCatalog";
import { SectionConfiguration } from "@/types/sections";

interface EstructuraClientProps {
  initialSections: SectionConfiguration[];
}

export default function EstructuraClient({
  initialSections,
}: EstructuraClientProps) {
  // ✅ No state intermedio - useOptimistic en children maneja todo
  const activeSectionKeys = new Set(initialSections.map((s) => s.key));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Estructura</h1>
        <p className="text-foreground/60 mt-2">
          Configurá el orden y visibilidad de las secciones de la invitación
        </p>
      </div>

      {/* Catálogo de componentes disponibles */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold">Componentes Disponibles</h3>
            <p className="text-sm text-foreground/60">
              Hacé click para agregar una sección a tu invitación
            </p>
          </div>
        </CardHeader>
        <CardBody>
          <SectionCatalog activeSectionKeys={activeSectionKeys} />
        </CardBody>
      </Card>

      {/* Lista de secciones activas */}
      {initialSections.length > 0 ? (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-semibold">
                Secciones de la Invitación
              </h3>
              <p className="text-sm text-foreground/60">
                Arrastrá para reordenar, usá el switch para
                habilitar/deshabilitar
              </p>
            </div>
          </CardHeader>
          <CardBody>
            <SectionsList initialSections={initialSections} />
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="p-6 text-center text-foreground/50">
            <p>
              No hay secciones agregadas aún. Usá el catálogo de arriba para
              agregar componentes a tu invitación.
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
