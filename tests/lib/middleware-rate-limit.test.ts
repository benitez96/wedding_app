import { describe, it, expect, vi, beforeEach } from "vitest";
import { isRateLimited, getClientIP } from "@/lib/middleware/rate-limit";

describe("isRateLimited", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("returns false for the first request from an IP", () => {
    const ip = `test-ip-${Math.random()}`;
    expect(isRateLimited(ip)).toBe(false);
  });

  it("returns false for requests below the limit", () => {
    const ip = `test-ip-${Math.random()}`;
    // First 99 requests should be fine (limit is 100)
    for (let i = 0; i < 99; i++) {
      expect(isRateLimited(ip)).toBe(false);
    }
  });

  it("returns true when limit is exceeded", () => {
    const ip = `test-ip-${Math.random()}`;
    // Exhaust the 100-request limit
    for (let i = 0; i < 100; i++) {
      isRateLimited(ip);
    }
    // 101st request should be blocked
    expect(isRateLimited(ip)).toBe(true);
  });

  it("resets counter after window expires", () => {
    const ip = `test-ip-${Math.random()}`;
    // Exhaust the limit
    for (let i = 0; i < 100; i++) {
      isRateLimited(ip);
    }
    expect(isRateLimited(ip)).toBe(true);

    // Advance past the 1-minute window
    vi.advanceTimersByTime(61 * 1000);

    // Should be allowed again
    expect(isRateLimited(ip)).toBe(false);
  });

  it("tracks different IPs independently", () => {
    const ip1 = `test-ip-${Math.random()}`;
    const ip2 = `test-ip-${Math.random()}`;

    // Exhaust limit for ip1
    for (let i = 0; i < 100; i++) {
      isRateLimited(ip1);
    }

    // ip1 is blocked, ip2 should still be fine
    expect(isRateLimited(ip1)).toBe(true);
    expect(isRateLimited(ip2)).toBe(false);
  });
});

describe("getClientIP", () => {
  function makeRequest(headers: Record<string, string>): Request {
    return new Request("https://example.com", { headers });
  }

  it("extracts IP from x-forwarded-for", () => {
    const req = makeRequest({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
    expect(getClientIP(req)).toBe("1.2.3.4");
  });

  it("trims whitespace from x-forwarded-for", () => {
    const req = makeRequest({ "x-forwarded-for": "  1.2.3.4  , 5.6.7.8" });
    expect(getClientIP(req)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const req = makeRequest({ "x-real-ip": "9.10.11.12" });
    expect(getClientIP(req)).toBe("9.10.11.12");
  });

  it("falls back to cf-connecting-ip as last resort", () => {
    const req = makeRequest({ "cf-connecting-ip": "13.14.15.16" });
    expect(getClientIP(req)).toBe("13.14.15.16");
  });

  it("returns 'unknown' when no IP headers present", () => {
    const req = makeRequest({});
    expect(getClientIP(req)).toBe("unknown");
  });

  it("prefers x-forwarded-for over x-real-ip", () => {
    const req = makeRequest({
      "x-forwarded-for": "1.1.1.1",
      "x-real-ip": "2.2.2.2",
    });
    expect(getClientIP(req)).toBe("1.1.1.1");
  });
});
