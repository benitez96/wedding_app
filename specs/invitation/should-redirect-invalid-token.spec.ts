import { test, expect } from "@playwright/test";

// Public route — no auth needed
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Public Invitation Flow", () => {
  test("should redirect invalid token to error page", async ({ page }) => {
    await page.goto("/r/this-token-does-not-exist-at-all");

    // TokenProcessor shows HeartLoader while calling processInvitationToken().
    // On failure it does router.replace("/error?message=...").
    await page.waitForURL(
      (url) => url.pathname === "/error",
      { timeout: 20_000 },
    );

    // Should land on the error page showing an invalid/unknown error
    await expect(page).toHaveURL(/\/error/);

    // One of the known error titles should be visible
    await expect(
      page.getByText(/Token Inválido|Error del Sistema|Error Desconocido/),
    ).toBeVisible();
  });
});
