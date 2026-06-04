-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'GROWTH', 'PRO');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED');

-- CreateEnum
CREATE TYPE "TeacherPlan" AS ENUM ('FREE', 'PRO');

-- CreateEnum
CREATE TYPE "ManagedRequestStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'ANNUAL');

-- CreateTable
CREATE TABLE "school_subscriptions" (
    "id" UUID NOT NULL,
    "school_user_id" UUID NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "current_period_start" TIMESTAMPTZ NOT NULL,
    "current_period_end" TIMESTAMPTZ NOT NULL,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "razorpay_sub_id" TEXT,
    "razorpay_customer_id" TEXT,
    "posts_used_this_cycle" INTEGER NOT NULL DEFAULT 0,
    "cycle_reset_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "school_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_subscriptions" (
    "id" UUID NOT NULL,
    "teacher_user_id" UUID NOT NULL,
    "plan" "TeacherPlan" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "current_period_start" TIMESTAMPTZ NOT NULL,
    "current_period_end" TIMESTAMPTZ NOT NULL,
    "razorpay_sub_id" TEXT,
    "razorpay_customer_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "teacher_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "managed_recruitment_requests" (
    "id" UUID NOT NULL,
    "school_user_id" UUID,
    "status" "ManagedRequestStatus" NOT NULL DEFAULT 'PENDING',
    "contact_name" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL,
    "contact_phone" TEXT NOT NULL,
    "school_name" TEXT NOT NULL,
    "job_title" TEXT NOT NULL,
    "job_description" TEXT NOT NULL,
    "requirements_text" TEXT,
    "salary_budget_min" INTEGER,
    "salary_budget_max" INTEGER,
    "target_join_date" TIMESTAMPTZ,
    "candidates_presented" INTEGER NOT NULL DEFAULT 0,
    "confirmed_hire_at" TIMESTAMPTZ,
    "invoice_amount" INTEGER NOT NULL DEFAULT 10000,
    "paid_at" TIMESTAMPTZ,
    "admin_notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "managed_recruitment_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "school_subscriptions_school_user_id_key" ON "school_subscriptions"("school_user_id");

-- CreateIndex
CREATE INDEX "school_subscriptions_school_user_id_idx" ON "school_subscriptions"("school_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_subscriptions_teacher_user_id_key" ON "teacher_subscriptions"("teacher_user_id");

-- CreateIndex
CREATE INDEX "teacher_subscriptions_teacher_user_id_idx" ON "teacher_subscriptions"("teacher_user_id");

-- CreateIndex
CREATE INDEX "managed_recruitment_requests_status_created_at_idx" ON "managed_recruitment_requests"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "managed_recruitment_requests_contact_email_idx" ON "managed_recruitment_requests"("contact_email");

-- AddForeignKey
ALTER TABLE "school_subscriptions" ADD CONSTRAINT "school_subscriptions_school_user_id_fkey" FOREIGN KEY ("school_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_subscriptions" ADD CONSTRAINT "teacher_subscriptions_teacher_user_id_fkey" FOREIGN KEY ("teacher_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "managed_recruitment_requests" ADD CONSTRAINT "managed_recruitment_requests_school_user_id_fkey" FOREIGN KEY ("school_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
