"use client";

import { useState, type ComponentType } from "react";
import dynamic from "next/dynamic";
import { Spinner } from "@heroui/spinner";
import { SectionEditorLayout } from "./SectionEditorLayout";
import type { SectionKey } from "@/components/sections/metadata";
import { PreviewPlaceholder } from "@/components/sections/PreviewPlaceholder";

// Import directo de los client components (no los wrappers server)
import AccommodationSectionClient from "@/components/sections/AccommodationSection/AccommodationSection";
import CelebrationSectionClient from "@/components/sections/CelebrationSection/CelebrationSection";
import CeremonySectionClient from "@/components/sections/CeremonySection/CeremonySection";
import DateSectionClient from "@/components/sections/DateSection/DateSection";
import DividerSectionClient from "@/components/sections/DividerSection/DividerSection";
import DressCodeSectionClient from "@/components/sections/DressCodeSection/DressCodeSection";
import GiftSectionClient from "@/components/sections/GiftSection/GiftSection";
import HeroSectionClient from "@/components/sections/HeroSection/HeroSection";
import InstagramSectionClient from "@/components/sections/InstagramSection/InstagramSection";
import PhotoUploadSectionClient from "@/components/sections/PhotoUploadSection/PhotoUploadSection";
// QRSection es Server Component, no puede usarse en preview client-side
import QuoteSectionClient from "@/components/sections/QuoteSection/QuoteSection";
import RSVPSectionPreview from "@/components/sections/RSVPSection/RSVPSectionPreview";

// Loading component reutilizable
const FormLoading = () => (
  <div className="flex justify-center p-8">
    <Spinner size="lg" />
  </div>
);

// Mapa de componentes client para preview
const SECTION_PREVIEW_COMPONENTS = {
  accommodation: AccommodationSectionClient,
  celebration: CelebrationSectionClient,
  ceremony: CeremonySectionClient,
  date: DateSectionClient,
  divider: DividerSectionClient,
  dress_code: DressCodeSectionClient,
  gift: GiftSectionClient,
  hero: HeroSectionClient,
  instagram: InstagramSectionClient,
  photo_upload: PhotoUploadSectionClient,
  // qr: no tiene preview (Server Component)
  quote: QuoteSectionClient,
  rsvp: RSVPSectionPreview,
} as const;

// Pre-crear los componentes dinámicos a nivel de módulo (estables entre renders)
// Esto evita que el form se resetee cuando cambia el estado del componente padre
const SECTION_SETTINGS_FORMS = {
  accommodation: dynamic(
    () =>
      import(
        "@/components/sections/AccommodationSection/AccommodationSectionSettings"
      ).then((mod) => ({ default: mod.AccommodationSectionSettingsForm })),
    { ssr: false, loading: FormLoading },
  ),
  celebration: dynamic(
    () =>
      import(
        "@/components/sections/CelebrationSection/CelebrationSectionSettings"
      ).then((mod) => ({ default: mod.CelebrationSectionSettingsForm })),
    { ssr: false, loading: FormLoading },
  ),
  ceremony: dynamic(
    () =>
      import(
        "@/components/sections/CeremonySection/CeremonySectionSettings"
      ).then((mod) => ({ default: mod.CeremonySectionSettingsForm })),
    { ssr: false, loading: FormLoading },
  ),
  date: dynamic(
    () =>
      import("@/components/sections/DateSection/DateSectionSettings").then(
        (mod) => ({ default: mod.DateSectionSettingsForm }),
      ),
    { ssr: false, loading: FormLoading },
  ),
  divider: dynamic(
    () =>
      import(
        "@/components/sections/DividerSection/DividerSectionSettings"
      ).then((mod) => {
        if (!mod.DividerSectionSettingsForm) {
          console.error("DividerSectionSettingsForm not found in module");
        }
        return { default: mod.DividerSectionSettingsForm };
      }),
    { ssr: false, loading: FormLoading },
  ),
  dress_code: dynamic(
    () =>
      import(
        "@/components/sections/DressCodeSection/DressCodeSectionSettings"
      ).then((mod) => ({ default: mod.DressCodeSectionSettingsForm })),
    { ssr: false, loading: FormLoading },
  ),
  gift: dynamic(
    () =>
      import("@/components/sections/GiftSection/GiftSectionSettings").then(
        (mod) => ({ default: mod.GiftSectionSettingsForm }),
      ),
    { ssr: false, loading: FormLoading },
  ),
  hero: dynamic(
    () =>
      import("@/components/sections/HeroSection/HeroSectionSettings").then(
        (mod) => ({ default: mod.HeroSectionSettingsForm }),
      ),
    { ssr: false, loading: FormLoading },
  ),
  instagram: dynamic(
    () =>
      import(
        "@/components/sections/InstagramSection/InstagramSectionSettings"
      ).then((mod) => ({ default: mod.InstagramSectionSettingsForm })),
    { ssr: false, loading: FormLoading },
  ),
  photo_upload: dynamic(
    () =>
      import(
        "@/components/sections/PhotoUploadSection/PhotoUploadSectionSettings"
      ).then((mod) => ({ default: mod.PhotoUploadSectionSettingsForm })),
    { ssr: false, loading: FormLoading },
  ),
  // qr: QRSection usa interfaz legacy, skip por ahora
  quote: dynamic(
    () =>
      import("@/components/sections/QuoteSection/QuoteSectionSettings").then(
        (mod) => ({ default: mod.QuoteSectionSettingsForm }),
      ),
    { ssr: false, loading: FormLoading },
  ),
  rsvp: dynamic(
    () =>
      import("@/components/sections/RSVPSection/RSVPSectionSettings").then(
        (mod) => ({ default: mod.RSVPSectionSettingsForm }),
      ),
    { ssr: false, loading: FormLoading },
  ),
} as const;

interface SectionEditorProps {
  sectionKey: SectionKey;
  initialSettings: Record<string, unknown>;
  onSave: (settings: Record<string, unknown>) => Promise<unknown>;
}

export function SectionEditor({
  sectionKey,
  initialSettings,
  onSave,
}: SectionEditorProps) {
  const [currentSettings, setCurrentSettings] =
    useState<Record<string, unknown>>(initialSettings);

  // _previewState lives here, separate from settings, so field edits never wipe it.
  // The settings form emits it mixed into the settings object — we extract and
  // preserve it independently so it survives every keystroke.
  const [previewState, setPreviewState] = useState<string | undefined>(
    undefined,
  );

  const SettingsForm =
    SECTION_SETTINGS_FORMS[sectionKey as keyof typeof SECTION_SETTINGS_FORMS];
  const SectionComponent =
    SECTION_PREVIEW_COMPONENTS[
      sectionKey as keyof typeof SECTION_PREVIEW_COMPONENTS
    ];

  // Intercept onSettingsChange: extract _previewState, store it separately,
  // pass clean settings (without _previewState) to the settings state.
  const handleSettingsChange = (incoming: Record<string, unknown>) => {
    const { _previewState, ...cleanSettings } = incoming;
    if (_previewState !== undefined) {
      setPreviewState(_previewState as string);
    }
    setCurrentSettings(cleanSettings);
  };

  // Inject _previewState back into the settings passed to the preview component
  const previewSettings =
    previewState !== undefined
      ? { ...currentSettings, _previewState: previewState }
      : currentSettings;

  if (!SettingsForm) {
    return (
      <div className="p-8 text-center text-gray-500">
        No hay configuración disponible para esta sección: {sectionKey}
      </div>
    );
  }

  return (
    <SectionEditorLayout
      form={
        <SettingsForm
          initialSettings={initialSettings}
          onSave={onSave}
          onSettingsChange={handleSettingsChange}
        />
      }
      PreviewComponent={
        (SectionComponent ?? (() => null)) as ComponentType<{
          settings: Record<string, unknown>;
        }>
      }
      previewSettings={previewSettings}
      previewPlaceholder={
        !SectionComponent ? (
          <PreviewPlaceholder
            sectionName={getPreviewPlaceholderName(sectionKey)}
            description={getPreviewPlaceholderDescription(sectionKey)}
          />
        ) : undefined
      }
    />
  );
}

// Helpers para placeholders
function getPreviewPlaceholderName(key: SectionKey): string {
  const names: Record<string, string> = {
    qr: "Código QR",
    rsvp: "RSVP",
  };
  return names[key] || "Sección";
}

function getPreviewPlaceholderDescription(key: SectionKey): string {
  const descriptions: Record<string, string> = {
    qr: "Esta sección muestra el código QR único de cada invitado para check-in en el evento.",
    rsvp: "Esta sección muestra el formulario de confirmación personalizado para cada invitado.",
  };
  return (
    descriptions[key] ||
    "Esta sección contiene información personalizada que se verá en la invitación real."
  );
}
