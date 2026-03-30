import { test, expect } from "@playwright/test";

const BADGE_LABELS: Record<string, string> = {
  free: "Gratis",
  basic: "Basic",
  company: "Company",
};

test.describe("Dashboard", () => {
  test("should show the correct tier badge in the sidebar", async ({
    page,
  }) => {
    await page.goto("/backoffice/dashboard");

    const tier = test.info().project.name;
    const expectedBadge = BADGE_LABELS[tier];

    await expect(page.getByText(expectedBadge, { exact: true })).toBeVisible();
  });
});
