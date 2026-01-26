"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Spinner } from "@heroui/spinner";
import { SectionEditorLayout } from "./SectionEditorLayout";
import type { SectionKey } from "@/components/sections/metadata";

// Import directo de los client components (no los wrappers server)
import AccommodationSectionClient from "@/components/sections/AccommodationSection/AccommodationSection";
import CelebrationSectionClient from "@/components/sections/CelebrationSection/CelebrationSection";
import CeremonySectionClient from "@/components/sections/CeremonySection/CeremonySection";
import DateSectionClient from "@/components/sections/DateSection/DateSection";
import DressCodeSectionClient from "@/components/sections/DressCodeSection/DressCodeSection";
import GiftSectionClient from "@/components/sections/GiftSection/GiftSection";
import HeroSectionClient from "@/components/sections/HeroSection/HeroSection";
import InstagramSectionClient from "@/components/sections/InstagramSection/InstagramSection";
import PhotoUploadSectionClient from "@/components/sections/PhotoUploadSection/PhotoUploadSection";
import QuoteSectionClient from "@/components/sections/QuoteSection/QuoteSection";
import RSVPSectionClient from "@/components/sections/RSVPSection/RSVPSection";

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
  dress_code: DressCodeSectionClient,
  gift: GiftSectionClient,
  hero: HeroSectionClient,
  instagram: InstagramSectionClient,
  photo_upload: PhotoUploadSectionClient,
  quote: QuoteSectionClient,
  rsvp: RSVPSectionClient,
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

  // Obtener el componente del mapa pre-creado (estable, no se recrea)
  const SettingsForm = SECTION_SETTINGS_FORMS[sectionKey];
  const SectionComponent = SECTION_PREVIEW_COMPONENTS[sectionKey];

  return (
    <SectionEditorLayout
      form={
        <SettingsForm
          initialSettings={initialSettings}
          onSave={onSave}
          onSettingsChange={setCurrentSettings}
        />
      }
      preview={<SectionComponent settings={currentSettings as never} />}
    />
  );
}
