import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSessionPresence } from "@/lib/middleware/session";
import type { NextRequest } from "next/server";

// Mock better-auth/cookies
vi.mock("better-auth/cookies", () => ({
  getSessionCookie: vi.fn(),
}));

import { getSessionCookie } from "better-auth/cookies";

// ---------------------------------------------------------------------------
// Test Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a mock NextRequest with cookies
 */
function createMockRequest(cookies: Record<string, string>): NextRequest {
  return {
    cookies: {
      get: (name: string) => {
        const value = cookies[name];
        return value ? { name, value } : undefined;
      },
    },
  } as unknown as NextRequest;
}

// ---------------------------------------------------------------------------
// getSessionPresence() tests
// ---------------------------------------------------------------------------

describe("getSessionPresence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("both sessions present", () => {
    it("returns all flags as true when both cookies exist", () => {
      const mockRequest = createMockRequest({
        invitation_session: "guest-jwt-token",
      });

      vi.mocked(getSessionCookie).mockReturnValue("backoffice-session-token");

      const result = getSessionPresence(mockRequest);

      expect(result.hasBackofficeSession).toBe(true);
      expect(result.hasInvitationSession).toBe(true);
      expect(result.hasAnySession).toBe(true);
    });

    it("prioritizes backoffice session in hasAnySession", () => {
      const mockRequest = createMockRequest({
        invitation_session: "guest-jwt-token",
      });

      vi.mocked(getSessionCookie).mockReturnValue("backoffice-session-token");

      const result = getSessionPresence(mockRequest);

      expect(result.hasAnySession).toBe(true);
    });
  });

  describe("only backoffice session present", () => {
    it("returns true for backoffice, false for invitation", () => {
      const mockRequest = createMockRequest({}); // No invitation_session

      vi.mocked(getSessionCookie).mockReturnValue("backoffice-session-token");

      const result = getSessionPresence(mockRequest);

      expect(result.hasBackofficeSession).toBe(true);
      expect(result.hasInvitationSession).toBe(false);
      expect(result.hasAnySession).toBe(true);
    });

    it("handles backoffice session with empty invitation cookie", () => {
      const mockRequest = createMockRequest({
        invitation_session: "", // Empty string
      });

      vi.mocked(getSessionCookie).mockReturnValue("backoffice-session-token");

      const result = getSessionPresence(mockRequest);

      expect(result.hasBackofficeSession).toBe(true);
      expect(result.hasInvitationSession).toBe(false); // Empty string is falsy
      expect(result.hasAnySession).toBe(true);
    });
  });

  describe("only invitation session present", () => {
    it("returns true for invitation, false for backoffice", () => {
      const mockRequest = createMockRequest({
        invitation_session: "guest-jwt-token",
      });

      vi.mocked(getSessionCookie).mockReturnValue(null);

      const result = getSessionPresence(mockRequest);

      expect(result.hasBackofficeSession).toBe(false);
      expect(result.hasInvitationSession).toBe(true);
      expect(result.hasAnySession).toBe(true);
    });

    it("handles invitation session with null backoffice cookie", () => {
      const mockRequest = createMockRequest({
        invitation_session: "guest-jwt-token",
      });

      vi.mocked(getSessionCookie).mockReturnValue(null as any);

      const result = getSessionPresence(mockRequest);

      expect(result.hasBackofficeSession).toBe(false);
      expect(result.hasInvitationSession).toBe(true);
      expect(result.hasAnySession).toBe(true);
    });
  });

  describe("no sessions present", () => {
    it("returns all flags as false when no cookies exist", () => {
      const mockRequest = createMockRequest({});

      vi.mocked(getSessionCookie).mockReturnValue(null);

      const result = getSessionPresence(mockRequest);

      expect(result.hasBackofficeSession).toBe(false);
      expect(result.hasInvitationSession).toBe(false);
      expect(result.hasAnySession).toBe(false);
    });

    it("returns false when backoffice cookie is null", () => {
      const mockRequest = createMockRequest({});

      vi.mocked(getSessionCookie).mockReturnValue(null as any);

      const result = getSessionPresence(mockRequest);

      expect(result.hasBackofficeSession).toBe(false);
      expect(result.hasInvitationSession).toBe(false);
      expect(result.hasAnySession).toBe(false);
    });

    it("returns false when invitation cookie is empty string", () => {
      const mockRequest = createMockRequest({
        invitation_session: "",
      });

      vi.mocked(getSessionCookie).mockReturnValue(null);

      const result = getSessionPresence(mockRequest);

      expect(result.hasBackofficeSession).toBe(false);
      expect(result.hasInvitationSession).toBe(false);
      expect(result.hasAnySession).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("handles very long session tokens", () => {
      const longToken = "x".repeat(1000);
      const mockRequest = createMockRequest({
        invitation_session: longToken,
      });

      vi.mocked(getSessionCookie).mockReturnValue(longToken);

      const result = getSessionPresence(mockRequest);

      expect(result.hasBackofficeSession).toBe(true);
      expect(result.hasInvitationSession).toBe(true);
      expect(result.hasAnySession).toBe(true);
    });

    it("handles special characters in session tokens", () => {
      const specialToken = "token.with-special_chars@123";
      const mockRequest = createMockRequest({
        invitation_session: specialToken,
      });

      vi.mocked(getSessionCookie).mockReturnValue(specialToken);

      const result = getSessionPresence(mockRequest);

      expect(result.hasBackofficeSession).toBe(true);
      expect(result.hasInvitationSession).toBe(true);
      expect(result.hasAnySession).toBe(true);
    });

    it("correctly converts truthy values to booleans", () => {
      const mockRequest = createMockRequest({
        invitation_session: "any-value",
      });

      vi.mocked(getSessionCookie).mockReturnValue("any-value");

      const result = getSessionPresence(mockRequest);

      // Ensure we're returning actual booleans, not truthy values
      expect(typeof result.hasBackofficeSession).toBe("boolean");
      expect(typeof result.hasInvitationSession).toBe("boolean");
      expect(typeof result.hasAnySession).toBe("boolean");
    });

    it("correctly converts falsy values to booleans", () => {
      const mockRequest = createMockRequest({});

      vi.mocked(getSessionCookie).mockReturnValue(null);

      const result = getSessionPresence(mockRequest);

      // Ensure we're returning actual booleans, not falsy values
      expect(typeof result.hasBackofficeSession).toBe("boolean");
      expect(typeof result.hasInvitationSession).toBe("boolean");
      expect(typeof result.hasAnySession).toBe("boolean");
      expect(result.hasBackofficeSession).toBe(false);
      expect(result.hasInvitationSession).toBe(false);
      expect(result.hasAnySession).toBe(false);
    });
  });

  describe("realistic middleware scenarios", () => {
    it("guest accessing public invitation page", () => {
      const mockRequest = createMockRequest({
        invitation_session: "guest-jwt-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
      });

      vi.mocked(getSessionCookie).mockReturnValue(null);

      const result = getSessionPresence(mockRequest);

      expect(result.hasBackofficeSession).toBe(false);
      expect(result.hasInvitationSession).toBe(true);
      expect(result.hasAnySession).toBe(true);
    });

    it("admin accessing backoffice dashboard", () => {
      const mockRequest = createMockRequest({});

      vi.mocked(getSessionCookie).mockReturnValue("better-auth-session-abc123");

      const result = getSessionPresence(mockRequest);

      expect(result.hasBackofficeSession).toBe(true);
      expect(result.hasInvitationSession).toBe(false);
      expect(result.hasAnySession).toBe(true);
    });

    it("admin accessing their own invitation page (dual session)", () => {
      const mockRequest = createMockRequest({
        invitation_session: "guest-jwt-token",
      });

      vi.mocked(getSessionCookie).mockReturnValue("better-auth-session-abc123");

      const result = getSessionPresence(mockRequest);

      expect(result.hasBackofficeSession).toBe(true);
      expect(result.hasInvitationSession).toBe(true);
      expect(result.hasAnySession).toBe(true);
    });

    it("unauthenticated user accessing public route", () => {
      const mockRequest = createMockRequest({});

      vi.mocked(getSessionCookie).mockReturnValue(null);

      const result = getSessionPresence(mockRequest);

      expect(result.hasBackofficeSession).toBe(false);
      expect(result.hasInvitationSession).toBe(false);
      expect(result.hasAnySession).toBe(false);
    });
  });

  describe("integration with getSessionCookie", () => {
    it("calls getSessionCookie with the request", () => {
      const mockRequest = createMockRequest({});

      vi.mocked(getSessionCookie).mockReturnValue(null);

      getSessionPresence(mockRequest);

      expect(getSessionCookie).toHaveBeenCalledWith(mockRequest);
      expect(getSessionCookie).toHaveBeenCalledTimes(1);
    });

    it("uses return value from getSessionCookie for backoffice check", () => {
      const mockRequest = createMockRequest({});
      const sessionToken = "better-auth-session-token";

      vi.mocked(getSessionCookie).mockReturnValue(sessionToken);

      const result = getSessionPresence(mockRequest);

      expect(result.hasBackofficeSession).toBe(true);
    });
  });
});
