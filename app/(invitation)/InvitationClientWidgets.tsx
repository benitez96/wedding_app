"use client";

import FloatingRSVPButton from "@/components/FloatingRSVPButton";
import HeroMusicButton from "@/components/HeroMusicButton";
import RSVPReminderHandler from "@/components/RSVPReminderHandler";

interface InvitationClientWidgetsProps {
  weddingTimestamp: number;
  remindRestingDays: number;
  showFloatingButton?: boolean;
}

export default function InvitationClientWidgets({
  weddingTimestamp,
  remindRestingDays,
  showFloatingButton = true,
}: InvitationClientWidgetsProps) {
  return (
    <>
      <HeroMusicButton />
      <RSVPReminderHandler
        weddingTimestamp={weddingTimestamp}
        remindRestingDays={remindRestingDays}
      />
      {showFloatingButton && <FloatingRSVPButton />}
    </>
  );
}
