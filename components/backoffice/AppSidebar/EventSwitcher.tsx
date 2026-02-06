"use client";

import { useState } from "react";
import { Heart, Plus } from "lucide-react";
import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";
import { useRouter } from "next/navigation";
import { useSidebar } from "./SidebarContext";
import EventAvatar from "./EventAvatar";
import { useDisclosure } from "@heroui/use-disclosure";
import CreateEventModal from "@/components/backoffice/CreateEventModal";
import { switchActiveEvent } from "@/app/actions/events";

export default function EventSwitcher() {
  const { events, activeEventId, tier } = useSidebar();
  const router = useRouter();
  const createEventModal = useDisclosure();
  const [switchingEventId, setSwitchingEventId] = useState<string | null>(null);

  const isCompany = tier === "COMPANY";

  const handleEventClick = async (eventId: string) => {
    if (eventId === activeEventId || switchingEventId) return;

    setSwitchingEventId(eventId);
    try {
      const result = await switchActiveEvent(eventId);
      if (result.success) {
        router.refresh();
      } else {
        console.error("Error switching event:", result.error);
      }
    } catch (error) {
      console.error("Error switching event:", error);
    } finally {
      setSwitchingEventId(null);
    }
  };

  return (
    <>
      <aside className="fixed left-0 top-0 h-screen w-[72px] bg-content1 flex flex-col items-center py-4 gap-2 border-r border-divider z-40">
        {/* Logo/Brand */}
        <div className="flex items-center justify-center mb-2">
          <Heart className="text-red-500 w-8 h-8" />
        </div>

        <Divider className="bg-slate-700 w-12" />

        {/* Event Avatars */}
        <div className="flex flex-col items-center gap-2 flex-1 overflow-y-auto py-2 w-full">
          {events.map((event) => (
            <EventAvatar
              key={event.id}
              eventId={event.id}
              eventName={event.name}
              isActive={event.id === activeEventId}
              onClick={() => handleEventClick(event.id)}
            />
          ))}
        </div>

        {/* Add Event Button (solo para COMPANY tier) */}
        {isCompany && (
          <>
            <Divider className="w-12" />
            <Button
              isIconOnly
              variant="flat"
              color="primary"
              className="rounded-full w-10 h-10"
              onPress={createEventModal.onOpen}
              aria-label="Crear nuevo evento"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </>
        )}
      </aside>

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={createEventModal.isOpen}
        onClose={createEventModal.onClose}
      />
    </>
  );
}
