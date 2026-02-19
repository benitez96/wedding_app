"use client";

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
import { formatDateTime } from "@/utils/date";
import { getDeviceInfo, getDeviceLabel } from "@/lib/device-detection";
import { useClipboard } from "@/hooks/useClipboard";
import { useErrorTimeout } from "@/hooks/useErrorTimeout";
import { useTokenActions } from "@/hooks/useTokenActions";
import TokenStatusChip from "./TokenStatusChip";
import TokenActionsCell from "./TokenActionsCell";

interface TokensTableProps {
  invitationId: string;
  tokens: InvitationToken[];
}

// TODO i18n: All user-facing strings need translation support
const STRINGS = {
  title: "Invitation Tokens",
  createToken: "Create Token",
  noTokens: "No tokens created for this invitation.",
  noTokensHint: "Create a token to generate the invitation link.",
  copyLink: "Copy link",
  // Table headers
  token: "TOKEN",
  status: "STATUS",
  created: "CREATED",
  device: "DEVICE",
  accesses: "ACCESSES",
  actions: "ACTIONS",
  // Error messages
  copyFailed: "Failed to copy to clipboard",
};

/**
 * Tokens table component
 *
 * Displays invitation tokens with actions (create, revoke, reactivate, delete).
 * Uses extracted hooks for better testability and separation of concerns.
 */
export default function TokensTable({
  invitationId,
  tokens,
}: TokensTableProps) {
  // Clipboard management
  const { copy, isCopied } = useClipboard({
    onError: () => setError(STRINGS.copyFailed),
  });

  // Error display with auto-clear
  const { error, setError } = useErrorTimeout();

  // Token actions (create, revoke, reactivate, delete)
  const {
    createToken,
    revokeToken,
    reactivateToken,
    deleteToken,
    isCreating,
    loadingTokenId,
    loadingAction,
  } = useTokenActions({
    onError: (action, errorMsg) => setError(errorMsg),
  });

  const copyToClipboard = async (tokenId: string) => {
    const invitationUrl = `${window.location.origin}/r/${tokenId}`;
    await copy(invitationUrl);
  };

  const openInvitationLink = (tokenId: string) => {
    const url = `${window.location.origin}/r/${tokenId}`;
    window.open(url, "_blank");
  };

  return (
    <Card>
      <CardBody className="gap-4">
        {/* Error banner */}
        {error && (
          <div className="p-3 bg-danger-50 border border-danger-200 text-danger-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Header with create button */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{STRINGS.title}</h3>
          <Button
            color="primary"
            size="sm"
            startContent={<Plus className="w-4 h-4" />}
            onPress={() => createToken(invitationId)}
            isLoading={isCreating}
            isDisabled={isCreating}
          >
            {STRINGS.createToken}
          </Button>
        </div>

        {/* Empty state */}
        {tokens.length === 0 ? (
          <div className="text-center py-8 text-default-400">
            <p>{STRINGS.noTokens}</p>
            <p className="text-sm mt-1">{STRINGS.noTokensHint}</p>
          </div>
        ) : (
          /* Tokens table */
          <Table aria-label="Invitation tokens table">
            <TableHeader>
              <TableColumn>{STRINGS.token}</TableColumn>
              <TableColumn>{STRINGS.status}</TableColumn>
              <TableColumn>{STRINGS.created}</TableColumn>
              <TableColumn>{STRINGS.device}</TableColumn>
              <TableColumn>{STRINGS.accesses}</TableColumn>
              <TableColumn>{STRINGS.actions}</TableColumn>
            </TableHeader>
            <TableBody>
              {tokens.map((token) => {
                const deviceType = getDeviceInfo(token.userAgent);
                const deviceLabel = getDeviceLabel(deviceType);

                return (
                  <TableRow key={token.id}>
                    {/* Token ID with copy button */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="bg-default-100 text-default-700 px-2 py-1 rounded text-xs font-mono">
                          {token.id}
                        </code>
                        <Tooltip content={STRINGS.copyLink}>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => copyToClipboard(token.id)}
                          >
                            {isCopied(token.id) ? (
                              <Check className="w-4 h-4 text-success" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </Tooltip>
                      </div>
                    </TableCell>

                    {/* Status chip */}
                    <TableCell>
                      <TokenStatusChip token={token} />
                    </TableCell>

                    {/* Created date */}
                    <TableCell>{formatDateTime(token.createdAt)}</TableCell>

                    {/* Device info */}
                    <TableCell>
                      <Chip size="sm" variant="flat">
                        {deviceLabel}
                      </Chip>
                    </TableCell>

                    {/* Access count */}
                    <TableCell>
                      <span className="text-sm">{token.accessCount || 0}</span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <TokenActionsCell
                        token={token}
                        onOpen={() => openInvitationLink(token.id)}
                        onRevoke={() => revokeToken(token.id)}
                        onReactivate={() => reactivateToken(token.id)}
                        onDelete={() => deleteToken(token.id)}
                        isLoading={
                          loadingTokenId === token.id && loadingAction !== null
                        }
                        loadingAction={
                          loadingAction === "create" ? null : loadingAction
                        }
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardBody>
    </Card>
  );
}
