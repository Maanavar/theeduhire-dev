import { randomUUID } from "crypto";
import type { Prisma, PrismaClient } from "@prisma/client";

type DbClient = PrismaClient | Prisma.TransactionClient;

type BackgroundJobRow = {
  id: string;
  job_type: string;
  payload: unknown;
  attempts: number;
  max_attempts: number;
};

export interface EnqueueJobInput {
  jobType: string;
  payload: Record<string, unknown>;
  dedupeKey?: string;
  runAt?: Date;
  maxAttempts?: number;
}

export async function enqueueBackgroundJob(db: DbClient, input: EnqueueJobInput): Promise<void> {
  const dedupeKey = input.dedupeKey ?? null;
  await db.$executeRaw`
    INSERT INTO "background_jobs" (
      "id",
      "job_type",
      "status",
      "dedupe_key",
      "payload",
      "attempts",
      "max_attempts",
      "run_at",
      "created_at",
      "updated_at"
    )
    VALUES (
      ${randomUUID()}::uuid,
      ${input.jobType},
      'PENDING',
      ${dedupeKey},
      ${JSON.stringify(input.payload)}::jsonb,
      0,
      ${input.maxAttempts ?? 5},
      ${input.runAt ?? new Date()}::timestamptz,
      NOW(),
      NOW()
    )
    ON CONFLICT ("dedupe_key") DO NOTHING
  `;
}

export async function claimBackgroundJobs(db: DbClient, limit: number): Promise<BackgroundJobRow[]> {
  return db.$queryRaw<BackgroundJobRow[]>`
    WITH candidate AS (
      SELECT "id"
      FROM "background_jobs"
      WHERE "status" = 'PENDING'
        AND "run_at" <= NOW()
      ORDER BY "run_at" ASC, "created_at" ASC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    )
    UPDATE "background_jobs" AS j
    SET
      "status" = 'RUNNING',
      "claimed_at" = NOW(),
      "updated_at" = NOW()
    FROM candidate
    WHERE j."id" = candidate."id"
    RETURNING
      j."id",
      j."job_type",
      j."payload",
      j."attempts",
      j."max_attempts"
  `;
}

export async function completeBackgroundJob(db: DbClient, jobId: string): Promise<void> {
  await db.$executeRaw`
    UPDATE "background_jobs"
    SET
      "status" = 'COMPLETED',
      "completed_at" = NOW(),
      "updated_at" = NOW()
    WHERE "id" = ${jobId}::uuid
  `;
}

export async function failBackgroundJob(
  db: DbClient,
  job: { id: string; attempts: number; max_attempts: number },
  error: unknown
): Promise<void> {
  const message = error instanceof Error ? error.message : "Unknown background job error";
  const nextAttempts = job.attempts + 1;
  const exhausted = nextAttempts >= job.max_attempts;
  const retryDelayMinutes = Math.min(30, Math.max(1, nextAttempts * 2));
  const nextRunAt = new Date(Date.now() + retryDelayMinutes * 60 * 1000);

  await db.$executeRaw`
    UPDATE "background_jobs"
    SET
      "status" = ${exhausted ? "FAILED" : "PENDING"},
      "attempts" = ${nextAttempts},
      "run_at" = ${exhausted ? new Date() : nextRunAt}::timestamptz,
      "last_error" = ${message},
      "updated_at" = NOW()
    WHERE "id" = ${job.id}::uuid
  `;
}
