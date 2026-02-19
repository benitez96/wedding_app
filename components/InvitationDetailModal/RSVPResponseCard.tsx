"use client";

import { Card, CardBody } from "@heroui/card";
import { UtensilsCrossed, AlertCircle, MessageSquare } from "lucide-react";
import type { InvitationWithTokens } from "@/types/invitation";

interface RSVPResponseCardProps {
  invitation: InvitationWithTokens;
}

// Returns null if none of the extended RSVP fields have a value.
// A null value means the field was either not configured in the section
// settings or the guest hasn't responded yet — either way, nothing to show.
export default function RSVPResponseCard({
  invitation,
}: RSVPResponseCardProps) {
  const { menuPreference, dietaryRestrictions, messageForCouple } = invitation;

  if (!menuPreference && !dietaryRestrictions && !messageForCouple) {
    return null;
  }

  return (
    <Card className="shrink-0">
      <CardBody className="gap-4 p-6">
        <h3 className="text-lg font-semibold">Respuestas del RSVP</h3>

        <div className="space-y-3">
          {menuPreference && (
            <div className="flex items-center gap-2">
              <UtensilsCrossed
                size={16}
                className="text-default-500 shrink-0"
              />
              <span className="font-medium">Menú:</span>
              <span>{menuPreference}</span>
            </div>
          )}

          {dietaryRestrictions && (
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-warning mt-0.5 shrink-0" />
              <span className="font-medium shrink-0">Restricciones:</span>
              <span>{dietaryRestrictions}</span>
            </div>
          )}

          {messageForCouple && (
            <div className="flex items-start gap-2">
              <MessageSquare
                size={16}
                className="text-default-500 mt-0.5 shrink-0"
              />
              <span className="font-medium shrink-0">Mensaje:</span>
              <span className="italic">&ldquo;{messageForCouple}&rdquo;</span>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
