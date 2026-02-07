-- DropIndex
DROP INDEX "section_configurations_eventId_key_key";

-- CreateIndex
CREATE INDEX "section_configurations_eventId_key_idx" ON "section_configurations"("eventId", "key");
