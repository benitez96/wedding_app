-- CreateTable
CREATE TABLE "public"."rate_limit_attempts" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_limit_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rate_limit_blocks" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "blockedUntil" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,

    CONSTRAINT "rate_limit_blocks_pkey" PRIMARY KEY ("id")
);
