"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";

interface SectionEditorLayoutProps {
  form: React.ReactNode;
  preview: React.ReactNode;
}

export function SectionEditorLayout({
  form,
  preview,
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
            {preview}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
