"use client";

import RSVPSection from "./RSVPSection";
import { RSVPSectionSettings } from "./RSVPSection.metadata";

interface RSVPSectionPreviewProps {
  settings?: RSVPSectionSettings;
}

/**
 * Wrapper de RSVPSection para preview en backoffice
 * Usa datos mock del usuario
 */
export default function RSVPSectionPreview({
  settings,
}: RSVPSectionPreviewProps) {
  // Mock user data para preview
  const mockUser = {
    id: "preview-user-123",
    guestName: "Juan Pérez",
    maxGuests: 2,
    hasResponded: false,
    isAttending: null,
    guestCount: null,
  };

  return <RSVPSection settings={settings} user={mockUser} />;
}
