"use client";

import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { ExternalLink, Ban, RotateCcw, Trash2 } from "lucide-react";
import type { InvitationToken } from "@/types/invitation";

interface TokenActionsCellProps {
  token: InvitationToken;
  onRevoke: (tokenId: string) => void;
  onReactivate: (tokenId: string) => void;
  onDelete: (tokenId: string) => void;
  onOpen: (tokenId: string) => void;
  isLoading?: boolean;
  loadingAction?: "revoke" | "reactivate" | "delete" | null;
}

export default function TokenActionsCell({
  token,
  onRevoke,
  onReactivate,
  onDelete,
  onOpen,
  isLoading = false,
  loadingAction,
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
            isLoading={isLoading && loadingAction === "revoke"}
            isDisabled={isLoading}
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
            isLoading={isLoading && loadingAction === "reactivate"}
            isDisabled={isLoading}
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
          isLoading={isLoading && loadingAction === "delete"}
          isDisabled={isLoading}
        >
          <Trash2 size={14} />
        </Button>
      </Tooltip>
    </div>
  );
}
