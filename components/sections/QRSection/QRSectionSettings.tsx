"use client";

import { Input, Textarea } from "@heroui/input";

interface QRSectionSettingsProps {
  settings: {
    title?: string;
    subtitle?: string;
  };
  onChange: (settings: Record<string, unknown>) => void;
}

/**
 * Configuración de la sección QR (backoffice)
 *
 * Permite personalizar el título y subtítulo que se muestran
 * en la sección de código QR de la invitación.
 */
export function QRSectionSettingsForm({
  settings,
  onChange,
}: QRSectionSettingsProps) {
  const handleChange = (field: string, value: string) => {
    onChange({
      ...settings,
      [field]: value,
    });
  };

  return (
    <div className="space-y-4">
      <Input
        label="Título"
        placeholder="Código de Acceso"
        value={settings.title || ""}
        onValueChange={(value) => handleChange("title", value)}
        description="Título de la sección"
      />

      <Textarea
        label="Subtítulo"
        placeholder="Presenta este código QR al ingresar al evento"
        value={settings.subtitle || ""}
        onValueChange={(value) => handleChange("subtitle", value)}
        description="Descripción de la sección"
        rows={2}
      />

      <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 text-sm">
        <p className="text-warning-800">
          <strong>Nota:</strong> El código QR se genera automáticamente para
          cada invitación y contiene el token único de acceso.
        </p>
      </div>
    </div>
  );
}
