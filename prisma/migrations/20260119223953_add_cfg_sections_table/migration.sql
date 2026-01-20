-- CreateTable
CREATE TABLE "section_configurations" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "key" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL,
    "settings" JSONB,

    CONSTRAINT "section_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "section_configurations_key_key" ON "section_configurations"("key");

-- CreateIndex
CREATE UNIQUE INDEX "section_configurations_order_key" ON "section_configurations"("order");

-- CreateIndex
CREATE INDEX "section_configurations_order_idx" ON "section_configurations"("order");
