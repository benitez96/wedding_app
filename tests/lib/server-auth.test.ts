/**
 * Tests for lib/server-auth.ts
 *
 * CRITICAL: Testing auth wrappers with mocked dependencies
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { User } from "@/lib/auth";
import type { EventContext } from "@/lib/event-context";
import type { UserTierContext } from "@/lib/tier-enforcement";
import { PERMISSIONS } from "@/lib/permissions";

// Mock external dependencies BEFORE importing the module under test
vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("@/lib/event-context-prisma", () => ({
  getUserEventContext: vi.fn(),
}));

vi.mock("@/lib/tier-enforcement-prisma", () => ({
  getUserTierContext: vi.fn(),
}));

// Import mocked functions
import { auth } from "@/lib/auth";
import { getUserEventContext } from "@/lib/event-context-prisma";
import { getUserTierContext } from "@/lib/tier-enforcement-prisma";

// Import the functions we're testing AFTER mocks are set up
import { withAuth, withEventAuth } from "@/lib/server-auth";

describe("server-auth", () => {
  const mockUser: User = {
    id: "user-123",
    email: "test@example.com",
    name: "Test User",
    emailVerified: false,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockEvent: EventContext = {
    eventId: "event-123",
    eventName: "My Event",
    isOwner: true,
    permissions: BigInt(0),
  };

  const mockTierContext: UserTierContext = {
    userId: "user-123",
    tier: "FREE",
    limits: {
      maxGuestsPerEvent: 5,
      maxEvents: 1,
      canHaveCollaborators: false,
      canCustomizeSections: false,
      hasAdvancedAnalytics: false,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("withAuth", () => {
    it("should call action with user if authenticated", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: mockUser,
        session: {} as any,
      });

      const mockAction = vi.fn().mockResolvedValue({ data: "success" });
      const wrappedAction = withAuth(mockAction);

      const result = await wrappedAction("arg1", "arg2");

      expect(auth.api.getSession).toHaveBeenCalledTimes(1);
      expect(mockAction).toHaveBeenCalledWith(mockUser, "arg1", "arg2");
      expect(result).toEqual({ data: "success" });
    });

    it("should throw error if not authenticated", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      const mockAction = vi.fn();
      const wrappedAction = withAuth(mockAction);

      await expect(wrappedAction()).rejects.toThrow("No autorizado");
      expect(mockAction).not.toHaveBeenCalled();
    });

    it("should throw error if user is undefined", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: undefined as any,
        session: {} as any,
      });

      const mockAction = vi.fn();
      const wrappedAction = withAuth(mockAction);

      await expect(wrappedAction()).rejects.toThrow("No autorizado");
      expect(mockAction).not.toHaveBeenCalled();
    });

    it("should pass multiple arguments to action", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: mockUser,
        session: {} as any,
      });

      const mockAction = vi.fn().mockResolvedValue("ok");
      const wrappedAction = withAuth(mockAction);

      await wrappedAction(1, "two", { three: 3 }, [4]);

      expect(mockAction).toHaveBeenCalledWith(
        mockUser,
        1,
        "two",
        { three: 3 },
        [4],
      );
    });

    it("should propagate errors from action", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: mockUser,
        session: {} as any,
      });

      const mockAction = vi.fn().mockRejectedValue(new Error("Action failed"));
      const wrappedAction = withAuth(mockAction);

      await expect(wrappedAction()).rejects.toThrow("Action failed");
    });
  });

  describe("withEventAuth", () => {
    it("should call action with full context if authenticated", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: mockUser,
        session: {} as any,
      });
      vi.mocked(getUserEventContext).mockResolvedValue(mockEvent);
      vi.mocked(getUserTierContext).mockResolvedValue(mockTierContext);

      const mockAction = vi.fn().mockResolvedValue({ data: "success" });
      const wrappedAction = withEventAuth(mockAction);

      const result = await wrappedAction("arg1");

      expect(auth.api.getSession).toHaveBeenCalledTimes(1);
      expect(getUserEventContext).toHaveBeenCalledWith("user-123");
      expect(getUserTierContext).toHaveBeenCalledWith("user-123");
      expect(mockAction).toHaveBeenCalledWith(
        {
          user: mockUser,
          event: mockEvent,
          tierContext: mockTierContext,
        },
        "arg1",
      );
      expect(result).toEqual({ data: "success" });
    });

    it("should throw error if not authenticated", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      const mockAction = vi.fn();
      const wrappedAction = withEventAuth(mockAction);

      await expect(wrappedAction()).rejects.toThrow("No autorizado");
      expect(mockAction).not.toHaveBeenCalled();
      expect(getUserEventContext).not.toHaveBeenCalled();
    });

    it("should throw error if no event context", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: mockUser,
        session: {} as any,
      });
      vi.mocked(getUserEventContext).mockResolvedValue(null);
      vi.mocked(getUserTierContext).mockResolvedValue(mockTierContext);

      const mockAction = vi.fn();
      const wrappedAction = withEventAuth(mockAction);

      await expect(wrappedAction()).rejects.toThrow(
        "No se encontró un evento activo",
      );
      expect(mockAction).not.toHaveBeenCalled();
    });

    it("should allow owner without checking permissions", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: mockUser,
        session: {} as any,
      });
      vi.mocked(getUserEventContext).mockResolvedValue({
        ...mockEvent,
        isOwner: true,
      });
      vi.mocked(getUserTierContext).mockResolvedValue(mockTierContext);

      const mockAction = vi.fn().mockResolvedValue("ok");
      const wrappedAction = withEventAuth(
        mockAction,
        PERMISSIONS.GUESTS_CREATE,
      );

      const result = await wrappedAction();

      expect(result).toBe("ok");
      expect(mockAction).toHaveBeenCalled();
    });

    it("should check permissions for non-owner", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: mockUser,
        session: {} as any,
      });
      vi.mocked(getUserEventContext).mockResolvedValue({
        ...mockEvent,
        isOwner: false,
        permissions: PERMISSIONS.GUESTS_CREATE,
      });
      vi.mocked(getUserTierContext).mockResolvedValue(mockTierContext);

      const mockAction = vi.fn().mockResolvedValue("ok");
      const wrappedAction = withEventAuth(
        mockAction,
        PERMISSIONS.GUESTS_CREATE,
      );

      const result = await wrappedAction();

      expect(result).toBe("ok");
    });

    it("should deny non-owner without required permission", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: mockUser,
        session: {} as any,
      });
      vi.mocked(getUserEventContext).mockResolvedValue({
        ...mockEvent,
        isOwner: false,
        permissions: PERMISSIONS.GUESTS_VIEW, // Different permission
      });
      vi.mocked(getUserTierContext).mockResolvedValue(mockTierContext);

      const mockAction = vi.fn();
      const wrappedAction = withEventAuth(
        mockAction,
        PERMISSIONS.GUESTS_CREATE,
      );

      await expect(wrappedAction()).rejects.toThrow(
        "No tienes permisos para realizar esta acción",
      );
      expect(mockAction).not.toHaveBeenCalled();
    });

    it("should fetch event and tier contexts in parallel", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: mockUser,
        session: {} as any,
      });
      vi.mocked(getUserEventContext).mockResolvedValue(mockEvent);
      vi.mocked(getUserTierContext).mockResolvedValue(mockTierContext);

      const mockAction = vi.fn().mockResolvedValue("ok");
      const wrappedAction = withEventAuth(mockAction);

      await wrappedAction();

      // Both should be called with the same userId
      expect(getUserEventContext).toHaveBeenCalledWith("user-123");
      expect(getUserTierContext).toHaveBeenCalledWith("user-123");
    });
  });
});
