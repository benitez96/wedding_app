import { test, expect } from "@playwright/test";

test.describe("Tier Enforcement", () => {
  test("should show or hide Members menu item based on tier", async ({
    page,
  }) => {
    const tier = test.info().project.name;

    await page.goto("/backoffice/dashboard");

    // The desktop NavigationSidebar has aria-label="Menú principal"
    const nav = page.getByRole("navigation", { name: "Menú principal" });
    await expect(nav).toBeVisible();

    if (tier === "company") {
      // COMPANY tier: "Miembros" link must be present in the sidebar navigation
      await expect(
        nav.getByRole("link", { name: "Miembros" }),
      ).toBeVisible();
    } else {
      // FREE / BASIC: "Miembros" link must NOT appear in the sidebar
      await expect(
        nav.getByRole("link", { name: "Miembros" }),
      ).not.toBeVisible();
    }
  });
});
