-- CreateTable
CREATE TABLE "theme_settings" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "activeTheme" TEXT NOT NULL DEFAULT 'classic',

    CONSTRAINT "theme_settings_pkey" PRIMARY KEY ("id")
);
