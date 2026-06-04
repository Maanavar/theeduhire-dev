-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('TEACHER', 'SCHOOL_ADMIN', 'ADMIN');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'VISITING_FACULTY');

-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('FRESHER', 'ONE_TO_TWO_YEARS', 'TWO_TO_FIVE_YEARS', 'FIVE_TO_TEN_YEARS', 'TEN_PLUS_YEARS');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'REVIEWED', 'SHORTLISTED', 'REJECTED', 'HIRED', 'INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED');

-- CreateEnum
CREATE TYPE "Board" AS ENUM ('CBSE', 'ICSE', 'STATE_BOARD', 'IB', 'CAMBRIDGE', 'OTHER');

-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('ACTIVELY_LOOKING', 'OPEN_TO_OFFERS', 'NOT_LOOKING', 'IMMEDIATE_JOINER', 'PART_TIME_ONLY', 'ONLINE_ONLY', 'EXAM_SEASON');

-- CreateEnum
CREATE TYPE "SchoolVerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED');

-- CreateEnum
CREATE TYPE "AlertFrequency" AS ENUM ('IMMEDIATE', 'DAILY_DIGEST', 'WEEKLY_DIGEST');

-- CreateEnum
CREATE TYPE "RejectionReason" AS ENUM ('OVERQUALIFIED', 'UNDERQUALIFIED', 'POSITION_FILLED', 'EXPERIENCE_MISMATCH', 'LOCATION_MISMATCH', 'SALARY_MISMATCH', 'OTHER');

-- CreateEnum
CREATE TYPE "InterviewType" AS ENUM ('VIDEO', 'PHONE', 'IN_PERSON');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('GENERAL', 'APPLICATION', 'INTERVIEW', 'MESSAGE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "SecurityEventType" AS ENUM ('SESSION_CREATED', 'SESSION_REVOKED', 'PASSWORD_CHANGED', 'TWO_FACTOR_BOOTSTRAP');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'TEACHER',
    "phone" TEXT,
    "whatsapp_number" TEXT,
    "whatsapp_optin" BOOLEAN NOT NULL DEFAULT false,
    "avatar_url" TEXT,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "hashed_password" TEXT,
    "reset_token" TEXT,
    "reset_token_expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "qualification" TEXT,
    "experience" TEXT,
    "current_school" TEXT,
    "city" TEXT,
    "bio" TEXT,
    "subjects" TEXT[],
    "preferred_boards" TEXT[],
    "preferred_grades" TEXT[],
    "expected_salary" INTEGER,
    "availability_status" "AvailabilityStatus" NOT NULL DEFAULT 'NOT_LOOKING',
    "preferred_job_types" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notice_period_days" INTEGER,
    "tet_status" TEXT,
    "teaching_mediums" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "demo_video_url" TEXT,
    "lesson_plan_url" TEXT,
    "pocso_acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "reference_check_done" BOOLEAN NOT NULL DEFAULT false,
    "code_of_conduct_signed" BOOLEAN NOT NULL DEFAULT false,
    "safety_badge_granted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "teacher_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiences" (
    "id" UUID NOT NULL,
    "teacher_profile_id" UUID NOT NULL,
    "school_name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "start_date" TIMESTAMPTZ NOT NULL,
    "end_date" TIMESTAMPTZ,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certifications" (
    "id" UUID NOT NULL,
    "teacher_profile_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "issued_by" TEXT NOT NULL,
    "issued_at" TIMESTAMPTZ NOT NULL,
    "expires_at" TIMESTAMPTZ,
    "credential_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "school_name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "board" "Board" NOT NULL,
    "address" TEXT,
    "website" TEXT,
    "about" TEXT,
    "logo_url" TEXT,
    "has_pf_esi" BOOLEAN NOT NULL DEFAULT false,
    "payment_track_record" TEXT,
    "working_hours" TEXT,
    "udise_code" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_status" "SchoolVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "school_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_postings" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "posted_by" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "board" "Board" NOT NULL,
    "grade_level" TEXT NOT NULL,
    "job_type" "JobType" NOT NULL DEFAULT 'FULL_TIME',
    "experience" TEXT,
    "experience_level" "ExperienceLevel",
    "salary_min" INTEGER,
    "salary_max" INTEGER,
    "is_urgent" BOOLEAN NOT NULL DEFAULT false,
    "required_within_48h" BOOLEAN NOT NULL DEFAULT false,
    "requires_tet" BOOLEAN NOT NULL DEFAULT false,
    "application_deadline" TIMESTAMPTZ,
    "description" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'ACTIVE',
    "posted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ,
    "views" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "job_postings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_requirements" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "job_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_benefits" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "job_benefits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "screening_questions" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "screening_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "applicant_id" UUID NOT NULL,
    "cover_letter" TEXT,
    "resume_id" UUID,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "school_notes" TEXT,
    "rejection_reason" "RejectionReason",
    "applied_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "screening_answers" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "question_snapshot" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "screening_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resumes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "is_generated" BOOLEAN NOT NULL DEFAULT false,
    "template" TEXT,
    "generated_data" JSONB,
    "uploaded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resumes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_jobs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "saved_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_alerts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT,
    "city" TEXT,
    "board" "Board",
    "grade_level" TEXT,
    "job_type" "JobType",
    "salary_min" INTEGER,
    "salary_max" INTEGER,
    "frequency" "AlertFrequency" NOT NULL DEFAULT 'DAILY_DIGEST',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "job_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_history" (
    "id" UUID NOT NULL,
    "alert_id" UUID NOT NULL,
    "job_ids" UUID[],
    "sent_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "opened_at" TIMESTAMP(3),
    "clicked_at" TIMESTAMP(3),

    CONSTRAINT "alert_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_status_history" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "from_status" "ApplicationStatus" NOT NULL,
    "to_status" "ApplicationStatus" NOT NULL,
    "changed_by" UUID NOT NULL,
    "changed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "rejection_reason" "RejectionReason",

    CONSTRAINT "application_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interviews" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "scheduled_at" TIMESTAMPTZ NOT NULL,
    "duration_mins" INTEGER NOT NULL DEFAULT 30,
    "type" "InterviewType" NOT NULL DEFAULT 'VIDEO',
    "meeting_link" TEXT,
    "location" TEXT,
    "status" "InterviewStatus" NOT NULL DEFAULT 'PENDING',
    "school_notes" TEXT,
    "teacher_notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "interviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_match_scores" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "applicant_id" UUID NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "breakdown" JSONB NOT NULL,
    "explanation" TEXT NOT NULL,
    "computed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_match_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "subject" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "last_message_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_participants" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "last_read_at" TIMESTAMPTZ,
    "archived_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'GENERAL',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "payload" JSONB,
    "read_at" TIMESTAMPTZ,
    "archived_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "last_active_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_events" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "event_type" "SecurityEventType" NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "domain_events" (
    "id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "aggregate_type" TEXT NOT NULL,
    "aggregate_id" TEXT NOT NULL,
    "actor_id" TEXT,
    "payload" JSONB NOT NULL,
    "metadata" JSONB,
    "occurred_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "domain_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_keys" (
    "id" UUID NOT NULL,
    "scope" TEXT NOT NULL,
    "actor_key" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "request_hash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "response_status" INTEGER,
    "response_body" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "completed_at" TIMESTAMPTZ,

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "domain_event_consumers" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "consumer_name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "claimed_at" TIMESTAMPTZ,
    "processed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "domain_event_consumers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "background_jobs" (
    "id" UUID NOT NULL,
    "job_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "dedupe_key" TEXT,
    "payload" JSONB NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "run_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimed_at" TIMESTAMPTZ,
    "last_error" TEXT,
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "background_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_profiles_user_id_key" ON "teacher_profiles"("user_id");

-- CreateIndex
CREATE INDEX "teacher_profiles_city_idx" ON "teacher_profiles"("city");

-- CreateIndex
CREATE INDEX "teacher_profiles_subjects_idx" ON "teacher_profiles"("subjects");

-- CreateIndex
CREATE INDEX "experiences_teacher_profile_id_idx" ON "experiences"("teacher_profile_id");

-- CreateIndex
CREATE INDEX "certifications_teacher_profile_id_idx" ON "certifications"("teacher_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "school_profiles_user_id_key" ON "school_profiles"("user_id");

-- CreateIndex
CREATE INDEX "school_profiles_city_idx" ON "school_profiles"("city");

-- CreateIndex
CREATE INDEX "school_profiles_board_idx" ON "school_profiles"("board");

-- CreateIndex
CREATE INDEX "school_profiles_verified_idx" ON "school_profiles"("verified");

-- CreateIndex
CREATE INDEX "school_profiles_verification_status_idx" ON "school_profiles"("verification_status");

-- CreateIndex
CREATE INDEX "job_postings_status_idx" ON "job_postings"("status");

-- CreateIndex
CREATE INDEX "job_postings_subject_idx" ON "job_postings"("subject");

-- CreateIndex
CREATE INDEX "job_postings_board_idx" ON "job_postings"("board");

-- CreateIndex
CREATE INDEX "job_postings_grade_level_idx" ON "job_postings"("grade_level");

-- CreateIndex
CREATE INDEX "job_postings_experience_level_idx" ON "job_postings"("experience_level");

-- CreateIndex
CREATE INDEX "job_postings_salary_min_salary_max_idx" ON "job_postings"("salary_min", "salary_max");

-- CreateIndex
CREATE INDEX "job_postings_application_deadline_idx" ON "job_postings"("application_deadline");

-- CreateIndex
CREATE INDEX "job_postings_posted_at_idx" ON "job_postings"("posted_at" DESC);

-- CreateIndex
CREATE INDEX "job_postings_school_id_idx" ON "job_postings"("school_id");

-- CreateIndex
CREATE INDEX "job_postings_status_posted_at_idx" ON "job_postings"("status", "posted_at" DESC);

-- CreateIndex
CREATE INDEX "job_requirements_job_id_idx" ON "job_requirements"("job_id");

-- CreateIndex
CREATE INDEX "job_benefits_job_id_idx" ON "job_benefits"("job_id");

-- CreateIndex
CREATE INDEX "screening_questions_job_id_idx" ON "screening_questions"("job_id");

-- CreateIndex
CREATE INDEX "applications_job_id_idx" ON "applications"("job_id");

-- CreateIndex
CREATE INDEX "applications_applicant_id_idx" ON "applications"("applicant_id");

-- CreateIndex
CREATE INDEX "applications_status_idx" ON "applications"("status");

-- CreateIndex
CREATE INDEX "applications_applied_at_idx" ON "applications"("applied_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "applications_job_id_applicant_id_key" ON "applications"("job_id", "applicant_id");

-- CreateIndex
CREATE INDEX "screening_answers_application_id_idx" ON "screening_answers"("application_id");

-- CreateIndex
CREATE INDEX "screening_answers_question_id_idx" ON "screening_answers"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "screening_answers_application_id_question_id_key" ON "screening_answers"("application_id", "question_id");

-- CreateIndex
CREATE INDEX "resumes_user_id_idx" ON "resumes"("user_id");

-- CreateIndex
CREATE INDEX "saved_jobs_user_id_idx" ON "saved_jobs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "saved_jobs_user_id_job_id_key" ON "saved_jobs"("user_id", "job_id");

-- CreateIndex
CREATE INDEX "job_alerts_user_id_idx" ON "job_alerts"("user_id");

-- CreateIndex
CREATE INDEX "job_alerts_is_active_idx" ON "job_alerts"("is_active");

-- CreateIndex
CREATE INDEX "alert_history_alert_id_idx" ON "alert_history"("alert_id");

-- CreateIndex
CREATE INDEX "alert_history_sent_at_idx" ON "alert_history"("sent_at" DESC);

-- CreateIndex
CREATE INDEX "application_status_history_application_id_idx" ON "application_status_history"("application_id");

-- CreateIndex
CREATE INDEX "application_status_history_changed_at_idx" ON "application_status_history"("changed_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "interviews_application_id_key" ON "interviews"("application_id");

-- CreateIndex
CREATE INDEX "interviews_scheduled_at_idx" ON "interviews"("scheduled_at");

-- CreateIndex
CREATE INDEX "ai_match_scores_job_id_score_idx" ON "ai_match_scores"("job_id", "score" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ai_match_scores_job_id_applicant_id_key" ON "ai_match_scores"("job_id", "applicant_id");

-- CreateIndex
CREATE INDEX "conversations_last_message_at_idx" ON "conversations"("last_message_at" DESC);

-- CreateIndex
CREATE INDEX "conversations_created_by_idx" ON "conversations"("created_by");

-- CreateIndex
CREATE INDEX "conversation_participants_user_id_archived_at_idx" ON "conversation_participants"("user_id", "archived_at");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_participants_conversation_id_user_id_key" ON "conversation_participants"("conversation_id", "user_id");

-- CreateIndex
CREATE INDEX "messages_conversation_id_created_at_idx" ON "messages"("conversation_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "messages_sender_id_created_at_idx" ON "messages"("sender_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "notifications_user_id_archived_at_read_at_created_at_idx" ON "notifications"("user_id", "archived_at", "read_at", "created_at" DESC);

-- CreateIndex
CREATE INDEX "notifications_user_id_type_created_at_idx" ON "notifications"("user_id", "type", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_session_token_key" ON "user_sessions"("session_token");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_revoked_at_last_active_at_idx" ON "user_sessions"("user_id", "revoked_at", "last_active_at" DESC);

-- CreateIndex
CREATE INDEX "security_events_user_id_created_at_idx" ON "security_events"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "security_events_event_type_created_at_idx" ON "security_events"("event_type", "created_at" DESC);

-- CreateIndex
CREATE INDEX "domain_events_aggregate_type_aggregate_id_occurred_at_idx" ON "domain_events"("aggregate_type", "aggregate_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "domain_events_event_type_occurred_at_idx" ON "domain_events"("event_type", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "idempotency_keys_scope_actor_key_created_at_idx" ON "idempotency_keys"("scope", "actor_key", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_keys_scope_actor_key_idempotency_key_key" ON "idempotency_keys"("scope", "actor_key", "idempotency_key");

-- CreateIndex
CREATE INDEX "domain_event_consumers_consumer_name_status_created_at_idx" ON "domain_event_consumers"("consumer_name", "status", "created_at" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "domain_event_consumers_event_id_consumer_name_key" ON "domain_event_consumers"("event_id", "consumer_name");

-- CreateIndex
CREATE UNIQUE INDEX "background_jobs_dedupe_key_key" ON "background_jobs"("dedupe_key");

-- CreateIndex
CREATE INDEX "background_jobs_job_type_status_run_at_idx" ON "background_jobs"("job_type", "status", "run_at" ASC);

-- AddForeignKey
ALTER TABLE "teacher_profiles" ADD CONSTRAINT "teacher_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiences" ADD CONSTRAINT "experiences_teacher_profile_id_fkey" FOREIGN KEY ("teacher_profile_id") REFERENCES "teacher_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_teacher_profile_id_fkey" FOREIGN KEY ("teacher_profile_id") REFERENCES "teacher_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_profiles" ADD CONSTRAINT "school_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "school_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_posted_by_fkey" FOREIGN KEY ("posted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_requirements" ADD CONSTRAINT "job_requirements_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_benefits" ADD CONSTRAINT "job_benefits_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screening_questions" ADD CONSTRAINT "screening_questions_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screening_answers" ADD CONSTRAINT "screening_answers_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screening_answers" ADD CONSTRAINT "screening_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "screening_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_alerts" ADD CONSTRAINT "job_alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_history" ADD CONSTRAINT "alert_history_alert_id_fkey" FOREIGN KEY ("alert_id") REFERENCES "job_alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_status_history" ADD CONSTRAINT "application_status_history_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_status_history" ADD CONSTRAINT "application_status_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_match_scores" ADD CONSTRAINT "ai_match_scores_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_match_scores" ADD CONSTRAINT "ai_match_scores_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domain_event_consumers" ADD CONSTRAINT "domain_event_consumers_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "domain_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

