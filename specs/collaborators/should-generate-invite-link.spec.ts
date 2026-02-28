import { test, expect } from "@playwright/test";

test.describe("Collaborators Management", () => {
  test("should generate an invite link for a collaborator", async ({
    page,
  }) => {
    const tier = test.info().project.name;
    if (tier !== "company") {
      test.skip(true, "Invite link generation is only available for COMPANY tier");
      return;
    }

    await page.goto("/backoffice/collaborators");

    // Links de Invitación section is visible for COMPANY tier
    await expect(
      page.getByRole("heading", { name: "Links de Invitación" }),
    ).toBeVisible();

    // Click "Generar Link" button in the InviteLinksSection header
    await page.getByRole("button", { name: "Generar Link" }).first().click();

    // InviteCollaboratorModal opens
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();
    await expect(
      modal.getByRole("heading", { name: "Invitar Colaborador" }),
    ).toBeVisible();

    // Click "Generar Link" inside the modal footer to create the link
    await modal.getByRole("button", { name: "Generar Link" }).click();

    // After generation, the modal shows the link in a Snippet component
    await expect(
      modal.getByText("Comparte este link"),
    ).toBeVisible({ timeout: 10_000 });

    // Close with "Listo"
    await modal.getByRole("button", { name: "Listo" }).click();
    await expect(modal).not.toBeVisible({ timeout: 5_000 });

    // The invite links table should now have at least one data row.
    // HeroUI Table renders as role="grid". Wait for it to be visible
    // (it replaces the empty-state message after the first link is created).
    const inviteLinksGrid = page.getByRole("grid", { name: "Links de invitación" });
    await expect(inviteLinksGrid).toBeVisible({ timeout: 10_000 });

    // The last row has an icon-only copy button in the action cell.
    // Clicking it transitions the Copy icon to a Check icon (text-success) for ~2 seconds.
    const lastRow = inviteLinksGrid.locator("tr").last();
    const copyBtn = lastRow.locator("button").first();
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();

    // After clicking, the icon changes to Check (rendered with text-success class)
    await expect(lastRow.locator("svg.text-success")).toBeVisible({
      timeout: 3_000,
    });
  });
});
