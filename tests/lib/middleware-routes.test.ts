import { describe, it, expect } from "vitest";
import {
  isPublicRoute,
  isStaticAsset,
  isAuthRedirectRoute,
  PUBLIC_EXACT_ROUTES,
  PUBLIC_PREFIX_ROUTES,
} from "@/lib/middleware/routes";

describe("isPublicRoute", () => {
  describe("exact routes", () => {
    const exactRoutes = [
      "/",
      "/login",
      "/sign-up",
      "/register",
      "/backoffice/login",
      "/favicon.ico",
      "/logo.png",
    ];

    exactRoutes.forEach((route) => {
      it(`returns true for exact public route: ${route}`, () => {
        expect(isPublicRoute(route)).toBe(true);
      });
    });
  });

  describe("prefix routes", () => {
    const prefixCases = [
      "/error",
      "/error/404",
      "/api/auth",
      "/api/auth/session",
      "/api/auth/sign-in/email",
      "/api/health",
      "/r/some-token",
      "/join/abc123",
      "/_next/static/chunks/main.js",
      "/static/image.png",
    ];

    prefixCases.forEach((route) => {
      it(`returns true for prefix-matched public route: ${route}`, () => {
        expect(isPublicRoute(route)).toBe(true);
      });
    });
  });

  describe("protected routes", () => {
    const protectedRoutes = [
      "/backoffice/dashboard",
      "/backoffice/invitations",
      "/backoffice/settings",
      "/dashboard",
      "/(invitation)",
      "/some-private-page",
    ];

    protectedRoutes.forEach((route) => {
      it(`returns false for protected route: ${route}`, () => {
        expect(isPublicRoute(route)).toBe(false);
      });
    });
  });
});

describe("isStaticAsset", () => {
  describe("static prefixes", () => {
    it("returns true for /_next/ paths", () => {
      expect(isStaticAsset("/_next/static/css/main.css")).toBe(true);
    });

    it("returns true for /static/ paths", () => {
      expect(isStaticAsset("/static/logo.png")).toBe(true);
    });

    it("returns true for /uploads/ paths", () => {
      expect(isStaticAsset("/uploads/photo.jpg")).toBe(true);
    });
  });

  describe("file extensions", () => {
    const staticExtensions = [
      "/image.jpg",
      "/image.jpeg",
      "/image.png",
      "/image.gif",
      "/image.webp",
      "/image.svg",
      "/image.ico",
      "/styles.css",
      "/bundle.js",
      "/font.woff",
      "/font.woff2",
    ];

    staticExtensions.forEach((path) => {
      it(`returns true for ${path}`, () => {
        expect(isStaticAsset(path)).toBe(true);
      });
    });
  });

  describe("non-static paths", () => {
    const nonStatic = ["/backoffice/dashboard", "/api/health", "/login", "/"];

    nonStatic.forEach((path) => {
      it(`returns false for ${path}`, () => {
        expect(isStaticAsset(path)).toBe(false);
      });
    });
  });
});

describe("isAuthRedirectRoute", () => {
  it("returns true for /backoffice paths", () => {
    expect(isAuthRedirectRoute("/backoffice/dashboard")).toBe(true);
    expect(isAuthRedirectRoute("/backoffice/invitations")).toBe(true);
    expect(isAuthRedirectRoute("/backoffice/settings")).toBe(true);
  });

  it("returns true for /dashboard paths", () => {
    expect(isAuthRedirectRoute("/dashboard")).toBe(true);
    expect(isAuthRedirectRoute("/dashboard/overview")).toBe(true);
  });

  it("returns false for public paths", () => {
    expect(isAuthRedirectRoute("/login")).toBe(false);
    expect(isAuthRedirectRoute("/")).toBe(false);
    expect(isAuthRedirectRoute("/api/health")).toBe(false);
  });

  it("returns false for invitation paths", () => {
    expect(isAuthRedirectRoute("/(invitation)")).toBe(false);
    expect(isAuthRedirectRoute("/r/some-token")).toBe(false);
  });
});
