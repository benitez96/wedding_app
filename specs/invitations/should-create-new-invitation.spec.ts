import { test, expect } from "@playwright/test";

test.describe("Invitations Management", () => {
  test("should create a new invitation", async ({ page }) => {
    await page.goto("/backoffice/invitations");

    // Open the create invitation modal
    await page.getByRole("button", { name: "Crear Invitación" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Wait for event to load (spinner disappears and form fields appear)
    await expect(page.locator('input[name="guestName"]')).toBeVisible({
      timeout: 10_000,
    });

    // Fill in the invitation form
    await page.locator('input[name="guestName"]').fill("E2E Invitado Test");
    await page.locator('input[name="maxGuests"]').fill("2");

    // Submit the form via the dialog button
    await dialog.getByRole("button", { name: "Crear Invitación" }).click();

    // Dialog should close after successful creation
    await expect(dialog).not.toBeVisible({ timeout: 10_000 });

    // The new invitation should appear in the table
    await expect(
      page.getByRole("grid", { name: "Tabla de invitaciones" }),
    ).toContainText("E2E Invitado Test");
  });
});
