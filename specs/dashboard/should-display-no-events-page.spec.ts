import { test, expect } from "@playwright/test";
import { PrismaClient } from "../../app/generated/prisma/index.js";
import { hashPassword } from "better-auth/crypto";
import crypto from "node:crypto";

// Use empty storage state — this test logs in as a user who has no events
test.use({ storageState: { cookies: [], origins: [] } });

let noEventsEmail: string;
let noEventsPassword: string;

test.beforeAll(async () => {
  noEventsEmail = `e2e-no-events-${crypto.randomBytes(4).toString("hex")}@test.local`;
  noEventsPassword = `${crypto.randomBytes(12).toString("base64url")}Aa1!`;
  const hashedPassword = await hashPassword(noEventsPassword);

  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.TEST_DATABASE_URL } },
  });

  try {
    const user = await prisma.user.create({
      data: {
        name: "E2E No Events User",
        email: noEventsEmail,
        emailVerified: true,
      },
    });

    await prisma.account.create({
      data: {
        id: `${user.id}_credential`,
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password: hashedPassword,
      },
    });

    // NOTE: No Event record is created — this user has zero events by design.
    // Clear sign-in rate limits so the fresh login is not blocked.
    await prisma.$executeRaw`DELETE FROM rate_limit WHERE key LIKE '%/sign-in/email%'`;
  } finally {
    await prisma.$disconnect();
  }
});

test.describe("No Events Page", () => {
  test("should display the no-events page when the user has no events", async ({
    page,
  }) => {
    // Login as the no-events user
    await page.goto("/backoffice/login");
    await page.locator('input[name="email"]').fill(noEventsEmail);
    await page.locator('input[name="password"]').fill(noEventsPassword);
    await page.getByRole("button", { name: "Iniciar Sesión" }).click();

    // After login the user has no events — the app may redirect to /backoffice/no-events
    // or to another route; we navigate there explicitly.
    await page.waitForURL((url) => url.pathname.startsWith("/backoffice"), {
      timeout: 30_000,
    });

    await page.goto("/backoffice/no-events");

    // The NoEventsView heading is visible
    await expect(
      page.getByRole("heading", {
        name: /Parece que no tienes ningún evento creado/i,
      }),
    ).toBeVisible({ timeout: 10_000 });

    // Feature bullet points are present
    await expect(
      page.getByText("Gestiona invitaciones y grupos de invitados"),
    ).toBeVisible();

    // "Crear Mi Primer Evento" CTA button is visible
    const ctaButton = page.getByRole("button", {
      name: "Crear Mi Primer Evento",
    });
    await expect(ctaButton).toBeVisible();

    // Clicking the CTA navigates away from /backoffice/no-events
    await ctaButton.click();
    await page.waitForURL(
      (url) => !url.pathname.includes("/backoffice/no-events"),
      { timeout: 10_000 },
    );
  });
});
