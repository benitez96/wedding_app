"use client";

import type { FormEvent, Key } from "react";
import { Tabs, Tab } from "@heroui/tabs";

import { Button } from "@heroui/button";
import { useState } from "react";
import { Save } from "lucide-react";
import { RSVPSectionSettings } from "./RSVPSection.metadata";
import {
  SectionSettingsFormProps,
  createSettingsUpdater,
} from "@/types/section-settings-form";
import { useToastFeedback } from "@/hooks/useToastFeedback";
import { RSVPGeneralTab } from "./settings/RSVPGeneralTab";
import { RSVPAttendanceStepTab } from "./settings/RSVPAttendanceStepTab";
import { RSVPPendingContentTab } from "./settings/RSVPPendingContentTab";
import { RSVPConfirmedContentTab } from "./settings/RSVPConfirmedContentTab";
import { RSVPDeclinedContentTab } from "./settings/RSVPDeclinedContentTab";
import { RSVPMenuStepTab } from "./settings/RSVPMenuStepTab";
import { RSVPDietaryStepTab } from "./settings/RSVPDietaryStepTab";
import { RSVPMessageStepTab } from "./settings/RSVPMessageStepTab";

export function RSVPSectionSettingsForm({
  initialSettings,
  onSave,
  onSettingsChange,
}: SectionSettingsFormProps<RSVPSectionSettings>) {
  const [settings, setSettings] = useState<Partial<RSVPSectionSettings>>(
    () => ({
      showFloatingButton: initialSettings.showFloatingButton ?? true,
      hasAlternateBg: initialSettings.hasAlternateBg ?? false,

      attendanceStep: initialSettings.attendanceStep ?? {
        question: "¿Vas a asistir a nuestra boda?", // TODO: i18n
        acceptLabel: "¡Sí, acepto!", // TODO: i18n
        acceptSubtitle: "Voy a estar ahí", // TODO: i18n
        declineLabel: "No puedo ir :(", // TODO: i18n
        declineSubtitle: "Lo siento mucho", // TODO: i18n
      },
      pendingContent: initialSettings.pendingContent ?? {
        icon: "rsvp" as const,
        decorativeText: 'Decile "Si acepto" a nuestra invitacion', // TODO: i18n
        ctaLabel: "CONFIRMAR ASISTENCIA", // TODO: i18n
        footerText: "Tenes tiempo hasta el 10 de Enero!", // TODO: i18n
      },
      confirmedContent: initialSettings.confirmedContent ?? {
        icon: "disco-ball" as const,
        decorativeText: "¡Gracias por confirmar tu asistencia!", // TODO: i18n
        description:
          "¡Anda recargando baterías que vamos a bailar toda la noche! 🕺💃", // TODO: i18n
        footerText: "¡Prepárate para una noche inolvidable!", // TODO: i18n
        changeLabel: "Cambié de opinión", // TODO: i18n
      },
      declinedContent: initialSettings.declinedContent ?? {
        icon: "rsvp" as const,
        decorativeText: "Entendemos que no puedas asistir", // TODO: i18n
        description:
          "¡Uff que triste! 😢 Nos hubiera encantado compartir este momento especial con vos.", // TODO: i18n
        footerText: "¡Te vamos a extrañar mucho!", // TODO: i18n
        changeLabel: "Cambié de opinión", // TODO: i18n
      },

      menuStep: initialSettings.menuStep ?? {
        enabled: false,
        question: "¿Cuál es tu preferencia de menú?", // TODO: i18n
        options: ["Carne", "Vegetariano", "Vegano"], // TODO: i18n
      },
      dietaryStep: initialSettings.dietaryStep ?? {
        enabled: false,
        question: "¿Tenés alguna alergia o restricción alimentaria?", // TODO: i18n
      },
      messageStep: initialSettings.messageStep ?? {
        enabled: false,
        question: "¿Querés dejarnos un mensaje?", // TODO: i18n
      },

      decorationSvg: initialSettings.decorationSvg ?? "none",
      decorationPattern: initialSettings.decorationPattern ?? "none",
      decorationOpacity: initialSettings.decorationOpacity ?? 10,
      decorationSize: initialSettings.decorationSize ?? 60,
    }),
  );
  const [isSaving, setIsSaving] = useState(false);
  const { toastSuccess, toastError } = useToastFeedback();

  const updateSettings = createSettingsUpdater(setSettings, onSettingsChange);

  // Maps each tab to the preview state it should show.
  // "modal:stepId" tells the preview to render the modal content inline for that step.
  const TAB_PREVIEW_STATE: Record<string, string> = {
    general: "pending",
    attendance: "modal:attendance",
    pending: "pending",
    confirmed: "confirmed",
    declined: "declined",
    menu: "modal:menu",
    dietary: "modal:dietary",
    message: "modal:message",
  };

  const handleTabChange = (key: Key) => {
    const previewState = TAB_PREVIEW_STATE[String(key)] ?? "pending";
    onSettingsChange?.({
      ...settings,
      _previewState: previewState,
    } as RSVPSectionSettings);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(settings as RSVPSectionSettings);
      toastSuccess("Cambios guardados correctamente"); // TODO: i18n
    } catch {
      toastError("Error al guardar los cambios"); // TODO: i18n
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs
        aria-label="RSVP settings"
        variant="underlined"
        color="primary"
        classNames={{
          tabList:
            "overflow-x-auto flex-nowrap w-full [mask-image:linear-gradient(to_right,transparent_0,black_16px,black_calc(100%-16px),transparent_100%)]",
        }}
        fullWidth
        onSelectionChange={handleTabChange}
      >
        {/* TODO: i18n — all tab labels */}

        <Tab key="general" title="General">
          <div className="pt-2">
            <RSVPGeneralTab settings={settings} onChange={updateSettings} />
          </div>
        </Tab>

        <Tab key="pending" title="Pendiente">
          <div className="pt-2">
            <RSVPPendingContentTab
              settings={settings}
              onChange={updateSettings}
            />
          </div>
        </Tab>

        <Tab key="confirmed" title="Confirmado">
          <div className="pt-2">
            <RSVPConfirmedContentTab
              settings={settings}
              onChange={updateSettings}
            />
          </div>
        </Tab>

        <Tab key="declined" title="No asiste">
          <div className="pt-2">
            <RSVPDeclinedContentTab
              settings={settings}
              onChange={updateSettings}
            />
          </div>
        </Tab>

        <Tab key="attendance" title="Asistencia">
          <div className="pt-2">
            <RSVPAttendanceStepTab
              settings={settings}
              onChange={updateSettings}
            />
          </div>
        </Tab>

        <Tab key="menu" title="Menú">
          <div className="pt-2">
            <RSVPMenuStepTab settings={settings} onChange={updateSettings} />
          </div>
        </Tab>

        <Tab key="dietary" title="Alergias">
          <div className="pt-2">
            <RSVPDietaryStepTab settings={settings} onChange={updateSettings} />
          </div>
        </Tab>

        <Tab key="message" title="Mensaje">
          <div className="pt-2">
            <RSVPMessageStepTab settings={settings} onChange={updateSettings} />
          </div>
        </Tab>
      </Tabs>

      <div className="flex justify-end">
        <Button
          type="submit"
          color="primary"
          startContent={<Save className="w-4 h-4" />}
          isLoading={isSaving}
          isDisabled={isSaving}
        >
          {isSaving ? "Guardando..." : "Guardar Cambios"}
          {/* TODO: i18n */}
        </Button>
      </div>
    </form>
  );
}
