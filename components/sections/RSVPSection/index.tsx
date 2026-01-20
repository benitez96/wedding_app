// Server Component Wrapper - Fetchea data y la pasa al client component
import { getCurrentUserData } from "@/app/actions/protected-invitations";
import RSVPSectionClient from "./RSVPSection";
import { RSVPSectionSettings } from "./RSVPSection.metadata";

interface RSVPSectionProps {
  settings?: RSVPSectionSettings;
}

export default async function RSVPSection({ settings }: RSVPSectionProps) {
  const result = await getCurrentUserData();

  const user =
    result.success && result.user
      ? {
          id: result.user.invitationId,
          guestName: result.user.guestName,
          maxGuests: result.user.maxGuests,
          hasResponded: result.user.hasResponded,
          isAttending: result.user.isAttending,
          guestCount: result.user.guestCount,
        }
      : null;

  return <RSVPSectionClient settings={settings} user={user} />;
}
