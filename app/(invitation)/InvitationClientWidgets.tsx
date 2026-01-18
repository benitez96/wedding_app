"use client";

import FloatingRSVPButton from "@/components/FloatingRSVPButton";
import HeroMusicButton from "@/components/HeroMusicButton";
import RSVPReminderHandler from "@/components/RSVPReminderHandler";

export default function InvitationClientWidgets() {
  return (
    <>
      <HeroMusicButton />
      <RSVPReminderHandler />
      <FloatingRSVPButton />
    </>
  );
}
