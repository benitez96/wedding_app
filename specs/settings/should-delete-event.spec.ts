import { test, expect } from "@playwright/test";
import { PrismaClient } from "../../app/generated/prisma/index.js";
import { hashPassword } from "better-auth/crypto";
import crypto from "node:crypto";

// Use empty storage state — this test manages its own login session
// so that deleting the event does not affect the shared project auth state.
test.use({ storageState: { cookies: [], origins: [] } });

const EVENT_NAME = "E2E Event To Delete";
let disposableEmail: string;
let disposablePassword: string;

test.beforeAll(async () => {
  disposableEmail = `e2e-delete-evt-${crypto.randomBytes(4).toString("hex")}@test.local`;
  disposablePassword = `${crypto.randomBytes(12).toString("base64url")}Aa1!`;
  const hashedPassword = await hashPassword(disposablePassword);

  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.TEST_DATABASE_URL } },
  });

  try {
    const user = await prisma.user.create({
      data: {
        name: "E2E Delete Event User",
        email: disposableEmail,
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

    await prisma.event.create({
      data: {
        name: EVENT_NAME,
        slug: `e2e-delete-${crypto.randomBytes(4).toString("hex")}`,
        ownerId: user.id,
      },
    });

    // Clear sign-in rate limits so the test login is not blocked
    await prisma.$executeRaw`DELETE FROM rate_limit WHERE key LIKE '%/sign-in/email%'`;
  } finally {
    await prisma.$disconnect();
  }
});

test.describe("Settings", () => {
  test("should delete the event via the Danger Zone", async ({ page }) => {
    // Login as the disposable user
    await page.goto("/backoffice/login");
    await page.locator('input[name="email"]').fill(disposableEmail);
    await page.locator('input[name="password"]').fill(disposablePassword);
    await page.getByRole("button", { name: "Iniciar Sesión" }).click();

    // Wait for any backoffice route after login
    await page.waitForURL((url) => url.pathname.startsWith("/backoffice"), {
      timeout: 30_000,
    });

    await page.goto("/backoffice/settings");

    // Danger Zone section — "Eliminar Evento" button is visible
    const deleteButton = page.getByRole("button", { name: "Eliminar Evento" });
    await expect(deleteButton).toBeVisible({ timeout: 10_000 });
    await deleteButton.click();

    // Confirmation modal opens
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();
    await expect(
      modal.getByRole("heading", { name: "Confirmar Eliminación" }),
    ).toBeVisible();

    // "Eliminar Permanentemente" is disabled until the event name is typed
    const confirmButton = modal.getByRole("button", {
      name: "Eliminar Permanentemente",
    });
    await expect(confirmButton).toBeDisabled();

    // Type the exact event name to unlock the button
    await modal.locator("input").fill(EVENT_NAME);
    await expect(confirmButton).toBeEnabled();

    await confirmButton.click();

    // After deletion the app should navigate away from /backoffice/settings
    await page.waitForURL(
      (url) => !url.pathname.includes("/backoffice/settings"),
      { timeout: 15_000 },
    );
  });
});
