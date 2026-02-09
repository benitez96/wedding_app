import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createInvitationToken,
  revokeInvitationToken,
  reactivateInvitationToken,
  deleteInvitationToken,
} from "@/app/actions/protected-admin-invitations";

export type TokenAction = "create" | "revoke" | "reactivate" | "delete";

interface UseTokenActionsOptions {
  /**
   * Callback when action succeeds
   */
  onSuccess?: (action: TokenAction) => void;
  /**
   * Callback when action fails
   */
  onError?: (action: TokenAction, error: string) => void;
}

interface UseTokenActionsReturn {
  /**
   * ID of token currently being acted upon (null if no action in progress)
   */
  loadingTokenId: string | null;
  /**
   * Current action being performed (null if no action in progress)
   */
  loadingAction: TokenAction | null;
  /**
   * Whether create action is in progress
   */
  isCreating: boolean;
  /**
   * Create new invitation token
   */
  createToken: (invitationId: string) => Promise<void>;
  /**
   * Revoke (deactivate) token
   */
  revokeToken: (tokenId: string) => Promise<void>;
  /**
   * Reactivate previously revoked token
   */
  reactivateToken: (tokenId: string) => Promise<void>;
  /**
   * Permanently delete token
   */
  deleteToken: (tokenId: string) => Promise<void>;
}

/**
 * Hook for managing invitation token actions (create, revoke, reactivate, delete)
 *
 * Handles loading states and router refresh after successful actions.
 *
 * @example
 * ```tsx
 * function TokenManager({ invitationId }: { invitationId: string }) {
 *   const { createToken, revokeToken, isCreating, loadingTokenId } = useTokenActions({
 *     onError: (action, error) => console.error(`${action} failed:`, error),
 *   });
 *
 *   return (
 *     <div>
 *       <button onClick={() => createToken(invitationId)} disabled={isCreating}>
 *         Create Token
 *       </button>
 *       <button onClick={() => revokeToken(tokenId)} disabled={loadingTokenId === tokenId}>
 *         Revoke
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useTokenActions(
  options: UseTokenActionsOptions = {},
): UseTokenActionsReturn {
  const { onSuccess, onError } = options;

  const [loadingTokenId, setLoadingTokenId] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<TokenAction | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const createToken = async (invitationId: string) => {
    setIsCreating(true);
    setLoadingAction("create");

    try {
      const result = await createInvitationToken(invitationId);

      if (result.success) {
        router.refresh();
        onSuccess?.("create");
      } else {
        const error = result.error || "Failed to create token";
        onError?.("create", error);
        throw new Error(error);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create token";
      onError?.("create", message);
      throw error;
    } finally {
      setIsCreating(false);
      setLoadingAction(null);
    }
  };

  const revokeToken = async (tokenId: string) => {
    setLoadingTokenId(tokenId);
    setLoadingAction("revoke");

    try {
      const result = await revokeInvitationToken(tokenId);

      if (result.success) {
        router.refresh();
        onSuccess?.("revoke");
      } else {
        const error = result.error || "Failed to revoke token";
        onError?.("revoke", error);
        throw new Error(error);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to revoke token";
      onError?.("revoke", message);
      throw error;
    } finally {
      setLoadingTokenId(null);
      setLoadingAction(null);
    }
  };

  const reactivateToken = async (tokenId: string) => {
    setLoadingTokenId(tokenId);
    setLoadingAction("reactivate");

    try {
      const result = await reactivateInvitationToken(tokenId);

      if (result.success) {
        router.refresh();
        onSuccess?.("reactivate");
      } else {
        const error = result.error || "Failed to reactivate token";
        onError?.("reactivate", error);
        throw new Error(error);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to reactivate token";
      onError?.("reactivate", message);
      throw error;
    } finally {
      setLoadingTokenId(null);
      setLoadingAction(null);
    }
  };

  const deleteToken = async (tokenId: string) => {
    setLoadingTokenId(tokenId);
    setLoadingAction("delete");

    try {
      const result = await deleteInvitationToken(tokenId);

      if (result.success) {
        router.refresh();
        onSuccess?.("delete");
      } else {
        const error = result.error || "Failed to delete token";
        onError?.("delete", error);
        throw new Error(error);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete token";
      onError?.("delete", message);
      throw error;
    } finally {
      setLoadingTokenId(null);
      setLoadingAction(null);
    }
  };

  return {
    loadingTokenId,
    loadingAction,
    isCreating,
    createToken,
    revokeToken,
    reactivateToken,
    deleteToken,
  };
}
