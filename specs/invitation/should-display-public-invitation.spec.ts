import fs from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";

// No backoffice auth — the guest authenticates via the invitation token
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Public Invitation Flow", () => {
  test("should process a valid token and display the public invitation page", async ({
    page,
  }) => {
    const credentialsPath = path.join(
      process.cwd(),
      ".e2e-state",
      "credentials.json",
    );
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf-8"));
    const tier = test.info().project.name as "free" | "basic" | "company";
    const { invitationToken } = credentials[tier];

    // Navigate to the token processor page
    await page.goto(`/r/${invitationToken}`, { timeout: 30_000 });

    // TokenProcessor shows HeartLoader while calling processInvitationToken().
    // On success it does router.replace("/") → public invitation page.
    await page.waitForFunction(
      () => !window.location.pathname.startsWith("/r/"),
      { timeout: 30_000 },
    );

    // Must NOT have landed on the error page
    await expect(page).not.toHaveURL(/\/error/);

    // Should be on the public invitation root (/)
    await expect(page).toHaveURL(/^http:\/\/localhost:3000\/?(\?|#.*)?$/);

    // RSVP section is visible: the pending state CTA button is shown
    // (global-setup seeds an rsvp section for each test event)
    await expect(
      page.getByRole("button", { name: "CONFIRMAR ASISTENCIA" }),
    ).toBeVisible({ timeout: 10_000 });

    // QR section title is visible
    // (global-setup seeds a qr section for each test event)
    await expect(
      page.getByText("CÓDIGO DE ACCESO"),
    ).toBeVisible({ timeout: 10_000 });

    // QR canvas element is rendered by the InvitationQRCode component
    await expect(page.locator("canvas")).toBeVisible({ timeout: 10_000 });
  });
});
