"use client";

import { useState, useEffect } from "react";
import { Select, SelectItem } from "@heroui/select";
import { Spinner } from "@heroui/spinner";
import { switchActiveEvent } from "@/app/actions/events";
import { useRouter } from "next/navigation";

interface EventOption {
  id: string;
  name: string;
  isOwner: boolean;
}

interface EventSelectorProps {
  events: EventOption[];
  activeEventId: string;
}

export default function EventSelector({
  events,
  activeEventId,
}: EventSelectorProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = async (eventId: string) => {
    if (eventId === activeEventId || !eventId) return;

    setIsLoading(true);
    try {
      const result = await switchActiveEvent(eventId);
      if (result.success) {
        router.refresh();
      }
    } catch (error) {
      console.error("Error switching event:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (events.length <= 1) {
    return (
      <div className="px-4 py-2 text-sm text-default-500">
        {events[0]?.name ?? "Sin eventos"}
      </div>
    );
  }

  return (
    <div className="px-2">
      <Select
        label="Evento activo"
        selectedKeys={[activeEventId]}
        onChange={(e) => handleChange(e.target.value)}
        size="sm"
        variant="bordered"
        isDisabled={isLoading}
        classNames={{
          trigger: "min-h-10",
        }}
      >
        {events.map((event) => (
          <SelectItem key={event.id} textValue={event.name}>
            <div className="flex items-center gap-2">
              <span>{event.name}</span>
              {!event.isOwner && (
                <span className="text-xs text-default-400">(colaborador)</span>
              )}
            </div>
          </SelectItem>
        ))}
      </Select>
    </div>
  );
}
