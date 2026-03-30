import { PrismaClient } from "../../app/generated/prisma/index.js";
import fs from "node:fs";
import path from "node:path";

import { E2E_STATE_DIR } from "../../playwright.config";

const CREDS_FILE = path.join(E2E_STATE_DIR, "credentials.json");

const TEST_EMAILS = [
  "e2e-free@test.local",
  "e2e-basic@test.local",
  "e2e-company@test.local",
];

export default async function globalTeardown() {
  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.TEST_DATABASE_URL } },
  });

  try {
    // Cascade deletes via Prisma schema (Subscription, Account, Session, Event, etc.)
    const result = await prisma.user.deleteMany({
      where: { email: { in: TEST_EMAILS } },
    });

    console.log(`[E2E Teardown] Deleted ${result.count} test user(s).`);
  } finally {
    await prisma.$disconnect();
  }

  // Clean up persisted state files
  for (const file of [
    CREDS_FILE,
    path.join(E2E_STATE_DIR, "auth-free.json"),
    path.join(E2E_STATE_DIR, "auth-basic.json"),
    path.join(E2E_STATE_DIR, "auth-company.json"),
  ]) {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  }

  console.log("[E2E Teardown] Cleaned up state files.");
}
