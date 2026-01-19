"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardBody,
  Button,
  Chip,
  Tooltip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";
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
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

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
    } catch (error) {
      console.error("Error al copiar al portapapeles:", error);
    }
  };

  const handleCreateToken = async () => {
    setIsCreatingToken(true);
    try {
      const result = await createInvitationToken(invitationId);
      if (result.success) {
        router.refresh();
      } else {
        console.error("Error al crear token:", result.error);
      }
    } catch (error) {
      console.error("Error al crear token:", error);
    } finally {
      setIsCreatingToken(false);
    }
  };

  const handleRevokeToken = async (tokenId: string) => {
    try {
      const result = await revokeInvitationToken(tokenId);
      if (result.success) {
        router.refresh();
      } else {
        console.error("Error al revocar token:", result.error);
      }
    } catch (error) {
      console.error("Error al revocar token:", error);
    }
  };

  const handleReactivateToken = async (tokenId: string) => {
    try {
      const result = await reactivateInvitationToken(tokenId);
      if (result.success) {
        router.refresh();
      } else {
        console.error("Error al reactivar token:", result.error);
      }
    } catch (error) {
      console.error("Error al reactivar token:", error);
    }
  };

  const handleDeleteToken = async (tokenId: string) => {
    try {
      const result = await deleteInvitationToken(tokenId);
      if (result.success) {
        router.refresh();
      } else {
        console.error("Error al eliminar token:", result.error);
      }
    } catch (error) {
      console.error("Error al eliminar token:", error);
    }
  };

  const openInvitationLink = (tokenId: string) => {
    const url = `${window.location.origin}/r/${tokenId}`;
    window.open(url, "_blank");
  };

  return (
    <Card>
      <CardBody>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Tokens de Acceso</h3>
          <div className="flex items-center gap-2">
            <Chip color="primary" variant="flat" size="sm">
              {tokens.length} token{tokens.length !== 1 ? "s" : ""}
            </Chip>
            <Tooltip content="Crear nuevo token de acceso">
              <Button
                size="sm"
                color="primary"
                variant="flat"
                startContent={<Plus size={16} />}
                onPress={handleCreateToken}
                isLoading={isCreatingToken}
                isDisabled={isCreatingToken}
              >
                Generar Token
              </Button>
            </Tooltip>
          </div>
        </div>

        <Table
          aria-label="Tabla de tokens"
          className="min-h-[200px]"
          selectionMode="none"
        >
          <TableHeader>
            <TableColumn>TOKEN</TableColumn>
            <TableColumn>ESTADO</TableColumn>
            <TableColumn>ACCESOS</TableColumn>
            <TableColumn>DISPOSITIVO</TableColumn>
            <TableColumn>FINGERPRINT</TableColumn>
            <TableColumn>PRIMER ACCESO</TableColumn>
            <TableColumn>ÚLTIMO ACCESO</TableColumn>
            <TableColumn>ACCIONES</TableColumn>
          </TableHeader>
          <TableBody emptyContent="No hay tokens generados para esta invitación">
            {tokens.map((token) => (
              <TableRow key={token.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-default-100 px-2 py-1 rounded font-mono">
                      {token.id.substring(0, 8)}...
                    </code>
                    <Tooltip content="Copiar invitación">
                      <Button
                        size="sm"
                        variant="light"
                        isIconOnly
                        onPress={() => copyToClipboard(token.id)}
                      >
                        {copiedToken === token.id ? (
                          <Check size={14} className="text-success" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </Button>
                    </Tooltip>
                  </div>
                </TableCell>
                <TableCell>
                  <Tooltip
                    content={
                      token.isUsed && token.deviceId
                        ? "Token vinculado a un dispositivo específico. No se puede usar desde otros dispositivos."
                        : undefined
                    }
                  >
                    <div>
                      <TokenStatusChip token={token} />
                    </div>
                  </Tooltip>
                </TableCell>
                <TableCell>{token.accessCount}</TableCell>
                <TableCell>
                  {token.userAgent ? (
                    <div className="text-xs">
                      <div className="font-medium text-primary">
                        {getDeviceInfo(token.userAgent)}
                      </div>
                      <div className="text-default-500 max-w-[200px] overflow-x-auto whitespace-nowrap">
                        {token.userAgent}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-default-400 italic">
                      No usado aún
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {token.deviceId ? (
                    <div className="text-xs">
                      <code className="bg-default-100 px-2 py-1 rounded font-mono">
                        {token.deviceId}
                      </code>
                    </div>
                  ) : (
                    <div className="text-xs text-default-400 italic">
                      No generado
                    </div>
                  )}
                </TableCell>
                <TableCell>{formatDateTime(token.firstAccessAt)}</TableCell>
                <TableCell>{formatDateTime(token.lastAccessAt)}</TableCell>
                <TableCell>
                  <TokenActionsCell
                    token={token}
                    onRevoke={handleRevokeToken}
                    onReactivate={handleReactivateToken}
                    onDelete={handleDeleteToken}
                    onOpen={openInvitationLink}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
  );
}
