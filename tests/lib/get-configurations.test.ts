/**
 * Tests for lib/get-configurations.ts
 *
 * CRITICAL: Only testing PURE logic (no DB)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  cacheKey,
  isCacheValid,
  parseDateFromString,
  parseRemindDays,
  ConfigurationService,
  type ConfigurationStorage,
  type ConfigurationKey,
} from "@/lib/get-configurations";
import { CONFIGURATION_KEYS } from "@/types/configuration";

describe("get-configurations - Pure Functions", () => {
  describe("cacheKey", () => {
    it("should generate cache key with eventId and key", () => {
      const result = cacheKey("event-123", "WEDDING_DATE");

      expect(result).toBe("event-123:WEDDING_DATE");
    });

    it("should handle different event IDs", () => {
      const result1 = cacheKey("event-abc", "PHOTO_UPLOAD_URL");
      const result2 = cacheKey("event-xyz", "PHOTO_UPLOAD_URL");

      expect(result1).toBe("event-abc:PHOTO_UPLOAD_URL");
      expect(result2).toBe("event-xyz:PHOTO_UPLOAD_URL");
    });
  });

  describe("isCacheValid", () => {
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    it("should return true if within TTL", () => {
      const now = Date.now();
      const timestamp = now - 1000; // 1 second ago

      const result = isCacheValid(timestamp, now);

      expect(result).toBe(true);
    });

    it("should return false if expired", () => {
      const now = Date.now();
      const timestamp = now - CACHE_TTL - 1000; // Expired by 1 second

      const result = isCacheValid(timestamp, now);

      expect(result).toBe(false);
    });

    it("should handle exact TTL boundary", () => {
      const now = Date.now();
      const timestamp = now - CACHE_TTL;

      const result = isCacheValid(timestamp, now);

      expect(result).toBe(false);
    });

    it("should handle future timestamps (should be valid)", () => {
      const now = Date.now();
      const timestamp = now + 1000; // 1 second in the future

      const result = isCacheValid(timestamp, now);

      expect(result).toBe(true);
    });
  });

  describe("parseDateFromString", () => {
    it("should parse YYYYMMDD format correctly", () => {
      const result = parseDateFromString("20260214");

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(1); // February (0-indexed)
      expect(result.getDate()).toBe(14);
      expect(result.getHours()).toBe(19);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
    });

    it("should handle different dates", () => {
      const result = parseDateFromString("20251225");

      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(11); // December (0-indexed)
      expect(result.getDate()).toBe(25);
    });

    it("should handle January (month 01)", () => {
      const result = parseDateFromString("20260101");

      expect(result.getMonth()).toBe(0); // January (0-indexed)
      expect(result.getDate()).toBe(1);
    });

    it("should handle December (month 12)", () => {
      const result = parseDateFromString("20261231");

      expect(result.getMonth()).toBe(11); // December (0-indexed)
      expect(result.getDate()).toBe(31);
    });
  });

  describe("parseRemindDays", () => {
    it("should return null for null input", () => {
      const result = parseRemindDays(null);

      expect(result).toBe(null);
    });

    it("should return null for empty string", () => {
      const result = parseRemindDays("");

      expect(result).toBe(null);
    });

    it("should parse valid number string", () => {
      const result = parseRemindDays("40");

      expect(result).toBe(40);
    });

    it("should return null for NaN", () => {
      const result = parseRemindDays("not-a-number");

      expect(result).toBe(null);
    });

    it("should return null for value < 1", () => {
      const result = parseRemindDays("0");

      expect(result).toBe(null);
    });

    it("should return null for negative value", () => {
      const result = parseRemindDays("-10");

      expect(result).toBe(null);
    });

    it("should return null for value > 365", () => {
      const result = parseRemindDays("366");

      expect(result).toBe(null);
    });

    it("should accept value exactly 1", () => {
      const result = parseRemindDays("1");

      expect(result).toBe(1);
    });

    it("should accept value exactly 365", () => {
      const result = parseRemindDays("365");

      expect(result).toBe(365);
    });

    it("should parse valid number in middle range", () => {
      const result = parseRemindDays("180");

      expect(result).toBe(180);
    });
  });
});

describe("ConfigurationService", () => {
  let mockStorage: ConfigurationStorage;
  let service: ConfigurationService;

  beforeEach(() => {
    mockStorage = {
      findOne: vi.fn(),
      findMany: vi.fn(),
    };
    service = new ConfigurationService(mockStorage);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getConfigurationValue", () => {
    it("should fetch from storage if not cached", async () => {
      vi.mocked(mockStorage.findOne).mockResolvedValue({
        value: "20260214",
      });

      const result = await service.getConfigurationValue(
        "event-123",
        CONFIGURATION_KEYS.WEDDING_DATE,
      );

      expect(result).toBe("20260214");
      expect(mockStorage.findOne).toHaveBeenCalledWith(
        "event-123",
        CONFIGURATION_KEYS.WEDDING_DATE,
      );
    });

    it("should return null if config not found", async () => {
      vi.mocked(mockStorage.findOne).mockResolvedValue(null);

      const result = await service.getConfigurationValue(
        "event-123",
        CONFIGURATION_KEYS.WEDDING_DATE,
      );

      expect(result).toBe(null);
    });

    it("should use cached value if within TTL", async () => {
      // First call - populates cache
      vi.mocked(mockStorage.findOne).mockResolvedValue({
        value: "cached-value",
      });

      const result1 = await service.getConfigurationValue(
        "event-123",
        CONFIGURATION_KEYS.WEDDING_DATE,
      );

      // Second call - should use cache
      const result2 = await service.getConfigurationValue(
        "event-123",
        CONFIGURATION_KEYS.WEDDING_DATE,
      );

      expect(result1).toBe("cached-value");
      expect(result2).toBe("cached-value");
      expect(mockStorage.findOne).toHaveBeenCalledTimes(1); // Only called once
    });

    it("should return null on storage error and log it", async () => {
      vi.mocked(mockStorage.findOne).mockRejectedValue(
        new Error("DB connection failed"),
      );

      const result = await service.getConfigurationValue(
        "event-123",
        CONFIGURATION_KEYS.WEDDING_DATE,
      );

      expect(result).toBe(null);
    });
  });

  describe("getConfigurations", () => {
    it("should fetch multiple configs from storage", async () => {
      const mockConfigs = [
        {
          key: CONFIGURATION_KEYS.WEDDING_DATE as ConfigurationKey,
          value: "20260214",
        },
        {
          key: CONFIGURATION_KEYS.PHOTO_UPLOAD_URL as ConfigurationKey,
          value: "https://upload.example.com",
        },
      ];

      vi.mocked(mockStorage.findMany).mockResolvedValue(mockConfigs);

      const result = await service.getConfigurations("event-123", [
        CONFIGURATION_KEYS.WEDDING_DATE,
        CONFIGURATION_KEYS.PHOTO_UPLOAD_URL,
      ]);

      expect(result).toEqual({
        [CONFIGURATION_KEYS.WEDDING_DATE]: "20260214",
        [CONFIGURATION_KEYS.PHOTO_UPLOAD_URL]: "https://upload.example.com",
      });
    });

    it("should return null for missing keys", async () => {
      const mockConfigs = [
        {
          key: CONFIGURATION_KEYS.WEDDING_DATE as ConfigurationKey,
          value: "20260214",
        },
      ];

      vi.mocked(mockStorage.findMany).mockResolvedValue(mockConfigs);

      const result = await service.getConfigurations("event-123", [
        CONFIGURATION_KEYS.WEDDING_DATE,
        CONFIGURATION_KEYS.PHOTO_UPLOAD_URL, // Not in DB
      ]);

      expect(result).toEqual({
        [CONFIGURATION_KEYS.WEDDING_DATE]: "20260214",
        [CONFIGURATION_KEYS.PHOTO_UPLOAD_URL]: null,
      });
    });

    it("should return all nulls on storage error", async () => {
      vi.mocked(mockStorage.findMany).mockRejectedValue(
        new Error("DB connection failed"),
      );

      const result = await service.getConfigurations("event-123", [
        CONFIGURATION_KEYS.WEDDING_DATE,
        CONFIGURATION_KEYS.PHOTO_UPLOAD_URL,
      ]);

      expect(result).toEqual({
        [CONFIGURATION_KEYS.WEDDING_DATE]: null,
        [CONFIGURATION_KEYS.PHOTO_UPLOAD_URL]: null,
      });
    });

    it("should populate cache for all keys", async () => {
      const mockConfigs = [
        {
          key: CONFIGURATION_KEYS.WEDDING_DATE as ConfigurationKey,
          value: "20260214",
        },
      ];

      vi.mocked(mockStorage.findMany).mockResolvedValue(mockConfigs);

      await service.getConfigurations("event-123", [
        CONFIGURATION_KEYS.WEDDING_DATE,
      ]);

      // Now calling getConfigurationValue should use cache
      vi.mocked(mockStorage.findOne).mockResolvedValue({
        value: "should-not-be-called",
      });

      const cached = await service.getConfigurationValue(
        "event-123",
        CONFIGURATION_KEYS.WEDDING_DATE,
      );

      expect(cached).toBe("20260214"); // From cache
      expect(mockStorage.findOne).not.toHaveBeenCalled();
    });
  });

  describe("clearCache", () => {
    it("should clear the memory cache", async () => {
      // Populate cache
      vi.mocked(mockStorage.findOne).mockResolvedValue({
        value: "cached-value",
      });

      await service.getConfigurationValue(
        "event-123",
        CONFIGURATION_KEYS.WEDDING_DATE,
      );

      // Clear cache
      service.clearCache();

      // Next call should hit storage again
      vi.mocked(mockStorage.findOne).mockResolvedValue({
        value: "new-value",
      });

      const result = await service.getConfigurationValue(
        "event-123",
        CONFIGURATION_KEYS.WEDDING_DATE,
      );

      expect(result).toBe("new-value");
      expect(mockStorage.findOne).toHaveBeenCalledTimes(2); // Called twice
    });
  });

  describe("getWeddingDate", () => {
    it("should fetch from storage and parse as Date", async () => {
      vi.mocked(mockStorage.findOne).mockResolvedValue({
        value: "2026-02-14T00:00:00.000Z",
      });

      const result = await service.getWeddingDate("event-123");

      expect(result).toBeInstanceOf(Date);
      expect(mockStorage.findOne).toHaveBeenCalledWith(
        "event-123",
        CONFIGURATION_KEYS.WEDDING_DATE,
      );
    });

    it("should fallback to env variable if not in DB", async () => {
      vi.mocked(mockStorage.findOne).mockResolvedValue(null);

      // Mock process.env
      const originalEnv = process.env.NEXT_PUBLIC_WEDDING_DATE;
      process.env.NEXT_PUBLIC_WEDDING_DATE = "20260315";

      const result = await service.getWeddingDate("event-123");

      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(2); // March (0-indexed)
      expect(result.getDate()).toBe(15);

      // Restore env
      process.env.NEXT_PUBLIC_WEDDING_DATE = originalEnv;
    });

    it("should fallback to default if env not set", async () => {
      vi.mocked(mockStorage.findOne).mockResolvedValue(null);

      // Mock process.env
      const originalEnv = process.env.NEXT_PUBLIC_WEDDING_DATE;
      delete process.env.NEXT_PUBLIC_WEDDING_DATE;

      const result = await service.getWeddingDate("event-123");

      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(1); // February (0-indexed)
      expect(result.getDate()).toBe(14);

      // Restore env
      process.env.NEXT_PUBLIC_WEDDING_DATE = originalEnv;
    });
  });

  describe("getPhotoUploadUrl", () => {
    it("should fetch from storage", async () => {
      vi.mocked(mockStorage.findOne).mockResolvedValue({
        value: "https://upload.example.com",
      });

      const result = await service.getPhotoUploadUrl("event-123");

      expect(result).toBe("https://upload.example.com");
    });

    it("should fallback to env variable if not in DB", async () => {
      vi.mocked(mockStorage.findOne).mockResolvedValue(null);

      // Mock process.env
      const originalEnv = process.env.NEXT_PUBLIC_PHOTO_UPLOAD_URL;
      process.env.NEXT_PUBLIC_PHOTO_UPLOAD_URL = "https://env-upload.com";

      const result = await service.getPhotoUploadUrl("event-123");

      expect(result).toBe("https://env-upload.com");

      // Restore env
      process.env.NEXT_PUBLIC_PHOTO_UPLOAD_URL = originalEnv;
    });

    it("should return empty string if no config and no env", async () => {
      vi.mocked(mockStorage.findOne).mockResolvedValue(null);

      // Mock process.env
      const originalEnv = process.env.NEXT_PUBLIC_PHOTO_UPLOAD_URL;
      delete process.env.NEXT_PUBLIC_PHOTO_UPLOAD_URL;

      const result = await service.getPhotoUploadUrl("event-123");

      expect(result).toBe("");

      // Restore env
      process.env.NEXT_PUBLIC_PHOTO_UPLOAD_URL = originalEnv;
    });
  });

  describe("getRemindRestingDays", () => {
    it("should fetch and parse from storage", async () => {
      vi.mocked(mockStorage.findOne).mockResolvedValue({
        value: "60",
      });

      const result = await service.getRemindRestingDays("event-123");

      expect(result).toBe(60);
    });

    it("should return null and fallback to env if invalid value", async () => {
      vi.mocked(mockStorage.findOne).mockResolvedValue({
        value: "invalid",
      });

      // Mock process.env
      const originalEnv = process.env.NEXT_PUBLIC_REMIND_RESTING;
      process.env.NEXT_PUBLIC_REMIND_RESTING = "50";

      const result = await service.getRemindRestingDays("event-123");

      expect(result).toBe(50);

      // Restore env
      process.env.NEXT_PUBLIC_REMIND_RESTING = originalEnv;
    });

    it("should fallback to env variable if not in DB", async () => {
      vi.mocked(mockStorage.findOne).mockResolvedValue(null);

      // Mock process.env
      const originalEnv = process.env.NEXT_PUBLIC_REMIND_RESTING;
      process.env.NEXT_PUBLIC_REMIND_RESTING = "45";

      const result = await service.getRemindRestingDays("event-123");

      expect(result).toBe(45);

      // Restore env
      process.env.NEXT_PUBLIC_REMIND_RESTING = originalEnv;
    });

    it("should fallback to default 40 if no config and no env", async () => {
      vi.mocked(mockStorage.findOne).mockResolvedValue(null);

      // Mock process.env
      const originalEnv = process.env.NEXT_PUBLIC_REMIND_RESTING;
      delete process.env.NEXT_PUBLIC_REMIND_RESTING;

      const result = await service.getRemindRestingDays("event-123");

      expect(result).toBe(40); // Default fallback

      // Restore env
      process.env.NEXT_PUBLIC_REMIND_RESTING = originalEnv;
    });
  });
});
