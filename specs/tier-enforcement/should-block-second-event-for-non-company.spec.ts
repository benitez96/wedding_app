import { test, expect } from "@playwright/test";

test.describe("Tier Enforcement", () => {
  test("should only allow COMPANY tier to create multiple events", async ({
    page,
  }) => {
    const tier = test.info().project.name;

    await page.goto("/backoffice/dashboard");

    // The EventSwitcher sidebar (desktop) shows "Crear nuevo evento" button
    // only for COMPANY tier users (isCompany === true)
    const createEventBtn = page.getByRole("button", {
      name: "Crear nuevo evento",
    });

    if (tier === "company") {
      await expect(createEventBtn).toBeVisible();
    } else {
      // FREE / BASIC: no "Crear nuevo evento" button in the sidebar
      await expect(createEventBtn).not.toBeVisible();
    }
  });
});
