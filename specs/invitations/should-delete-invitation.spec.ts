import { test, expect } from "@playwright/test";

test.describe("Invitations Management", () => {
  test("should delete an invitation", async ({ page }) => {
    await page.goto("/backoffice/invitations");

    // First: create an invitation so we have something to delete
    await page.getByRole("button", { name: "Crear Invitación" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(page.locator('input[name="guestName"]')).toBeVisible({
      timeout: 10_000,
    });

    await page.locator('input[name="guestName"]').fill("E2E Para Eliminar");
    await dialog.getByRole("button", { name: "Crear Invitación" }).click();
    await expect(dialog).not.toBeVisible({ timeout: 10_000 });

    // Verify the invitation is in the desktop table (hidden md:block)
    // Use exact:true to avoid matching the mobile "Tabla de invitaciones móvil" table
    const table = page.getByRole("grid", { name: "Tabla de invitaciones", exact: true });
    await expect(table).toContainText("E2E Para Eliminar", { timeout: 10_000 });

    // Find the row in the DESKTOP table (the mobile table is hidden on desktop viewport)
    const row = table.locator("tr").filter({ hasText: "E2E Para Eliminar" }).first();
    await row.locator("button").last().click();

    // Confirmation modal should appear
    const confirmModal = page.getByRole("dialog");
    await expect(confirmModal).toBeVisible();
    await expect(confirmModal).toContainText("Confirmar Eliminación");
    await expect(confirmModal).toContainText("E2E Para Eliminar");

    // Confirm the deletion
    await confirmModal.getByRole("button", { name: "Eliminar" }).click();
    await expect(confirmModal).not.toBeVisible({ timeout: 10_000 });

    // The invitation should no longer appear in the table
    await expect(table).not.toContainText("E2E Para Eliminar", {
      timeout: 10_000,
    });
  });
});
