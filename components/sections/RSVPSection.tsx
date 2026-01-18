import { getCurrentUserData } from "@/app/actions/protected-invitations";
import RSVPSectionClient from "./RSVPSectionClient";

export default async function RSVPSection() {
  const result = await getCurrentUserData();

  if (!result.success || !result.user) {
    return null;
  }

  return <RSVPSectionClient user={result.user} />;
}
