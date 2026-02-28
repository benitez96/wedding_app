import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * Seed spec — runs first (root-level file, discovered before subdirectories).
 *
 * Verifies that global-setup produced the required artifacts for the current
 * project tier before any other spec accesses credentials.json or the database.
 */
test.describe("Seed", () => {
  test("global setup artifacts are present and valid", async () => {
    const credentialsPath = path.join(
      process.cwd(),
      ".e2e-state",
      "credentials.json",
    );

    // credentials.json must exist (created by global-setup.ts)
    expect(
      fs.existsSync(credentialsPath),
      "credentials.json must exist — run global-setup first",
    ).toBe(true);

    const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf-8"));
    const tier = test.info().project.name as "free" | "basic" | "company";

    // Each tier entry must have the required fields
    expect(credentials[tier], `credentials entry for "${tier}" must exist`).toBeDefined();
    expect(credentials[tier].email, "email must be set").toBeTruthy();
    expect(credentials[tier].password, "password must be set").toBeTruthy();
    expect(
      credentials[tier].invitationToken,
      "invitationToken must be set",
    ).toBeTruthy();

    // COMPANY tier additionally requires an invite-link token
    if (tier === "company") {
      expect(
        credentials[tier].inviteLinkToken,
        "inviteLinkToken must be set for company tier",
      ).toBeTruthy();
    }
  });
});
