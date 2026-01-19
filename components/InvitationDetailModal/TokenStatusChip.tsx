"use client";

import { Chip } from "@heroui/react";
import type { InvitationToken } from "@/types/invitation";

interface TokenStatusChipProps {
  token: InvitationToken;
}

export default function TokenStatusChip({ token }: TokenStatusChipProps) {
  if (!token.isActive) {
    return (
      <Chip color="danger" variant="flat" size="sm">
        Revocado
      </Chip>
    );
  }
  if (token.isUsed) {
    return (
      <Chip color="success" variant="flat" size="sm">
        Usado
      </Chip>
    );
  }
  return (
    <Chip color="default" variant="flat" size="sm">
      Disponible
    </Chip>
  );
}
