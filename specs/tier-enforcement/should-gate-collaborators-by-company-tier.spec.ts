import { test, expect } from "@playwright/test";

test.describe("Tier Enforcement", () => {
  test("should gate collaborators page by company tier", async ({ page }) => {
    const tier = test.info().project.name;

    await page.goto("/backoffice/collaborators");

    // All tiers see the "Miembros" page heading (h1)
    await expect(
      page.getByRole("heading", { name: "Miembros", exact: true }),
    ).toBeVisible();

    if (tier === "company") {
      // COMPANY tier: full collaborators UI is accessible
      await expect(
        page.getByRole("heading", { name: "Links de Invitación" }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Miembros Actuales" }),
      ).toBeVisible();
    } else {
      // FREE / BASIC: upgrade prompt is shown
      await expect(
        page.getByText(
          "La funcionalidad de miembros está disponible en el plan Company.",
        ),
      ).toBeVisible();

      // No collaborator-management UI is shown
      await expect(
        page.getByRole("heading", { name: "Links de Invitación" }),
      ).not.toBeVisible();
    }
  });
});
