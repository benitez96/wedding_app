import { test, expect } from "@playwright/test";

// Public route — no auth needed
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Collaborator Join Flow", () => {
  test("should show error for an invalid collaborator invite link", async ({
    page,
  }) => {
    await page.goto("/join/this-is-not-a-valid-invite-token");

    // The join page server component calls getInviteLinkInfo(token).
    // When the token is not found, it renders the inline error UI directly
    // (no redirect — stays at /join/...).
    await expect(
      page.getByRole("heading", { name: "Link no válido" }),
    ).toBeVisible({ timeout: 10_000 });

    await expect(
      page.getByText(
        /no es válido o ha expirado|Este link de invitación no es válido/,
      ),
    ).toBeVisible();
  });
});
