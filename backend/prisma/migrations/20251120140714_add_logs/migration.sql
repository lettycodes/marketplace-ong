-- CreateTable
CREATE TABLE "logs" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" VARCHAR(10) NOT NULL,
    "route" VARCHAR(255) NOT NULL,
    "status_code" INTEGER NOT NULL,
    "latency_ms" INTEGER NOT NULL,
    "user_id" TEXT,
    "organization_id" TEXT,
    "user_agent" TEXT,
    "ip_address" VARCHAR(45),
    "search_query" TEXT,
    "ai_filters" JSONB,
    "ai_success" BOOLEAN,
    "fallback_applied" BOOLEAN,

    CONSTRAINT "logs_pkey" PRIMARY KEY ("id")
);
