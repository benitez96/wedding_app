import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test("should show quick actions and allow exporting confirmed guests", async ({
    page,
  }) => {
    await page.goto("/backoffice/dashboard");

    await expect(
      page.getByRole("heading", { name: "Acciones Rápidas" }),
    ).toBeVisible();

    await expect(
      page.getByRole("link", { name: /Gestionar Invitaciones/ }),
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: "Exportar Confirmados" }),
    ).toBeVisible();

    await page.getByRole("link", { name: /Gestionar Invitaciones/ }).click();

    await expect(page).toHaveURL(/\/backoffice\/invitations/, {
      timeout: 10_000,
    });
  });
});
