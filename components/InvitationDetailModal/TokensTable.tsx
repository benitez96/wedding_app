"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Tooltip } from "@heroui/tooltip";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Plus, Copy, Check } from "lucide-react";
import type { InvitationToken } from "@/types/invitation";
import {
  createInvitationToken,
  revokeInvitationToken,
  reactivateInvitationToken,
  deleteInvitationToken,
} from "@/app/actions/protected-admin-invitations";
import { formatDateTime } from "@/utils/date";
import TokenStatusChip from "./TokenStatusChip";
import TokenActionsCell from "./TokenActionsCell";

interface TokensTableProps {
  invitationId: string;
  tokens: InvitationToken[];
}

function getDeviceInfo(userAgent: string | null) {
  if (!userAgent || userAgent === "Unknown") return "Desconocido";

  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Safari")) return "Safari";
  if (userAgent.includes("Edge")) return "Edge";

  if (
    userAgent.includes("Mobile") ||
    userAgent.includes("Android") ||
    userAgent.includes("iPhone")
  ) {
    return "Móvil";
  }

  return "Desktop";
}

export default function TokensTable({
  invitationId,
  tokens,
}: TokensTableProps) {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [isCreatingToken, setIsCreatingToken] = useState(false);
  const [loadingTokenId, setLoadingTokenId] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<
    "revoke" | "reactivate" | "delete" | null
  >(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

  const clearErrorAfterDelay = () => {
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
    errorTimeoutRef.current = setTimeout(() => {
      setActionError(null);
      errorTimeoutRef.current = null;
    }, 5000);
  };

  const copyToClipboard = async (tokenId: string) => {
    try {
      const invitationUrl = `${window.location.origin}/r/${tokenId}`;
      await navigator.clipboard.writeText(invitationUrl);
      setCopiedToken(tokenId);
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => {
        setCopiedToken(null);
        copyTimeoutRef.current = null;
      }, 2000);
    } catch {
      setActionError("No se pudo copiar al portapapeles");
      clearErrorAfterDelay();
    }
  };

  const handleCreateToken = async () => {
    setIsCreatingToken(true);
    setActionError(null);
    try {
      const result = await createInvitationToken(invitationId);
      if (result.success) {
        router.refresh();
      } else {
        setActionError(result.error || "Error al crear token");
        clearErrorAfterDelay();
      }
    } catch {
      setActionError("Error al crear token");
      clearErrorAfterDelay();
    } finally {
      setIsCreatingToken(false);
    }
  };

  const handleRevokeToken = async (tokenId: string) => {
    setLoadingTokenId(tokenId);
    setLoadingAction("revoke");
    setActionError(null);
    try {
      const result = await revokeInvitationToken(tokenId);
      if (result.success) {
        router.refresh();
      } else {
        setActionError(result.error || "Error al revocar token");
        clearErrorAfterDelay();
      }
    } catch {
      setActionError("Error al revocar token");
      clearErrorAfterDelay();
    } finally {
      setLoadingTokenId(null);
      setLoadingAction(null);
    }
  };

  const handleReactivateToken = async (tokenId: string) => {
    setLoadingTokenId(tokenId);
    setLoadingAction("reactivate");
    setActionError(null);
    try {
      const result = await reactivateInvitationToken(tokenId);
      if (result.success) {
        router.refresh();
      } else {
        setActionError(result.error || "Error al reactivar token");
        clearErrorAfterDelay();
      }
    } catch {
      setActionError("Error al reactivar token");
      clearErrorAfterDelay();
    } finally {
      setLoadingTokenId(null);
      setLoadingAction(null);
    }
  };

  const handleDeleteToken = async (tokenId: string) => {
    setLoadingTokenId(tokenId);
    setLoadingAction("delete");
    setActionError(null);
    try {
      const result = await deleteInvitationToken(tokenId);
      if (result.success) {
        router.refresh();
      } else {
        setActionError(result.error || "Error al eliminar token");
        clearErrorAfterDelay();
      }
    } catch {
      setActionError("Error al eliminar token");
      clearErrorAfterDelay();
    } finally {
      setLoadingTokenId(null);
      setLoadingAction(null);
    }
  };

  const openInvitationLink = (tokenId: string) => {
    const url = `${window.location.origin}/r/${tokenId}`;
    window.open(url, "_blank");
  };

  return (
    <Card>
      <CardBody className="gap-4">
        {actionError && (
          <div className="p-3 bg-danger-50 border border-danger-200 text-danger-700 rounded-lg text-sm">
            {actionError}
          </div>
        )}

        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Tokens de Invitación</h3>
          <Button
            color="primary"
            size="sm"
            startContent={<Plus className="w-4 h-4" />}
            onPress={handleCreateToken}
            isLoading={isCreatingToken}
            isDisabled={isCreatingToken}
          >
            Crear Token
          </Button>
        </div>

        {tokens.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No hay tokens creados para esta invitación.</p>
            <p className="text-sm mt-1">
              Crea un token para generar el link de invitación.
            </p>
          </div>
        ) : (
          <Table aria-label="Tabla de tokens de invitación">
            <TableHeader>
              <TableColumn>TOKEN</TableColumn>
              <TableColumn>ESTADO</TableColumn>
              <TableColumn>CREADO</TableColumn>
              <TableColumn>DISPOSITIVO</TableColumn>
              <TableColumn>ACCESOS</TableColumn>
              <TableColumn>ACCIONES</TableColumn>
            </TableHeader>
            <TableBody>
              {tokens.map((token) => (
                <TableRow key={token.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                        {token.token.substring(0, 12)}...
                      </code>
                      <Tooltip content="Copiar link">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => copyToClipboard(token.token)}
                        >
                          {copiedToken === token.token ? (
                            <Check className="w-4 h-4 text-success" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </Tooltip>
                    </div>
                  </TableCell>
                  <TableCell>
                    <TokenStatusChip token={token} />
                  </TableCell>
                  <TableCell>{formatDateTime(token.createdAt)}</TableCell>
                  <TableCell>
                    <Chip size="sm" variant="flat">
                      {getDeviceInfo(token.userAgent)}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{token.accessCount || 0}</span>
                  </TableCell>
                  <TableCell>
                    <TokenActionsCell
                      token={token}
                      onOpen={() => openInvitationLink(token.token)}
                      onRevoke={() => handleRevokeToken(token.id)}
                      onReactivate={() => handleReactivateToken(token.id)}
                      onDelete={() => handleDeleteToken(token.id)}
                      isLoading={
                        loadingTokenId === token.id && loadingAction !== null
                      }
                      loadingAction={loadingAction}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardBody>
    </Card>
  );
}
