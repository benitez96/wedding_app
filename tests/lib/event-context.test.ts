/**
 * Tests for lib/event-context.ts
 *
 * CRITICAL: Only testing PURE logic (no DB)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  combineAccessibleEvents,
  selectActiveEvent,
  toEventContext,
  EventContextService,
  type EventContextStorage,
  type AccessibleEvent,
} from "@/lib/event-context";
import { PERMISSION_PRESETS } from "@/lib/permissions";

describe("event-context - Pure Functions", () => {
  describe("combineAccessibleEvents", () => {
    it("should map owned events with OWNER permissions", () => {
      const ownedEvents = [
        {
          id: "event-1",
          name: "Wedding 1",
          slug: "wedding-1",
          description: "My wedding",
        },
      ];

      const result = combineAccessibleEvents(ownedEvents, []);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "event-1",
        name: "Wedding 1",
        slug: "wedding-1",
        description: "My wedding",
        isOwner: true,
        permissions: PERMISSION_PRESETS.OWNER,
      });
    });

    it("should map collaborated events with their permissions", () => {
      const memberships = [
        {
          permissions: PERMISSION_PRESETS.EDITOR,
          event: {
            id: "event-2",
            name: "Wedding 2",
            slug: "wedding-2",
            description: "Collaboration",
          },
        },
      ];

      const result = combineAccessibleEvents([], memberships);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "event-2",
        name: "Wedding 2",
        slug: "wedding-2",
        description: "Collaboration",
        isOwner: false,
        permissions: PERMISSION_PRESETS.EDITOR,
      });
    });

    it("should combine owned and collaborated events", () => {
      const ownedEvents = [
        {
          id: "event-1",
          name: "Wedding 1",
          slug: "wedding-1",
          description: null,
        },
      ];

      const memberships = [
        {
          permissions: PERMISSION_PRESETS.VIEWER,
          event: {
            id: "event-2",
            name: "Wedding 2",
            slug: "wedding-2",
            description: null,
          },
        },
      ];

      const result = combineAccessibleEvents(ownedEvents, memberships);

      expect(result).toHaveLength(2);
      expect(result[0].isOwner).toBe(true);
      expect(result[1].isOwner).toBe(false);
    });

    it("should handle empty arrays", () => {
      const result = combineAccessibleEvents([], []);

      expect(result).toEqual([]);
    });

    it("should preserve order: owned first, then collaborated", () => {
      const ownedEvents = [
        { id: "owned-1", name: "A", slug: "a", description: null },
        { id: "owned-2", name: "B", slug: "b", description: null },
      ];

      const memberships = [
        {
          permissions: BigInt(1),
          event: { id: "collab-1", name: "C", slug: "c", description: null },
        },
      ];

      const result = combineAccessibleEvents(ownedEvents, memberships);

      expect(result[0].id).toBe("owned-1");
      expect(result[1].id).toBe("owned-2");
      expect(result[2].id).toBe("collab-1");
    });
  });

  describe("selectActiveEvent", () => {
    const mockEvents: AccessibleEvent[] = [
      {
        id: "event-1",
        name: "Wedding 1",
        slug: "wedding-1",
        description: null,
        isOwner: true,
        permissions: PERMISSION_PRESETS.OWNER,
      },
      {
        id: "event-2",
        name: "Wedding 2",
        slug: "wedding-2",
        description: null,
        isOwner: false,
        permissions: PERMISSION_PRESETS.VIEWER,
      },
    ];

    it("should return null if events array is empty", () => {
      const result = selectActiveEvent([], "FREE");

      expect(result).toBe(null);
    });

    it("should return first owned event for FREE tier", () => {
      const result = selectActiveEvent(mockEvents, "FREE");

      expect(result?.id).toBe("event-1");
      expect(result?.isOwner).toBe(true);
    });

    it("should return first owned event for BASIC tier", () => {
      const result = selectActiveEvent(mockEvents, "BASIC");

      expect(result?.id).toBe("event-1");
      expect(result?.isOwner).toBe(true);
    });

    it("should fallback to first event if no owned event (FREE)", () => {
      const collaboratedOnly: AccessibleEvent[] = [
        {
          id: "event-collab",
          name: "Wedding Collab",
          slug: "wedding-collab",
          description: null,
          isOwner: false,
          permissions: PERMISSION_PRESETS.VIEWER,
        },
      ];

      const result = selectActiveEvent(collaboratedOnly, "FREE");

      expect(result?.id).toBe("event-collab");
    });

    it("should respect activeEventId for COMPANY tier", () => {
      const result = selectActiveEvent(mockEvents, "COMPANY", "event-2");

      expect(result?.id).toBe("event-2");
    });

    it("should fallback to first event if activeEventId not found (COMPANY)", () => {
      const result = selectActiveEvent(
        mockEvents,
        "COMPANY",
        "non-existent-id",
      );

      expect(result?.id).toBe("event-1");
    });

    it("should fallback to first event if no activeEventId provided (COMPANY)", () => {
      const result = selectActiveEvent(mockEvents, "COMPANY");

      expect(result?.id).toBe("event-1");
    });

    it("should handle undefined activeEventId for COMPANY", () => {
      const result = selectActiveEvent(mockEvents, "COMPANY", undefined);

      expect(result?.id).toBe("event-1");
    });
  });

  describe("toEventContext", () => {
    it("should convert AccessibleEvent to EventContext", () => {
      const event: AccessibleEvent = {
        id: "event-123",
        name: "Wedding Event",
        slug: "wedding-event",
        description: "Description",
        isOwner: true,
        permissions: PERMISSION_PRESETS.OWNER,
      };

      const result = toEventContext(event);

      expect(result).toEqual({
        eventId: "event-123",
        eventName: "Wedding Event",
        isOwner: true,
        permissions: PERMISSION_PRESETS.OWNER,
      });
    });

    it("should handle collaborated events", () => {
      const event: AccessibleEvent = {
        id: "event-456",
        name: "Another Wedding",
        slug: "another-wedding",
        description: null,
        isOwner: false,
        permissions: PERMISSION_PRESETS.EDITOR,
      };

      const result = toEventContext(event);

      expect(result).toEqual({
        eventId: "event-456",
        eventName: "Another Wedding",
        isOwner: false,
        permissions: PERMISSION_PRESETS.EDITOR,
      });
    });
  });
});

describe("EventContextService", () => {
  let mockStorage: EventContextStorage;
  let service: EventContextService;

  beforeEach(() => {
    mockStorage = {
      findOwnedEvents: vi.fn(),
      findMemberships: vi.fn(),
      findEventByOwner: vi.fn(),
      findMembershipByEvent: vi.fn(),
    };
    service = new EventContextService(mockStorage);
  });

  describe("getUserAccessibleEvents", () => {
    it("should combine owned and collaborated events", async () => {
      const mockOwnedEvents = [
        {
          id: "owned-1",
          name: "My Wedding",
          slug: "my-wedding",
          description: null,
        },
      ];

      const mockMemberships = [
        {
          permissions: PERMISSION_PRESETS.VIEWER,
          event: {
            id: "collab-1",
            name: "Friend Wedding",
            slug: "friend-wedding",
            description: null,
          },
        },
      ];

      vi.mocked(mockStorage.findOwnedEvents).mockResolvedValue(mockOwnedEvents);
      vi.mocked(mockStorage.findMemberships).mockResolvedValue(mockMemberships);

      const result = await service.getUserAccessibleEvents("user-123");

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("owned-1");
      expect(result[0].isOwner).toBe(true);
      expect(result[1].id).toBe("collab-1");
      expect(result[1].isOwner).toBe(false);
    });

    it("should return empty array if no events", async () => {
      vi.mocked(mockStorage.findOwnedEvents).mockResolvedValue([]);
      vi.mocked(mockStorage.findMemberships).mockResolvedValue([]);

      const result = await service.getUserAccessibleEvents("user-123");

      expect(result).toEqual([]);
    });

    it("should call storage methods in parallel", async () => {
      vi.mocked(mockStorage.findOwnedEvents).mockResolvedValue([]);
      vi.mocked(mockStorage.findMemberships).mockResolvedValue([]);

      await service.getUserAccessibleEvents("user-123");

      expect(mockStorage.findOwnedEvents).toHaveBeenCalledWith("user-123");
      expect(mockStorage.findMemberships).toHaveBeenCalledWith("user-123");
    });
  });

  describe("verifyEventAccess", () => {
    it("should return context if user is owner", async () => {
      vi.mocked(mockStorage.findEventByOwner).mockResolvedValue({
        id: "event-123",
        name: "My Event",
      });

      const result = await service.verifyEventAccess("user-123", "event-123");

      expect(result).toEqual({
        eventId: "event-123",
        eventName: "My Event",
        isOwner: true,
        permissions: PERMISSION_PRESETS.OWNER,
      });
      expect(mockStorage.findEventByOwner).toHaveBeenCalledWith(
        "event-123",
        "user-123",
      );
    });

    it("should return context if user is collaborator", async () => {
      vi.mocked(mockStorage.findEventByOwner).mockResolvedValue(null);
      vi.mocked(mockStorage.findMembershipByEvent).mockResolvedValue({
        permissions: PERMISSION_PRESETS.EDITOR,
        revokedAt: null,
        event: {
          id: "event-456",
          name: "Collaborated Event",
        },
      });

      const result = await service.verifyEventAccess("user-123", "event-456");

      expect(result).toEqual({
        eventId: "event-456",
        eventName: "Collaborated Event",
        isOwner: false,
        permissions: PERMISSION_PRESETS.EDITOR,
      });
    });

    it("should return null if membership is revoked", async () => {
      vi.mocked(mockStorage.findEventByOwner).mockResolvedValue(null);
      vi.mocked(mockStorage.findMembershipByEvent).mockResolvedValue({
        permissions: PERMISSION_PRESETS.VIEWER,
        revokedAt: new Date(),
        event: {
          id: "event-789",
          name: "Revoked Event",
        },
      });

      const result = await service.verifyEventAccess("user-123", "event-789");

      expect(result).toBe(null);
    });

    it("should return null if no access", async () => {
      vi.mocked(mockStorage.findEventByOwner).mockResolvedValue(null);
      vi.mocked(mockStorage.findMembershipByEvent).mockResolvedValue(null);

      const result = await service.verifyEventAccess("user-123", "event-999");

      expect(result).toBe(null);
    });

    it("should check owner first, then membership", async () => {
      vi.mocked(mockStorage.findEventByOwner).mockResolvedValue({
        id: "event-123",
        name: "Owner Event",
      });

      await service.verifyEventAccess("user-123", "event-123");

      expect(mockStorage.findEventByOwner).toHaveBeenCalled();
      expect(mockStorage.findMembershipByEvent).not.toHaveBeenCalled();
    });
  });
});
