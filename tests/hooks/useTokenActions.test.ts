import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useTokenActions } from "@/hooks/useTokenActions";

// Hoisted mocks (run before imports)
const mockRefresh = vi.hoisted(() => vi.fn());
const mockCreateToken = vi.hoisted(() => vi.fn());
const mockRevokeToken = vi.hoisted(() => vi.fn());
const mockReactivateToken = vi.hoisted(() => vi.fn());
const mockDeleteToken = vi.hoisted(() => vi.fn());

// Mock modules with hoisted functions
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

vi.mock("@/app/actions/protected-admin-invitations", () => ({
  createInvitationToken: mockCreateToken,
  revokeInvitationToken: mockRevokeToken,
  reactivateInvitationToken: mockReactivateToken,
  deleteInvitationToken: mockDeleteToken,
}));

describe("useTokenActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default success responses
    mockCreateToken.mockResolvedValue({
      success: true,
      data: {} as any,
    });
    mockRevokeToken.mockResolvedValue({
      success: true,
      data: {} as any,
    });
    mockReactivateToken.mockResolvedValue({
      success: true,
      data: {} as any,
    });
    mockDeleteToken.mockResolvedValue({
      success: true,
    } as any);
  });

  describe("Initialization", () => {
    it("initializes with no loading state", () => {
      const { result } = renderHook(() => useTokenActions());

      expect(result.current.loadingTokenId).toBeNull();
      expect(result.current.loadingAction).toBeNull();
      expect(result.current.isCreating).toBe(false);
    });
  });

  describe("createToken", () => {
    it("creates token successfully", async () => {
      const { result } = renderHook(() => useTokenActions());

      await act(async () => {
        await result.current.createToken("invitation-123");
      });

      expect(mockCreateToken).toHaveBeenCalledWith("invitation-123");
      expect(mockRefresh).toHaveBeenCalled();
    });

    it("calls onSuccess callback", async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() => useTokenActions({ onSuccess }));

      await act(async () => {
        await result.current.createToken("invitation-123");
      });

      expect(onSuccess).toHaveBeenCalledWith("create");
    });

    it("calls onError callback on failure", async () => {
      const onError = vi.fn();
      mockCreateToken.mockResolvedValue({
        success: false,
        error: "Failed to create",
      });

      const { result } = renderHook(() => useTokenActions({ onError }));

      await act(async () => {
        try {
          await result.current.createToken("invitation-123");
        } catch {
          // Expected
        }
      });

      expect(onError).toHaveBeenCalledWith("create", "Failed to create");
    });

    it("throws error when action fails", async () => {
      mockCreateToken.mockResolvedValue({
        success: false,
        error: "Creation failed",
      });

      const { result } = renderHook(() => useTokenActions());

      await expect(async () => {
        await act(async () => {
          await result.current.createToken("invitation-123");
        });
      }).rejects.toThrow("Creation failed");
    });

    it("does not refresh router on failure", async () => {
      mockCreateToken.mockResolvedValue({
        success: false,
        error: "Failed",
      });

      const { result } = renderHook(() => useTokenActions());

      await act(async () => {
        try {
          await result.current.createToken("invitation-123");
        } catch {
          // Expected
        }
      });

      expect(mockRefresh).not.toHaveBeenCalled();
    });

    it("handles exception during create", async () => {
      const onError = vi.fn();
      mockCreateToken.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useTokenActions({ onError }));

      await act(async () => {
        try {
          await result.current.createToken("invitation-123");
        } catch {
          // Expected
        }
      });

      expect(onError).toHaveBeenCalledWith("create", "Network error");
    });
  });

  describe("revokeToken", () => {
    it("revokes token successfully", async () => {
      const { result } = renderHook(() => useTokenActions());

      await act(async () => {
        await result.current.revokeToken("token-123");
      });

      expect(mockRevokeToken).toHaveBeenCalledWith("token-123");
      expect(mockRefresh).toHaveBeenCalled();
    });

    it("calls onSuccess callback", async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() => useTokenActions({ onSuccess }));

      await act(async () => {
        await result.current.revokeToken("token-123");
      });

      expect(onSuccess).toHaveBeenCalledWith("revoke");
    });

    it("handles error", async () => {
      const onError = vi.fn();
      mockRevokeToken.mockResolvedValue({
        success: false,
        error: "Revoke failed",
      });

      const { result } = renderHook(() => useTokenActions({ onError }));

      await act(async () => {
        try {
          await result.current.revokeToken("token-123");
        } catch {
          // Expected
        }
      });

      expect(onError).toHaveBeenCalledWith("revoke", "Revoke failed");
    });
  });

  describe("reactivateToken", () => {
    it("reactivates token successfully", async () => {
      const { result } = renderHook(() => useTokenActions());

      await act(async () => {
        await result.current.reactivateToken("token-123");
      });

      expect(mockReactivateToken).toHaveBeenCalledWith("token-123");
      expect(mockRefresh).toHaveBeenCalled();
    });

    it("calls onSuccess callback", async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() => useTokenActions({ onSuccess }));

      await act(async () => {
        await result.current.reactivateToken("token-123");
      });

      expect(onSuccess).toHaveBeenCalledWith("reactivate");
    });

    it("handles error", async () => {
      const onError = vi.fn();
      mockReactivateToken.mockResolvedValue({
        success: false,
        error: "Reactivate failed",
      });

      const { result } = renderHook(() => useTokenActions({ onError }));

      await act(async () => {
        try {
          await result.current.reactivateToken("token-123");
        } catch {
          // Expected
        }
      });

      expect(onError).toHaveBeenCalledWith("reactivate", "Reactivate failed");
    });
  });

  describe("deleteToken", () => {
    it("deletes token successfully", async () => {
      const { result } = renderHook(() => useTokenActions());

      await act(async () => {
        await result.current.deleteToken("token-123");
      });

      expect(mockDeleteToken).toHaveBeenCalledWith("token-123");
      expect(mockRefresh).toHaveBeenCalled();
    });

    it("calls onSuccess callback", async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() => useTokenActions({ onSuccess }));

      await act(async () => {
        await result.current.deleteToken("token-123");
      });

      expect(onSuccess).toHaveBeenCalledWith("delete");
    });

    it("handles error", async () => {
      const onError = vi.fn();
      mockDeleteToken.mockResolvedValue({
        success: false,
        error: "Delete failed",
      });

      const { result } = renderHook(() => useTokenActions({ onError }));

      await act(async () => {
        try {
          await result.current.deleteToken("token-123");
        } catch {
          // Expected
        }
      });

      expect(onError).toHaveBeenCalledWith("delete", "Delete failed");
    });
  });

  describe("Multiple operations", () => {
    it("handles sequential operations correctly", async () => {
      const { result } = renderHook(() => useTokenActions());

      await act(async () => {
        await result.current.createToken("invitation-123");
      });

      await act(async () => {
        await result.current.revokeToken("token-123");
      });

      expect(mockCreateToken).toHaveBeenCalledTimes(1);
      expect(mockRevokeToken).toHaveBeenCalledTimes(1);
      expect(mockRefresh).toHaveBeenCalledTimes(2);
    });
  });

  describe("Default error messages", () => {
    it("uses default error message when none provided for create", async () => {
      const onError = vi.fn();
      mockCreateToken.mockResolvedValue({ success: false });

      const { result } = renderHook(() => useTokenActions({ onError }));

      await act(async () => {
        try {
          await result.current.createToken("invitation-123");
        } catch {
          // Expected
        }
      });

      expect(onError).toHaveBeenCalledWith("create", "Failed to create token");
    });

    it("uses default error message when none provided for revoke", async () => {
      const onError = vi.fn();
      mockRevokeToken.mockResolvedValue({ success: false });

      const { result } = renderHook(() => useTokenActions({ onError }));

      await act(async () => {
        try {
          await result.current.revokeToken("token-123");
        } catch {
          // Expected
        }
      });

      expect(onError).toHaveBeenCalledWith("revoke", "Failed to revoke token");
    });
  });
});
