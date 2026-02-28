"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Chip,
  useDisclosure,
} from "@heroui/react";
import { Copy, Plus, Check } from "lucide-react";
import InviteCollaboratorModal from "./InviteCollaboratorModal";
import { getEventInviteLinks } from "@/app/actions/collaborators";
import { PERMISSION_PRESETS } from "@/lib/permissions";

interface InviteLink {
  id: string;
  token: string;
  permissions: string;
  expiresAt: string | null;
  maxUses: number | null;
  usedCount: number;
  createdAt: string;
}

// TODO i18n: relative time strings ("en X min", "en Xh", etc.)
function formatTimeUntil(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 60) {
    return `en ${diffMinutes} min`;
  } else if (diffHours < 24) {
    return `en ${diffHours}h`;
  } else if (diffDays < 30) {
    return `en ${diffDays}d`;
  } else {
    const diffMonths = Math.floor(diffDays / 30);
    return `en ${diffMonths} meses`;
  }
}

export default function InviteLinksSection() {
  const [links, setLinks] = useState<InviteLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const inviteModal = useDisclosure();

  const loadLinks = async () => {
    setIsLoading(true);
    const result = await getEventInviteLinks();
    if (result.success && result.data) {
      setLinks(result.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadLinks();
  }, []);

  const handleCopyLink = async (token: string, linkId: string) => {
    const url = `${window.location.origin}/join/${token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(linkId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // TODO i18n: role labels
  const getRoleLabel = (permissions: string): string => {
    const perms = BigInt(permissions);
    if (perms === PERMISSION_PRESETS.ADMIN) return "Admin";
    if (perms === PERMISSION_PRESETS.EDITOR) return "Editor";
    if (perms === PERMISSION_PRESETS.VIEWER) return "Viewer";
    if (perms === PERMISSION_PRESETS.CLIENT) return "Client";
    return "Custom";
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-default-600">
            {/* TODO i18n: description */}
            Genera links para invitar colaboradores a tu evento
          </p>
          <Button
            color="primary"
            size="sm"
            startContent={<Plus className="w-4 h-4" />}
            onPress={inviteModal.onOpen}
          >
            {/* TODO i18n: "Generar Link" */}
            Generar Link
          </Button>
        </div>

        {links.length === 0 ? (
          <div className="text-center py-8 text-default-500">
            {/* TODO i18n: empty state */}
            No hay links de invitación activos
          </div>
        ) : (
          // TODO i18n: aria-label
          <Table aria-label="Links de invitación" removeWrapper>
            <TableHeader>
              {/* TODO i18n: column headers */}
              <TableColumn>URL</TableColumn>
              <TableColumn>ROL</TableColumn>
              <TableColumn>EXPIRA</TableColumn>
              <TableColumn>USOS</TableColumn>
              <TableColumn>ACCIÓN</TableColumn>
            </TableHeader>
            <TableBody>
              {links.map((link) => {
                const truncatedUrl = `...${link.token.slice(-8)}`;
                const isExpired =
                  link.expiresAt && new Date(link.expiresAt) < new Date();
                const isMaxedOut =
                  link.maxUses !== null && link.usedCount >= link.maxUses;

                return (
                  <TableRow key={link.id}>
                    <TableCell>
                      <code className="text-xs text-default-600">
                        {truncatedUrl}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Chip size="sm" variant="flat">
                        {getRoleLabel(link.permissions)}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-default-600">
                        {link.expiresAt
                          ? isExpired
                            ? /* TODO i18n: "Expirado" */ "Expirado"
                            : formatTimeUntil(new Date(link.expiresAt))
                          : /* TODO i18n: "Nunca" */ "Nunca"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-default-600">
                        {link.usedCount}/{link.maxUses ?? "∞"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="flat"
                        isIconOnly
                        onPress={() => handleCopyLink(link.token, link.id)}
                        isDisabled={Boolean(isExpired) || Boolean(isMaxedOut)}
                      >
                        {copiedId === link.id ? (
                          <Check className="w-4 h-4 text-success" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <InviteCollaboratorModal
        isOpen={inviteModal.isOpen}
        onClose={inviteModal.onClose}
        onSuccess={loadLinks}
      />
    </>
  );
}
