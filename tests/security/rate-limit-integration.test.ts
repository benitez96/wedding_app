/**
 * Rate Limit Integration Tests
 *
 * Tests OUR rate limiting implementation (lib/middleware/rate-limit.ts),
 * not testing theoretical bypass scenarios.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { isRateLimited, getClientIP } from "@/lib/middleware/rate-limit";

describe("Rate Limit - IP Extraction", () => {
  it("should extract first IP from X-Forwarded-For chain", () => {
    const req = new Request("https://example.com", {
      headers: {
        "x-forwarded-for": "1.2.3.4, 5.6.7.8, 9.10.11.12",
      },
    });

    const ip = getClientIP(req);

    expect(ip).toBe("1.2.3.4");
  });

  it("should trim whitespace from extracted IP", () => {
    const req = new Request("https://example.com", {
      headers: {
        "x-forwarded-for": "  10.0.0.1  , 10.0.0.2",
      },
    });

    const ip = getClientIP(req);

    expect(ip).toBe("10.0.0.1");
  });

  it("should fallback to X-Real-IP when X-Forwarded-For missing", () => {
    const req = new Request("https://example.com", {
      headers: {
        "x-real-ip": "192.168.1.1",
      },
    });

    const ip = getClientIP(req);

    expect(ip).toBe("192.168.1.1");
  });

  it("should fallback to CF-Connecting-IP as last resort", () => {
    const req = new Request("https://example.com", {
      headers: {
        "cf-connecting-ip": "172.16.0.1",
      },
    });

    const ip = getClientIP(req);

    expect(ip).toBe("172.16.0.1");
  });

  it("should return 'unknown' when no IP headers present", () => {
    const req = new Request("https://example.com");

    const ip = getClientIP(req);

    expect(ip).toBe("unknown");
  });
});

describe("Rate Limit - Basic Functionality", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should allow first request from new IP", () => {
    const ip = `test-ip-${Math.random()}`;

    const blocked = isRateLimited(ip);

    expect(blocked).toBe(false);
  });

  it("should allow requests below limit (100/min)", () => {
    const ip = `test-ip-${Math.random()}`;

    // Make 99 requests
    for (let i = 0; i < 99; i++) {
      expect(isRateLimited(ip)).toBe(false);
    }
  });

  it("should block 101st request within window", () => {
    const ip = `test-ip-${Math.random()}`;

    // Exhaust limit
    for (let i = 0; i < 100; i++) {
      isRateLimited(ip);
    }

    // 101st should be blocked
    expect(isRateLimited(ip)).toBe(true);
  });

  it("should reset counter after window expires", () => {
    const ip = `test-ip-${Math.random()}`;

    // Exhaust limit
    for (let i = 0; i < 100; i++) {
      isRateLimited(ip);
    }
    expect(isRateLimited(ip)).toBe(true);

    // Advance past 1 minute window
    vi.advanceTimersByTime(61 * 1000);

    // Should be allowed again
    expect(isRateLimited(ip)).toBe(false);
  });

  it("should track different IPs independently", () => {
    const ip1 = `test-ip-1-${Math.random()}`;
    const ip2 = `test-ip-2-${Math.random()}`;

    // Exhaust ip1
    for (let i = 0; i < 100; i++) {
      isRateLimited(ip1);
    }

    // ip1 blocked, ip2 still free
    expect(isRateLimited(ip1)).toBe(true);
    expect(isRateLimited(ip2)).toBe(false);
  });
});

describe("Rate Limit - Edge Cases", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should handle empty string IP", () => {
    const blocked = isRateLimited("");

    // Should not crash
    expect(typeof blocked).toBe("boolean");
  });

  it("should handle very long IP strings", () => {
    const longIP = "x".repeat(1000);

    const blocked = isRateLimited(longIP);

    // Should not crash
    expect(typeof blocked).toBe("boolean");
  });

  it("should cleanup stale entries after 5 minutes", () => {
    const ip = `test-ip-${Math.random()}`;

    // Make request
    isRateLimited(ip);

    // Advance 6 minutes
    vi.advanceTimersByTime(6 * 60 * 1000);

    // Make another request (triggers cleanup)
    isRateLimited(`other-ip-${Math.random()}`);

    // Original IP should have fresh counter
    const blocked = isRateLimited(ip);
    expect(blocked).toBe(false);
  });
});
