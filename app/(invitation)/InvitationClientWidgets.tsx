"use client";

import FloatingRSVPButton from "@/components/FloatingRSVPButton";
import HeroMusicButton from "@/components/HeroMusicButton";
import RSVPReminderHandler from "@/components/RSVPReminderHandler";

interface InvitationClientWidgetsProps {
  weddingTimestamp: number;
  remindRestingDays: number;
}

export default function InvitationClientWidgets({
  weddingTimestamp,
  remindRestingDays,
}: InvitationClientWidgetsProps) {
  return (
    <>
      <HeroMusicButton />
      <RSVPReminderHandler
        weddingTimestamp={weddingTimestamp}
        remindRestingDays={remindRestingDays}
      />
      <FloatingRSVPButton />
    </>
  );
}
