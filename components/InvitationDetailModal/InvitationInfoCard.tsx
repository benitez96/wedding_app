"use client";

import { Card, CardBody } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Chip } from "@heroui/chip";
import {
  Users,
  Phone,
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
} from "lucide-react";
import type { InvitationWithTokens } from "@/types/invitation";
import { formatDateTime } from "@/utils/date";

interface InvitationInfoCardProps {
  invitation: InvitationWithTokens;
}

function getStatusChip(invitation: InvitationWithTokens) {
  if (!invitation.hasResponded) {
    return (
      <Chip color="warning" variant="flat" size="sm">
        Pendiente
      </Chip>
    );
  }
  if (invitation.isAttending) {
    return (
      <Chip color="success" variant="flat" size="sm">
        Confirmado
      </Chip>
    );
  }
  return (
    <Chip color="danger" variant="flat" size="sm">
      No asistirá
    </Chip>
  );
}

export default function InvitationInfoCard({
  invitation,
}: InvitationInfoCardProps) {
  return (
    <Card className="shrink-0">
      <CardBody className="gap-4 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Información del Invitado</h3>
          {getStatusChip(invitation)}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-default-500" />
              <span className="font-medium">Nombre:</span>
              <span>{invitation.guestName}</span>
            </div>

            {invitation.guestNickname && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Apodo:</span>
                <span className="italic">
                  &ldquo;{invitation.guestNickname}&rdquo;
                </span>
              </div>
            )}

            {invitation.guestPhone && (
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-default-500" />
                <span className="font-medium">Teléfono:</span>
                <span>{invitation.guestPhone}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-default-500" />
              <span className="font-medium">Máximo de invitados:</span>
              <span>{invitation.maxGuests}</span>
            </div>

            {invitation.hasResponded && (
              <>
                <div className="flex items-center gap-2">
                  {invitation.isAttending ? (
                    <CheckCircle size={16} className="text-success" />
                  ) : (
                    <XCircle size={16} className="text-danger" />
                  )}
                  <span className="font-medium">Confirmados:</span>
                  <span>{invitation.guestCount || 0}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-default-500" />
                  <span className="font-medium">Respondió el:</span>
                  <span>{formatDateTime(invitation.respondedAt)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <Divider />

        <div className="flex items-center gap-2 text-sm text-default-500">
          <Clock size={14} />
          <span>Creada el {formatDateTime(invitation.createdAt)}</span>
        </div>
      </CardBody>
    </Card>
  );
}
