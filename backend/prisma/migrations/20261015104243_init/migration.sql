-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "previous_token_hash" TEXT,
    "rotated_at" TIMESTAMPTZ(3),
    "user_agent" VARCHAR(255),
    "ip_address" VARCHAR(64),
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "revoked_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" VARCHAR(2000) NOT NULL DEFAULT '',
    "color" VARCHAR(20) NOT NULL DEFAULT 'blue',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" VARCHAR(5000) NOT NULL DEFAULT '',
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "due_date" DATE NOT NULL,
    "completed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "projects_user_id_created_at_idx" ON "projects"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "projects_user_id_updated_at_idx" ON "projects"("user_id", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "tasks_project_id_status_idx" ON "tasks"("project_id", "status");

-- CreateIndex
CREATE INDEX "tasks_project_id_due_date_idx" ON "tasks"("project_id", "due_date");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Search ──────────────────────────────────────────────────────────────
-- Task search uses case-insensitive substring matching (ILIKE '%term%'),
-- which a B-tree index cannot serve. A trigram GIN index can.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX "tasks_title_trgm_idx" ON "tasks" USING GIN ("title" gin_trgm_ops);
CREATE INDEX "projects_name_trgm_idx" ON "projects" USING GIN ("name" gin_trgm_ops);

-- ── Integrity ───────────────────────────────────────────────────────────
-- Defence in depth: the API validates these too, but the database refuses
-- blank names/titles even if a future code path forgets.
ALTER TABLE "projects" ADD CONSTRAINT "projects_name_not_blank" CHECK (length(btrim("name")) > 0);
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_title_not_blank" CHECK (length(btrim("title")) > 0);
ALTER TABLE "users" ADD CONSTRAINT "users_email_lowercase" CHECK ("email" = lower("email"));
