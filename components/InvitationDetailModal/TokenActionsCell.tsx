"use client";

import { Button, Tooltip } from "@heroui/react";
import { ExternalLink, Ban, RotateCcw, Trash2 } from "lucide-react";
import type { InvitationToken } from "@/types/invitation";

interface TokenActionsCellProps {
  token: InvitationToken;
  onRevoke: (tokenId: string) => void;
  onReactivate: (tokenId: string) => void;
  onDelete: (tokenId: string) => void;
  onOpen: (tokenId: string) => void;
}

export default function TokenActionsCell({
  token,
  onRevoke,
  onReactivate,
  onDelete,
  onOpen,
}: TokenActionsCellProps) {
  return (
    <div className="flex items-center gap-1">
      <Tooltip content="Abrir invitación">
        <Button
          size="sm"
          variant="light"
          color="primary"
          isIconOnly
          onPress={() => onOpen(token.id)}
          isDisabled={!token.isActive}
        >
          <ExternalLink size={14} />
        </Button>
      </Tooltip>

      {token.isActive ? (
        <Tooltip content="Revocar token">
          <Button
            size="sm"
            variant="light"
            color="warning"
            isIconOnly
            onPress={() => onRevoke(token.id)}
          >
            <Ban size={14} />
          </Button>
        </Tooltip>
      ) : (
        <Tooltip content="Reactivar token">
          <Button
            size="sm"
            variant="light"
            color="success"
            isIconOnly
            onPress={() => onReactivate(token.id)}
          >
            <RotateCcw size={14} />
          </Button>
        </Tooltip>
      )}

      <Tooltip content="Eliminar token">
        <Button
          size="sm"
          variant="light"
          color="danger"
          isIconOnly
          onPress={() => onDelete(token.id)}
        >
          <Trash2 size={14} />
        </Button>
      </Tooltip>
    </div>
  );
}
