"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
import { Plus, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import EventBadge from "./EventBadge";
import { switchActiveEvent } from "@/app/actions/events";
import { logError } from "@/lib/logger";

interface Event {
  id: string;
  name: string;
  isOwner: boolean;
}

interface EventListSelectorProps {
  events: Event[];
  activeEventId: string | null;
  onCreateEvent: () => void;
}

export default function EventListSelector({
  events,
  activeEventId,
  onCreateEvent,
}: EventListSelectorProps) {
  const router = useRouter();
  const [switchingEventId, setSwitchingEventId] = useState<string | null>(null);

  const handleSwitchEvent = async (eventId: string) => {
    if (eventId === activeEventId || switchingEventId) return;

    setSwitchingEventId(eventId);

    try {
      const result = await switchActiveEvent(eventId);

      if (!result.success) {
        logError(
          "Failed to switch event",
          new Error(result.error || "Unknown error"),
        );
        setSwitchingEventId(null);
        return;
      }

      await router.refresh();
      setSwitchingEventId(null);
    } catch (error) {
      logError("Error switching event", error);
      setSwitchingEventId(null);
    }
  };

  if (events.length === 0) {
    return (
      <div className="flex flex-col gap-3 py-2">
        {/* TODO i18n: "No tienes eventos" */}
        <p className="text-sm text-default-500 text-center">
          No tienes eventos
        </p>
        <Button
          color="primary"
          variant="flat"
          size="sm"
          startContent={<Plus className="w-4 h-4" />}
          onPress={onCreateEvent}
          fullWidth
        >
          {/* TODO i18n: "Crear Primer Evento" */}
          Crear Primer Evento
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 py-2">
      {/* TODO i18n: "Mis Eventos" */}
      <p className="text-xs text-default-500 uppercase font-semibold px-3 mb-1">
        Mis Eventos
      </p>
      <div className="flex flex-col gap-0.5 max-h-64 overflow-y-auto">
        {events.map((event) => {
          const isActive = event.id === activeEventId;
          const isLoading = event.id === switchingEventId;

          return (
            <button
              key={event.id}
              onClick={() => handleSwitchEvent(event.id)}
              disabled={isActive || isLoading}
              className={clsx(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left",
                "hover:bg-default-100 disabled:cursor-default",
                isActive && "bg-primary/10 hover:bg-primary/10",
              )}
            >
              <div className="flex-1 min-w-0">
                <p
                  className={clsx(
                    "text-sm font-medium truncate",
                    isActive && "text-primary",
                  )}
                >
                  {event.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <EventBadge isOwner={event.isOwner} variant="minimal" />
                </div>
              </div>
              {isActive && (
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
              )}
              {isLoading && (
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>
      <div className="pt-2">
        <Button
          color="primary"
          variant="flat"
          size="sm"
          startContent={<Plus className="w-4 h-4" />}
          onPress={onCreateEvent}
          fullWidth
        >
          {/* TODO i18n: "Crear Nuevo Evento" */}
          Crear Nuevo Evento
        </Button>
      </div>
    </div>
  );
}
