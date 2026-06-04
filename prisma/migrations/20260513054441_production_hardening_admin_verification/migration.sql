-- CreateEnum
CREATE TYPE "TeacherVerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');

-- AlterEnum
ALTER TYPE "SchoolVerificationStatus" ADD VALUE 'REJECTED';

-- AlterTable
ALTER TABLE "job_postings" ADD COLUMN     "hidden_at" TIMESTAMPTZ,
ADD COLUMN     "hidden_by_admin_id" UUID,
ADD COLUMN     "is_hidden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "moderation_notes" TEXT;

-- AlterTable
ALTER TABLE "school_profiles" ADD COLUMN     "verification_notes" TEXT,
ADD COLUMN     "verification_rejection_reason" TEXT,
ADD COLUMN     "verification_submitted_at" TIMESTAMPTZ,
ADD COLUMN     "verification_timestamp" TIMESTAMPTZ,
ADD COLUMN     "verified_by_admin_id" UUID;

-- AlterTable
ALTER TABLE "teacher_profiles" ADD COLUMN     "verification_notes" TEXT,
ADD COLUMN     "verification_rejection_reason" TEXT,
ADD COLUMN     "verification_status" "TeacherVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
ADD COLUMN     "verification_submitted_at" TIMESTAMPTZ,
ADD COLUMN     "verification_timestamp" TIMESTAMPTZ,
ADD COLUMN     "verified_by_admin_id" UUID;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_suspended" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "suspended_at" TIMESTAMPTZ,
ADD COLUMN     "suspended_by_admin_id" UUID,
ADD COLUMN     "suspended_until" TIMESTAMPTZ,
ADD COLUMN     "suspension_reason" TEXT;

-- CreateTable
CREATE TABLE "rate_limit_events" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor_key" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_limit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rate_limit_events_key_created_at_idx" ON "rate_limit_events"("key", "created_at" DESC);

-- CreateIndex
CREATE INDEX "rate_limit_events_action_created_at_idx" ON "rate_limit_events"("action", "created_at" DESC);

-- CreateIndex
CREATE INDEX "job_postings_is_hidden_idx" ON "job_postings"("is_hidden");

-- CreateIndex
CREATE INDEX "teacher_profiles_verification_status_idx" ON "teacher_profiles"("verification_status");
