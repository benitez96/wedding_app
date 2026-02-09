/**
 * Tests for lib/logger.ts
 *
 * CRITICAL: Logger handles sensitive data sanitization.
 * Tests must verify that passwords, tokens, and secrets are properly redacted.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logError, logWarning, logInfo, formatError } from "@/lib/logger";

describe("logError", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleInfoSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  describe("Development environment", () => {
    beforeEach(() => {
      vi.stubEnv("NODE_ENV", "development");
    });

    it("should log full error details in development", () => {
      const error = new Error("Test error");
      logError("Test context", error);

      expect(consoleErrorSpy).toHaveBeenCalledWith("[Test context]", error, "");
    });

    it("should log error with metadata in development", () => {
      const error = new Error("Test error");
      const metadata = { userId: "123", action: "test" };

      logError("Test context", error, { metadata });

      expect(consoleErrorSpy).toHaveBeenCalledWith("[Test context]", error, {
        metadata,
      });
    });

    it("should log string errors in development", () => {
      logError("Test context", "String error");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[Test context]",
        "String error",
        "",
      );
    });

    it("should log unknown error types in development", () => {
      const error = { custom: "error" };
      logError("Test context", error);

      expect(consoleErrorSpy).toHaveBeenCalledWith("[Test context]", error, "");
    });
  });

  describe("Production environment", () => {
    beforeEach(() => {
      vi.stubEnv("NODE_ENV", "production");
    });

    it("should only log context in production (no error details)", () => {
      const error = new Error("Sensitive error with password123");
      logError("Test context", error);

      expect(consoleErrorSpy).toHaveBeenCalledWith("[Test context]");
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.anything(),
        error,
        expect.anything(),
      );
    });

    it("should sanitize sensitive metadata in production", () => {
      const error = new Error("Test error");
      const metadata = {
        userId: "123",
        password: "secret123",
        token: "abc-token-xyz",
      };

      logError("Test context", error, { metadata });

      // Should have been called twice: once with context, once with sanitized metadata
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
      expect(consoleErrorSpy).toHaveBeenNthCalledWith(1, "[Test context]");
      expect(consoleErrorSpy).toHaveBeenNthCalledWith(2, "Metadata:", {
        userId: "123",
        password: "[REDACTED]",
        token: "[REDACTED]",
      });
    });

    it("should not log empty metadata in production", () => {
      const error = new Error("Test error");
      const metadata = {
        password: "secret",
        token: "token",
      };

      logError("Test context", error, { metadata });

      // Should be called twice: context + metadata with redacted values
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
      expect(consoleErrorSpy).toHaveBeenNthCalledWith(1, "[Test context]");
      expect(consoleErrorSpy).toHaveBeenNthCalledWith(2, "Metadata:", {
        password: "[REDACTED]",
        token: "[REDACTED]",
      });
    });
  });

  describe("Log levels", () => {
    beforeEach(() => {
      vi.stubEnv("NODE_ENV", "development");
    });

    it("should log at error level by default", () => {
      logError("Test", new Error("test"));
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
    });

    it("should log at warn level when specified", () => {
      logError("Test", new Error("test"), { level: "warn" });
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it("should log at info level when specified", () => {
      logError("Test", new Error("test"), { level: "info" });
      expect(consoleInfoSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });
});

describe("logWarning", () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "development");
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  it("should log warning message", () => {
    logWarning("Test context", "Warning message");

    expect(consoleWarnSpy).toHaveBeenCalled();
  });

  it("should log warning with metadata", () => {
    logWarning("Test context", "Warning message", { userId: "123" });

    expect(consoleWarnSpy).toHaveBeenCalled();
  });

  it("should create Error object from string message", () => {
    logWarning("Test context", "Warning message");

    // Verify it logs as warn level (internal implementation detail)
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "[Test context]",
      expect.any(Error),
      expect.anything(),
    );
  });
});

describe("logInfo", () => {
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "development");
  });

  afterEach(() => {
    consoleInfoSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  it("should log info message", () => {
    logInfo("Test context", "Info message");

    expect(consoleInfoSpy).toHaveBeenCalled();
  });

  it("should log info with metadata", () => {
    logInfo("Test context", "Info message", { action: "test" });

    expect(consoleInfoSpy).toHaveBeenCalled();
  });
});

describe("formatError", () => {
  it("should format Error objects to message string", () => {
    const error = new Error("Test error message");
    expect(formatError(error)).toBe("Test error message");
  });

  it("should return string errors as-is", () => {
    expect(formatError("String error")).toBe("String error");
  });

  it("should handle unknown error types", () => {
    expect(formatError(null)).toBe("Error desconocido");
    expect(formatError(undefined)).toBe("Error desconocido");
    expect(formatError(123)).toBe("Error desconocido");
    expect(formatError({ custom: "error" })).toBe("Error desconocido");
  });

  it("should handle empty Error objects", () => {
    const error = new Error();
    expect(formatError(error)).toBe("");
  });

  it("should handle Error with undefined message property", () => {
    const error = new Error();
    delete (error as any).message; // Force undefined message
    expect(formatError(error)).toBe(""); // Returns empty string when message is undefined
  });

  it("should handle Error objects correctly via instanceof check", () => {
    class CustomError extends Error {
      constructor(message: string) {
        super(message);
        this.name = "CustomError";
      }
    }

    const error = new CustomError("Custom error message");
    expect(formatError(error)).toBe("Custom error message");
  });
});

describe("Metadata sanitization (security tests)", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "production");
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  it("should redact 'password' field", () => {
    logError("Test", new Error("test"), {
      metadata: { password: "secret123" },
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith("Metadata:", {
      password: "[REDACTED]",
    });
  });

  it("should redact 'token' field", () => {
    logError("Test", new Error("test"), {
      metadata: { token: "abc-xyz-123" },
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith("Metadata:", {
      token: "[REDACTED]",
    });
  });

  it("should redact 'secret' field", () => {
    logError("Test", new Error("test"), {
      metadata: { secret: "my-secret" },
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith("Metadata:", {
      secret: "[REDACTED]",
    });
  });

  it("should redact 'apiKey' field (camelCase)", () => {
    logError("Test", new Error("test"), {
      metadata: { apiKey: "key-123" },
    });

    expect(consoleErrorSpy).toHaveBeenNthCalledWith(2, "Metadata:", {
      apiKey: "[REDACTED]",
    });
  });

  it("should redact 'authorization' field", () => {
    logError("Test", new Error("test"), {
      metadata: { authorization: "Bearer token" },
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith("Metadata:", {
      authorization: "[REDACTED]",
    });
  });

  it("should redact 'cookie' field", () => {
    logError("Test", new Error("test"), {
      metadata: { cookie: "session=abc" },
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith("Metadata:", {
      cookie: "[REDACTED]",
    });
  });

  it("should redact 'session' field", () => {
    logError("Test", new Error("test"), {
      metadata: { session: "session-id" },
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith("Metadata:", {
      session: "[REDACTED]",
    });
  });

  it("should redact fields containing sensitive keywords (case-insensitive)", () => {
    logError("Test", new Error("test"), {
      metadata: {
        userPassword: "secret",
        accessToken: "token123",
        apiSecret: "secret123",
      },
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith("Metadata:", {
      userPassword: "[REDACTED]",
      accessToken: "[REDACTED]",
      apiSecret: "[REDACTED]",
    });
  });

  it("should preserve non-sensitive fields", () => {
    logError("Test", new Error("test"), {
      metadata: {
        userId: "123",
        userName: "John",
        action: "login",
        password: "secret",
      },
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith("Metadata:", {
      userId: "123",
      userName: "John",
      action: "login",
      password: "[REDACTED]",
    });
  });

  it("should handle nested objects recursively", () => {
    logError("Test", new Error("test"), {
      metadata: {
        user: {
          id: "123",
          credentials: {
            password: "secret",
            token: "abc",
          },
        },
      },
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith("Metadata:", {
      user: {
        id: "123",
        credentials: {
          password: "[REDACTED]",
          token: "[REDACTED]",
        },
      },
    });
  });

  it("should handle arrays in metadata", () => {
    logError("Test", new Error("test"), {
      metadata: {
        users: ["user1", "user2"],
        password: "secret",
      },
    });

    // Arrays are converted to objects when sanitized recursively
    expect(consoleErrorSpy).toHaveBeenNthCalledWith(2, "Metadata:", {
      users: {
        "0": "user1",
        "1": "user2",
      },
      password: "[REDACTED]",
    });
  });

  it("should handle null and undefined values", () => {
    logError("Test", new Error("test"), {
      metadata: {
        userId: "123",
        optional: null,
        missing: undefined,
      },
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith("Metadata:", {
      userId: "123",
      optional: null,
      missing: undefined,
    });
  });

  it("should prevent stack overflow with deeply nested objects", () => {
    // Create a deeply nested object (11 levels)
    let deepObject: any = { value: "deepest" };
    for (let i = 0; i < 11; i++) {
      deepObject = { nested: deepObject };
    }

    logError("Test", new Error("test"), {
      metadata: deepObject,
    });

    // Should have stopped at MAX_DEPTH (10) and added placeholder
    const calls = consoleErrorSpy.mock.calls;
    const metadataCall = calls.find((call: any[]) => call[0] === "Metadata:");
    expect(metadataCall).toBeDefined();

    // Verify it contains the MAX_DEPTH_EXCEEDED marker somewhere
    const metadataStr = JSON.stringify(metadataCall?.[1]);
    expect(metadataStr).toContain("[MAX_DEPTH_EXCEEDED]");
  });
});

describe("Integration tests - Real-world scenarios", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  it("should handle authentication error safely in production", () => {
    vi.stubEnv("NODE_ENV", "production");

    const error = new Error("Authentication failed");
    logError("Auth", error, {
      metadata: {
        username: "john@example.com",
        password: "user-entered-password",
        attemptedAt: new Date().toISOString(),
      },
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith("[Auth]");
    expect(consoleErrorSpy).toHaveBeenCalledWith("Metadata:", {
      username: "john@example.com",
      password: "[REDACTED]",
      attemptedAt: expect.any(String),
    });
  });

  it("should handle API error with sensitive headers in production", () => {
    vi.stubEnv("NODE_ENV", "production");

    logError("API", new Error("Request failed"), {
      metadata: {
        url: "/api/users",
        method: "POST",
        authorization: "Bearer abc123",
        responseCode: 401,
      },
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith("Metadata:", {
      url: "/api/users",
      method: "POST",
      authorization: "[REDACTED]",
      responseCode: 401,
    });
  });

  it("should handle database error without exposing credentials", () => {
    vi.stubEnv("NODE_ENV", "production");

    logError("Database", new Error("Connection failed"), {
      metadata: {
        host: "localhost",
        port: 5432,
        database: "wedding_app",
        user: "admin",
        password: "db-password",
      },
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith("Metadata:", {
      host: "localhost",
      port: 5432,
      database: "wedding_app",
      user: "admin",
      password: "[REDACTED]",
    });
  });
});
