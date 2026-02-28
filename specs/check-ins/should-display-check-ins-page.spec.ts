import { test, expect } from "@playwright/test";

test.describe("Check-ins", () => {
  test("should display check-ins page with stats cards and empty list", async ({
    page,
  }) => {
    await page.goto("/backoffice/check-ins");

    await expect(
      page.getByRole("heading", { name: "Check-ins" }),
    ).toBeVisible();
    await expect(
      page.getByText("Registro de ingresos al evento"),
    ).toBeVisible();

    // 4 stat cards
    await expect(page.getByText("Invitados ingresados")).toBeVisible();
    await expect(page.getByText("Check-ins realizados")).toBeVisible();
    await expect(page.getByText(/Ocupación/)).toBeVisible();
    await expect(page.getByText("Excesos de capacidad")).toBeVisible();

    // Latest check-ins section heading
    await expect(
      page.getByRole("heading", { name: "Últimos Check-ins" }),
    ).toBeVisible();

    // Empty state — fresh test users have no check-ins yet
    await expect(
      page.getByText("Aún no hay check-ins registrados"),
    ).toBeVisible();
  });
});
