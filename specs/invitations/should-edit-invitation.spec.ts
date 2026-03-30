import { test, expect } from "@playwright/test";

test.describe("Invitations Management", () => {
  test("should edit an invitation", async ({ page }) => {
    await page.goto("/backoffice/invitations");

    // Create an invitation to edit
    await page.getByRole("button", { name: "Crear Invitación" }).click();

    const createDialog = page.getByRole("dialog");
    await expect(createDialog).toBeVisible();
    await expect(page.locator('input[name="guestName"]')).toBeVisible({
      timeout: 10_000,
    });

    await page.locator('input[name="guestName"]').fill("E2E Original Name");
    await createDialog.getByRole("button", { name: "Crear Invitación" }).click();
    await expect(createDialog).not.toBeVisible({ timeout: 10_000 });

    // Verify invitation appears in the desktop table (exact: true avoids matching mobile table)
    const table = page.getByRole("grid", {
      name: "Tabla de invitaciones",
      exact: true,
    });
    await expect(table).toContainText("E2E Original Name", { timeout: 10_000 });

    // Click the edit button (first icon button in the actions cell — Edit icon, before Delete)
    const row = table
      .locator("tr")
      .filter({ hasText: "E2E Original Name" })
      .first();
    await row.locator("button").first().click();

    // Edit modal should open
    const editDialog = page.getByRole("dialog");
    await expect(editDialog).toBeVisible();
    await expect(
      editDialog.getByRole("heading", { name: "Editar Invitación" }),
    ).toBeVisible();

    // Update the guest name
    const nameInput = editDialog.locator('input[name="guestName"]');
    await expect(nameInput).toBeVisible({ timeout: 5_000 });
    await nameInput.fill("E2E Nombre Actualizado");

    // Submit
    await editDialog
      .getByRole("button", { name: "Actualizar Invitación" })
      .click();
    await expect(editDialog).not.toBeVisible({ timeout: 10_000 });

    // Updated name should be reflected in the table
    await expect(table).toContainText("E2E Nombre Actualizado", {
      timeout: 10_000,
    });
    await expect(table).not.toContainText("E2E Original Name");
  });
});
