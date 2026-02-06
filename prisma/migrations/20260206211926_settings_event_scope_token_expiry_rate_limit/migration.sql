/*
  Warnings:

  - A unique constraint covering the columns `[eventId,key]` on the table `configurations` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `eventId` to the `configurations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expiresAt` to the `invitation_tokens` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "configurations_key_key";

-- AlterTable
ALTER TABLE "configurations" ADD COLUMN     "eventId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "invitation_tokens" ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "configurations_eventId_idx" ON "configurations"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "configurations_eventId_key_key" ON "configurations"("eventId", "key");

-- AddForeignKey
ALTER TABLE "configurations" ADD CONSTRAINT "configurations_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
