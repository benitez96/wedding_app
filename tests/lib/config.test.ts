/**
 * Tests for lib/config.ts
 *
 * CRITICAL: Only testing PURE logic (env var validation)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getRequiredEnvVar,
  getOptionalEnvVar,
  createSecurityConfig,
  validateJwtSecret,
  validateDatabaseUrl,
} from "@/lib/config";

describe("config - Pure Functions", () => {
  describe("getRequiredEnvVar", () => {
    it("should return value if environment variable exists", () => {
      const env = { DATABASE_URL: "postgresql://localhost:5432/db" };

      const result = getRequiredEnvVar("DATABASE_URL", env);

      expect(result).toBe("postgresql://localhost:5432/db");
    });

    it("should throw error if environment variable is missing", () => {
      const env = {};

      expect(() => getRequiredEnvVar("DATABASE_URL", env)).toThrow(
        "Variable de entorno requerida: DATABASE_URL",
      );
    });

    it("should throw error if environment variable is empty string", () => {
      const env = { DATABASE_URL: "" };

      expect(() => getRequiredEnvVar("DATABASE_URL", env)).toThrow(
        "Variable de entorno requerida: DATABASE_URL",
      );
    });

    it("should throw error if environment variable is undefined", () => {
      const env = { DATABASE_URL: undefined };

      expect(() => getRequiredEnvVar("DATABASE_URL", env)).toThrow(
        "Variable de entorno requerida: DATABASE_URL",
      );
    });
  });

  describe("getOptionalEnvVar", () => {
    it("should return value if environment variable exists", () => {
      const env = { PORT: "4000" };

      const result = getOptionalEnvVar("PORT", "3000", env);

      expect(result).toBe("4000");
    });

    it("should return default value if environment variable is missing", () => {
      const env = {};

      const result = getOptionalEnvVar("PORT", "3000", env);

      expect(result).toBe("3000");
    });

    it("should return default value if environment variable is empty string", () => {
      const env = { PORT: "" };

      const result = getOptionalEnvVar("PORT", "3000", env);

      expect(result).toBe("3000");
    });

    it("should return default value if environment variable is undefined", () => {
      const env = { PORT: undefined };

      const result = getOptionalEnvVar("PORT", "3000", env);

      expect(result).toBe("3000");
    });
  });

  describe("createSecurityConfig", () => {
    it("should create config for production environment", () => {
      const result = createSecurityConfig("production");

      expect(result).toEqual({
        JWT_ALGORITHM: "HS512",
        JWT_ISSUER: "wedding-app",
        JWT_INVITATION_AUDIENCE: "wedding-invitation",
        COOKIE_SECURE: true,
        COOKIE_SAME_SITE: "lax",
        COOKIE_HTTP_ONLY: true,
        INVITATION_SESSION_DURATION: 180 * 24 * 60 * 60,
      });
    });

    it("should create config for development environment", () => {
      const result = createSecurityConfig("development");

      expect(result).toEqual({
        JWT_ALGORITHM: "HS512",
        JWT_ISSUER: "wedding-app",
        JWT_INVITATION_AUDIENCE: "wedding-invitation",
        COOKIE_SECURE: false,
        COOKIE_SAME_SITE: "lax",
        COOKIE_HTTP_ONLY: true,
        INVITATION_SESSION_DURATION: 180 * 24 * 60 * 60,
      });
    });

    it("should treat non-production as insecure cookies", () => {
      const result = createSecurityConfig("test");

      expect(result.COOKIE_SECURE).toBe(false);
    });

    it("should always use HTTP-only cookies", () => {
      const prodConfig = createSecurityConfig("production");
      const devConfig = createSecurityConfig("development");

      expect(prodConfig.COOKIE_HTTP_ONLY).toBe(true);
      expect(devConfig.COOKIE_HTTP_ONLY).toBe(true);
    });
  });

  describe("validateJwtSecret", () => {
    it("should accept valid JWT secret with 32+ characters", () => {
      expect(() =>
        validateJwtSecret(
          "this-is-a-valid-secret-with-more-than-32-characters",
        ),
      ).not.toThrow();
    });

    it("should accept secret exactly 32 characters", () => {
      expect(() =>
        validateJwtSecret("12345678901234567890123456789012"),
      ).not.toThrow();
    });

    it("should reject JWT secret with less than 32 characters", () => {
      expect(() => validateJwtSecret("short-secret")).toThrow(
        "JWT_SECRET debe tener al menos 32 caracteres",
      );
    });

    it("should reject forbidden example secrets", () => {
      // Only test forbidden secrets that have 32+ chars
      // (shorter ones fail length validation first)
      const forbiddenSecrets = [
        "default-secret-for-development-only", // 36 chars
        "tu-super-secreto-jwt-de-al-menos-32-caracteres-aqui", // 53 chars
      ];

      forbiddenSecrets.forEach((secret) => {
        expect(() => validateJwtSecret(secret)).toThrow(
          "JWT_SECRET no puede ser un valor de ejemplo",
        );
      });
    });

    it("should reject short forbidden secret with length error", () => {
      // "secret-jwt" is only 10 chars, so it fails length check first
      expect(() => validateJwtSecret("secret-jwt")).toThrow(
        "JWT_SECRET debe tener al menos 32 caracteres",
      );
    });

    it("should accept custom secret with 32+ chars that is not forbidden", () => {
      expect(() =>
        validateJwtSecret(
          "my-custom-production-secret-key-with-lots-of-entropy",
        ),
      ).not.toThrow();
    });
  });

  describe("validateDatabaseUrl", () => {
    beforeEach(() => {
      // Mock logWarning to avoid console output during tests
      vi.mock("@/lib/logger", () => ({
        logWarning: vi.fn(),
      }));
    });

    it("should warn if DATABASE_URL missing SSL in production", async () => {
      const { logWarning } = await import("@/lib/logger");

      validateDatabaseUrl("postgresql://localhost:5432/db", "production");

      expect(logWarning).toHaveBeenCalledWith(
        "Security",
        "DATABASE_URL no incluye SSL en producción",
      );
    });

    it("should not warn if DATABASE_URL has ssl=true in production", async () => {
      const { logWarning } = await import("@/lib/logger");
      vi.mocked(logWarning).mockClear();

      validateDatabaseUrl(
        "postgresql://localhost:5432/db?ssl=true",
        "production",
      );

      expect(logWarning).not.toHaveBeenCalled();
    });

    it("should not warn if DATABASE_URL has sslmode=require in production", async () => {
      const { logWarning } = await import("@/lib/logger");
      vi.mocked(logWarning).mockClear();

      validateDatabaseUrl(
        "postgresql://localhost:5432/db?sslmode=require",
        "production",
      );

      expect(logWarning).not.toHaveBeenCalled();
    });

    it("should not warn about missing SSL in development", async () => {
      const { logWarning } = await import("@/lib/logger");
      vi.mocked(logWarning).mockClear();

      validateDatabaseUrl("postgresql://localhost:5432/db", "development");

      expect(logWarning).not.toHaveBeenCalled();
    });

    it("should not warn about missing SSL in test", async () => {
      const { logWarning } = await import("@/lib/logger");
      vi.mocked(logWarning).mockClear();

      validateDatabaseUrl("postgresql://localhost:5432/db", "test");

      expect(logWarning).not.toHaveBeenCalled();
    });
  });
});
