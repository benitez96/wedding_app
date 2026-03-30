import fs from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";

// No auth — visiting a join link as an unauthenticated user
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Collaborator Join Flow", () => {
  test("should display join page with event info for an unauthenticated user", async ({
    page,
  }) => {
    const credentialsPath = path.join(
      process.cwd(),
      ".e2e-state",
      "credentials.json",
    );
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf-8"));

    // The invite link is only created for the COMPANY tier in global-setup.
    // For free/basic, skip — they cannot have invite links.
    const tier = test.info().project.name;
    if (tier !== "company") {
      test.skip(true, "Invite links are only available for the COMPANY tier");
      return;
    }

    const { inviteLinkToken } = credentials.company;

    await page.goto(`/join/${inviteLinkToken}`);

    // JoinEventClient renders the card with the event name and auth buttons
    await expect(
      page.getByRole("heading", { name: "Invitación a colaborar" }),
    ).toBeVisible({ timeout: 10_000 });

    // The event name from global-setup is "E2E COMPANY Wedding"
    await expect(page.getByText("E2E COMPANY Wedding")).toBeVisible();

    // Unauthenticated user sees login + sign-up options
    await expect(
      page.getByRole("link", { name: /Iniciar sesión para aceptar/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Crear cuenta/i }),
    ).toBeVisible();
  });
});
