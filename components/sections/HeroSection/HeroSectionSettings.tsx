"use client";

import { Input } from "@heroui/input";
import { Switch } from "@heroui/switch";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { RadioGroup, Radio } from "@heroui/radio";
import { useState } from "react";
import dynamic from "next/dynamic";
import {
  HeroSectionSettings,
  TEXT_COLORS,
  LAYOUT_MODES,
  OBJECT_FIT_MODES,
} from "./HeroSection.metadata";
import { Save } from "lucide-react";
import {
  SectionSettingsFormProps,
  createSettingsUpdater,
  useInitialSettingsSync,
} from "@/types/section-settings-form";

// ✅ BUNDLE SIZE: Cargar ImageUpload solo cuando se necesite (lazy loading)
const ImageUpload = dynamic(
  () =>
    import("@/components/ui/ImageUpload").then((mod) => ({
      default: mod.ImageUpload,
    })),
  {
    loading: () => (
      <div className="space-y-2">
        <div className="h-48 bg-gray-100 animate-pulse rounded-lg" />
      </div>
    ),
    ssr: false,
  },
);

export function HeroSectionSettingsForm({
  initialSettings,
  onSave,
  onSettingsChange,
}: SectionSettingsFormProps<HeroSectionSettings>) {
  const [settings, setSettings] = useState<Partial<HeroSectionSettings>>(
    () => ({
      imageUrl: initialSettings.imageUrl || "/logo-2.jpeg",
      title: initialSettings.title || "NUESTRA BODA",
      showScrollIndicator: initialSettings.showScrollIndicator ?? true,
      enableOverlay: initialSettings.enableOverlay ?? false,
      enableFadeEffect: initialSettings.enableFadeEffect ?? false,
      textColor: initialSettings.textColor || TEXT_COLORS.BLACK,
      layoutMode: initialSettings.layoutMode || LAYOUT_MODES.OVERLAY,
      mediaType: initialSettings.mediaType || "image",
      objectFit: initialSettings.objectFit || OBJECT_FIT_MODES.COVER,
    }),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Notificar el estado inicial al preview
  useInitialSettingsSync(settings, onSettingsChange);

  // Usar el helper para actualizar settings y notificar cambios
  const updateSettings = createSettingsUpdater(setSettings, onSettingsChange);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      await onSave(settings as HeroSectionSettings);
      setMessage("Cambios guardados correctamente");
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage("Error al guardar los cambios");
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mensaje de feedback */}
      {message && (
        <div
          className={
            message.includes("Error")
              ? "p-3 bg-danger-50 text-danger-700 border border-danger-200 rounded-lg"
              : "p-3 bg-success-50 text-success-700 border border-success-200 rounded-lg"
          }
        >
          {message}
        </div>
      )}

      <Card>
        <CardBody className="space-y-4">
          {/* Upload de imagen o video */}
          <ImageUpload
            currentImageUrl={settings.imageUrl}
            currentMediaType={settings.mediaType}
            onImageChange={(url, mediaType) =>
              updateSettings((prev) => ({ ...prev, imageUrl: url, mediaType }))
            }
            label="Imagen o Video Principal"
            description="Subir imagen (JPG, PNG, WebP) o video (MP4, WebM, MOV - Máx. 20MB)"
          />

          {/* URL de imagen (fallback manual) */}
          <Input
            label="URL de la Imagen (opcional)"
            description="O ingresá una URL externa directamente"
            placeholder="/logo-2.jpeg"
            value={settings.imageUrl || ""}
            onChange={(e) =>
              updateSettings((prev) => ({ ...prev, imageUrl: e.target.value }))
            }
          />

          {/* Título */}
          <Input
            label="Título"
            description="Texto que aparece sobre la imagen"
            placeholder="NUESTRA BODA"
            value={settings.title || ""}
            onChange={(e) =>
              updateSettings((prev) => ({ ...prev, title: e.target.value }))
            }
          />

          {/* Selector de color de texto */}
          <RadioGroup
            label="Color del Texto"
            description="Color del título y scroll indicator"
            value={settings.textColor || TEXT_COLORS.BLACK}
            onValueChange={(value) =>
              updateSettings((prev) => ({
                ...prev,
                textColor: value as
                  | typeof TEXT_COLORS.BLACK
                  | typeof TEXT_COLORS.WHITE,
              }))
            }
            orientation="horizontal"
          >
            <Radio value={TEXT_COLORS.BLACK}>Negro</Radio>
            <Radio value={TEXT_COLORS.WHITE}>Blanco</Radio>
          </RadioGroup>

          {/* Selector de object-fit */}
          <RadioGroup
            label="Ajuste de Imagen/Video"
            description="Cover: rellena todo el espacio (puede recortar) | Contain: muestra completo (puede dejar espacios)"
            value={settings.objectFit || OBJECT_FIT_MODES.COVER}
            onValueChange={(value) =>
              updateSettings((prev) => ({
                ...prev,
                objectFit: value as
                  | typeof OBJECT_FIT_MODES.COVER
                  | typeof OBJECT_FIT_MODES.CONTAIN,
              }))
            }
            orientation="horizontal"
          >
            <Radio value={OBJECT_FIT_MODES.COVER}>Cover (Rellenar)</Radio>
            <Radio value={OBJECT_FIT_MODES.CONTAIN}>Contain (Ajustar)</Radio>
          </RadioGroup>

          {/* Switch para layout mode */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Texto Superpuesto</p>
              <p className="text-xs text-gray-600">
                Activado: texto sobre la imagen | Desactivado: texto debajo
                (apilado)
              </p>
            </div>
            <Switch
              isSelected={settings.layoutMode === LAYOUT_MODES.OVERLAY}
              onValueChange={(val) =>
                updateSettings((prev) => ({
                  ...prev,
                  layoutMode: val ? LAYOUT_MODES.OVERLAY : LAYOUT_MODES.STACKED,
                }))
              }
              color="success"
            />
          </div>

          {/* Switch para scroll indicator */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Indicador de Scroll</p>
              <p className="text-xs text-gray-600">
                Mostrar flecha animada para indicar scroll
              </p>
            </div>
            <Switch
              isSelected={settings.showScrollIndicator}
              onValueChange={(val) =>
                updateSettings((prev) => ({
                  ...prev,
                  showScrollIndicator: val,
                }))
              }
              color="success"
            />
          </div>

          {/* Switch para overlay */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Overlay Oscuro</p>
              <p className="text-xs text-gray-600">
                Capa oscura sobre la imagen para mejorar legibilidad del texto
              </p>
            </div>
            <Switch
              isSelected={settings.enableOverlay}
              onValueChange={(val) =>
                updateSettings((prev) => ({
                  ...prev,
                  enableOverlay: val,
                }))
              }
              color="success"
            />
          </div>

          {/* Switch para fade effect */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Degradado Transparente</p>
              <p className="text-xs text-gray-600">
                Difuminar el borde inferior de la imagen hacia transparente
              </p>
            </div>
            <Switch
              isSelected={settings.enableFadeEffect}
              onValueChange={(val) =>
                updateSettings((prev) => ({
                  ...prev,
                  enableFadeEffect: val,
                }))
              }
              color="success"
            />
          </div>
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <Button
          type="submit"
          color="primary"
          startContent={<Save className="w-4 h-4" />}
          isLoading={isSaving}
          isDisabled={isSaving}
        >
          {isSaving ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>
    </form>
  );
}
