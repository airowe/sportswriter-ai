-- CreateTable
CREATE TABLE "ContentJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "result" JSONB,
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "scheduledFor" DATETIME,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "ContentJob_status_scheduledFor_idx" ON "ContentJob"("status", "scheduledFor");

-- CreateIndex
CREATE INDEX "ContentJob_scheduledFor_idx" ON "ContentJob"("scheduledFor");
