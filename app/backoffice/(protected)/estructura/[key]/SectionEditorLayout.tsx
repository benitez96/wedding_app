"use client";

import type { ComponentType, ReactNode } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";

interface SectionEditorLayoutProps {
  form: ReactNode;
  // Preview receives the component + settings separately so React can reconcile
  // by stable component identity instead of remounting on every settings change.
  PreviewComponent: ComponentType<{ settings: Record<string, unknown> }>;
  previewSettings: Record<string, unknown>;
  previewPlaceholder?: ReactNode;
}

export function SectionEditorLayout({
  form,
  PreviewComponent,
  previewSettings,
  previewPlaceholder,
}: SectionEditorLayoutProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Formulario - Visible en mobile y desktop */}
      <div className="order-1">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Configuración</h3>
          </CardHeader>
          <CardBody>{form}</CardBody>
        </Card>
      </div>

      {/* Preview - Solo visible en desktop */}
      <div className="order-2 hidden lg:block">
        <Card className="sticky top-6">
          <CardHeader>
            <h3 className="text-lg font-semibold">Vista Previa</h3>
          </CardHeader>
          <CardBody className="overflow-auto max-h-[calc(100vh-200px)]">
            {previewPlaceholder ?? (
              <PreviewComponent settings={previewSettings} />
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
