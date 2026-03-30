import { test, expect } from "@playwright/test";

test.describe("Invitations Management", () => {
  test("should revoke and reactivate a token in the invitation detail modal", async ({
    page,
  }) => {
    await page.goto("/backoffice/invitations");

    // Create an invitation so we have something to open
    await page.getByRole("button", { name: "Crear Invitación" }).click();

    const createDialog = page.getByRole("dialog");
    await expect(createDialog).toBeVisible();
    await expect(page.locator('input[name="guestName"]')).toBeVisible({
      timeout: 10_000,
    });

    await page.locator('input[name="guestName"]').fill("E2E Token Actions Test");
    await createDialog.getByRole("button", { name: "Crear Invitación" }).click();
    await expect(createDialog).not.toBeVisible({ timeout: 10_000 });

    // Open the detail modal by clicking the first cell of the invitation row
    const table = page.getByRole("grid", {
      name: "Tabla de invitaciones",
      exact: true,
    });
    await expect(table).toContainText("E2E Token Actions Test", {
      timeout: 10_000,
    });

    const row = table
      .locator("tr")
      .filter({ hasText: "E2E Token Actions Test" })
      .first();
    await row.locator("td").first().click();

    // Detail modal should open
    const detailModal = page.getByRole("dialog");
    await expect(detailModal).toBeVisible({ timeout: 10_000 });
    await expect(detailModal).toContainText("E2E Token Actions Test");

    // The TokensTable shows with a "Create Token" button — create a token first
    const tokenTable = page.getByRole("grid", {
      name: "Invitation tokens table",
    });

    // If no tokens yet, create one
    const createTokenButton = detailModal.getByRole("button", {
      name: "Create Token",
    });
    await expect(createTokenButton).toBeVisible({ timeout: 5_000 });
    await createTokenButton.click();

    // Wait for the token row to appear
    await expect(tokenTable.locator("tr").nth(1)).toBeVisible({
      timeout: 10_000,
    });

    // The actions cell is the last TableCell in the first data row.
    // Button order in the actions cell: [Open (ExternalLink), Revoke (Ban), Delete (Trash2)]
    const firstTokenRow = tokenTable.locator("tr").nth(1);
    const actionsCell = firstTokenRow.locator("td").last();

    // Click the Revoke button (second button, index 1)
    await actionsCell.locator("button").nth(1).click();

    // After revocation the second button should become the Reactivate button.
    // The Revoke button (Ban icon, warning color) is replaced by Reactivate (RotateCcw, success color).
    // We verify by checking the Open button is now disabled (token is inactive).
    await expect(actionsCell.locator("button").first()).toBeDisabled({
      timeout: 5_000,
    });

    // Click the Reactivate button (still at index 1)
    await actionsCell.locator("button").nth(1).click();

    // After reactivation the Open button should be enabled again
    await expect(actionsCell.locator("button").first()).toBeEnabled({
      timeout: 5_000,
    });
  });
});
