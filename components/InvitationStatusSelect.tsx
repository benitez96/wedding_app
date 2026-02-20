"use client";

import { useState, useEffect } from "react";
import { Select, SelectItem } from "@heroui/select";
import { Input as NumberInput } from "@heroui/input";
import {
  getGuestCountForStatusChange,
  parseGuestCountInput,
  validateGuestCountForMaxGuests,
} from "@/lib/invitation-status-utils";

interface InvitationStatusSelectProps {
  status: string;
  guestCount: number;
  maxGuests: number;
  onStatusChange: (status: string) => void;
  onGuestCountChange: (count: number) => void;
  disabled?: boolean;
}

export default function InvitationStatusSelect({
  status,
  guestCount,
  maxGuests,
  onStatusChange,
  onGuestCountChange,
  disabled = false,
}: InvitationStatusSelectProps) {
  const [localStatus, setLocalStatus] = useState(status);
  const [localGuestCount, setLocalGuestCount] = useState(guestCount);

  useEffect(() => {
    setLocalStatus(status);
    setLocalGuestCount(guestCount);
  }, [status, guestCount]);

  // Validar guestCount cuando cambie maxGuests
  useEffect(() => {
    const { needsAdjustment, adjustedCount } = validateGuestCountForMaxGuests(
      localStatus,
      localGuestCount,
      maxGuests,
    );

    if (needsAdjustment) {
      setLocalGuestCount(adjustedCount);
      onGuestCountChange(adjustedCount);
    }
  }, [maxGuests, localStatus, localGuestCount, onGuestCountChange]);

  const handleStatusChange = (newStatus: string) => {
    setLocalStatus(newStatus);
    onStatusChange(newStatus);

    const newCount = getGuestCountForStatusChange(
      newStatus,
      localGuestCount,
      maxGuests,
    );
    setLocalGuestCount(newCount);
    onGuestCountChange(newCount);
  };

  const handleGuestCountChange = (value: string) => {
    const newCount = parseGuestCountInput(value);
    setLocalGuestCount(newCount);
    onGuestCountChange(newCount);
  };

  return (
    <div className="flex flex-col gap-4">
      <Select
        label="Estado de la Invitación"
        selectedKeys={new Set([localStatus])}
        onSelectionChange={(keys) => {
          const selectedKey = Array.from(keys)[0] as string;
          handleStatusChange(selectedKey);
        }}
        variant="bordered"
        isRequired
        disabled={disabled}
        description="Estado actual de la respuesta del invitado"
      >
        <SelectItem key="pending">Pendiente</SelectItem>
        <SelectItem key="attending">Asistirá</SelectItem>
        <SelectItem key="not_attending">No asistirá</SelectItem>
      </Select>

      {localStatus === "attending" && (
        <NumberInput
          type="number"
          label="Número de Asistentes"
          value={localGuestCount.toString()}
          onChange={(e) => handleGuestCountChange(e.target.value)}
          min={1}
          max={maxGuests}
          variant="bordered"
          isRequired
          description={`Máximo ${maxGuests} invitados permitidos`}
          isDisabled={disabled}
        />
      )}
    </div>
  );
}
