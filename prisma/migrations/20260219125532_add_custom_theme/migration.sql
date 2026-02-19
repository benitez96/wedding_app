/*
  Warnings:

  - The `customTheme` column on the `events` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "events" DROP COLUMN "customTheme",
ADD COLUMN     "customTheme" JSONB;
