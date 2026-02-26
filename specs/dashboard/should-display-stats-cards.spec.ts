import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test("should display stats cards on the dashboard", async ({ page }) => {
    await page.goto("/backoffice/dashboard");

    await expect(
      page.getByRole("heading", { name: "Dashboard", level: 1 }),
    ).toBeVisible();

    // All four stat card labels must be present (values start at 0 for fresh users)
    await expect(page.getByText("Total Invitaciones")).toBeVisible();
    await expect(page.getByText("Han Respondido")).toBeVisible();
    await expect(page.getByText("Total Invitados")).toBeVisible();
    await expect(page.getByText("No Asistirán")).toBeVisible();

    // The "Total Invitados" card always shows "de X máx." — verify the label suffix
    await expect(page.getByText(/de \d+ máx\./)).toBeVisible();
  });
});
