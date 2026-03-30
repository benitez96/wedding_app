import { test, expect } from "@playwright/test";

test.describe("Invitations Management", () => {
  test("should enforce invitation limits by tier", async ({ page }) => {
    const tier = test.info().project.name;

    await page.goto("/backoffice/invitations");

    // Open the create invitation modal
    await page.getByRole("button", { name: "Crear Invitación" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Wait for modal to finish loading event/usage data
    await expect(page.getByText("Cargando evento...")).not.toBeVisible({
      timeout: 10_000,
    });

    if (tier === "free") {
      // FREE tier: usage indicator must be shown with a hard limit of 5
      await expect(page.getByText("Invitaciones usadas")).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.getByText(/\d+\/5/)).toBeVisible();
    } else {
      // BASIC / COMPANY: no limit enforced — usage indicator must not appear
      await expect(page.getByText("Invitaciones usadas")).not.toBeVisible();
      // Form fields are accessible immediately
      await expect(page.locator('input[name="guestName"]')).toBeVisible({
        timeout: 10_000,
      });
    }

    // Close the modal
    await dialog.getByRole("button", { name: "Cancelar" }).click();
    await expect(dialog).not.toBeVisible();
  });
});
