"use client";

import { Info } from "lucide-react";
import { Card, CardBody } from "@heroui/card";

interface PreviewPlaceholderProps {
  sectionName: string;
  description: string;
}

/**
 * Placeholder para secciones que no pueden mostrarse en preview
 * (porque dependen de datos del servidor como currentUser)
 */
export function PreviewPlaceholder({
  sectionName,
  description,
}: PreviewPlaceholderProps) {
  return (
    <div className="w-full flex items-center justify-center p-8">
      <Card className="max-w-md">
        <CardBody className="flex flex-col items-center gap-4 text-center p-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Info className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">{sectionName}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 Esta sección se verá correctamente en la invitación real
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
