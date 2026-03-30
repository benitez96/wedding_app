import { test, expect } from "@playwright/test";

test.describe("Invitations Management", () => {
  test("should open invitation detail modal when clicking a table row", async ({
    page,
  }) => {
    await page.goto("/backoffice/invitations");

    // Create an invitation so the table is not empty
    await page.getByRole("button", { name: "Crear Invitación" }).click();

    const createDialog = page.getByRole("dialog");
    await expect(createDialog).toBeVisible();
    await expect(page.locator('input[name="guestName"]')).toBeVisible({
      timeout: 10_000,
    });

    await page
      .locator('input[name="guestName"]')
      .fill("E2E Detail Modal Test");
    await createDialog
      .getByRole("button", { name: "Crear Invitación" })
      .click();
    await expect(createDialog).not.toBeVisible({ timeout: 10_000 });

    // Confirm invitation is in the desktop table
    const table = page.getByRole("grid", {
      name: "Tabla de invitaciones",
      exact: true,
    });
    await expect(table).toContainText("E2E Detail Modal Test", {
      timeout: 10_000,
    });

    // Click on the first cell of the row (guest name column) to trigger the
    // intercepting @modal route — action buttons use stopPropagation.
    const row = table
      .locator("tr")
      .filter({ hasText: "E2E Detail Modal Test" })
      .first();
    await row.locator("td").first().click();

    // The @modal/(..)/[id] intercepting route renders InvitationDetailModal
    // as an overlay dialog
    const detailModal = page.getByRole("dialog");
    await expect(detailModal).toBeVisible({ timeout: 10_000 });

    // Modal should contain the guest's name
    await expect(detailModal).toContainText("E2E Detail Modal Test");

    // Edit button should be present inside the modal
    await expect(
      detailModal.getByRole("button", { name: /Editar|editar/i }),
    ).toBeVisible();

    // TokensTable section is visible with a "Create Token" button
    await expect(
      detailModal.getByRole("heading", { name: "Invitation Tokens" }),
    ).toBeVisible();

    // Click "Create Token" to generate a token for this invitation
    await detailModal.getByRole("button", { name: "Create Token" }).click();

    // After creation, the token row table (grid) should be visible
    await expect(
      detailModal.getByRole("grid", { name: "Invitation tokens table" }),
    ).toBeVisible({ timeout: 10_000 });
  });
});
