import { prisma } from "@/lib/prisma";
import { enqueueJobMatchRefreshes, enqueueMatchScoreRefresh, enqueueTeacherMatchRefreshes } from "./match-score-jobs";
import { sendApplicationConfirmation, sendNewApplicationAlert, sendStatusUpdate } from "./email";
import { logError, logInfo } from "./logger";

type ConsumerRow = {
  id: string;
  consumer_name: string;
  attempts: number;
  event_id: string;
  event_type: string;
  payload: unknown;
};

async function claimConsumers(limit: number): Promise<ConsumerRow[]> {
  return prisma.$queryRaw<ConsumerRow[]>`
    WITH candidate AS (
      SELECT dec."id"
      FROM "domain_event_consumers" dec
      WHERE dec."status" = 'PENDING'
      ORDER BY dec."created_at" ASC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    )
    UPDATE "domain_event_consumers" AS dec
    SET
      "status" = 'RUNNING',
      "claimed_at" = NOW(),
      "updated_at" = NOW()
    FROM candidate
    JOIN "domain_events" de ON de."id" = (
      SELECT "event_id" FROM "domain_event_consumers" WHERE "id" = candidate."id"
    )
    WHERE dec."id" = candidate."id"
    RETURNING
      dec."id",
      dec."consumer_name",
      dec."attempts",
      dec."event_id",
      de."event_type",
      de."payload"
  `;
}

async function completeConsumer(id: string): Promise<void> {
  await prisma.$executeRaw`
    UPDATE "domain_event_consumers"
    SET
      "status" = 'COMPLETED',
      "processed_at" = NOW(),
      "updated_at" = NOW()
    WHERE "id" = ${id}::uuid
  `;
}

async function failConsumer(row: ConsumerRow, error: unknown): Promise<void> {
  const message = error instanceof Error ? error.message : "Unknown domain event processor error";
  const nextAttempts = row.attempts + 1;
  const exhausted = nextAttempts >= 5;
  await prisma.$executeRaw`
    UPDATE "domain_event_consumers"
    SET
      "status" = ${exhausted ? "FAILED" : "PENDING"},
      "attempts" = ${nextAttempts},
      "last_error" = ${message},
      "updated_at" = NOW()
    WHERE "id" = ${row.id}::uuid
  `;
}

async function processNotificationEvent(row: ConsumerRow): Promise<void> {
  const payload = row.payload as Record<string, unknown>;

  if (row.event_type === "application_created") {
    const applicationId = String(payload.applicationId || "");
    if (!applicationId) return;

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        applicant: { select: { email: true, name: true } },
        job: {
          include: {
            school: { select: { schoolName: true } },
            poster: { select: { email: true, name: true } },
          },
        },
      },
    });

    if (!application) return;

    await Promise.all([
      sendApplicationConfirmation({
        teacherEmail: application.applicant.email,
        teacherName: application.applicant.name,
        jobTitle: application.job.title,
        schoolName: application.job.school.schoolName,
        jobId: application.jobId,
      }),
      application.job.poster
        ? sendNewApplicationAlert({
            schoolEmail: application.job.poster.email,
            schoolName: application.job.school.schoolName,
            teacherName: application.applicant.name,
            jobTitle: application.job.title,
            jobId: application.jobId,
          })
        : Promise.resolve(),
    ]);
    return;
  }

  if (row.event_type === "application_status_changed") {
    const applicationId = String(payload.applicationId || "");
    if (!applicationId) return;

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        applicant: { select: { id: true, email: true, name: true } },
        job: {
          select: {
            id: true,
            title: true,
            school: { select: { schoolName: true } },
          },
        },
      },
    });

    if (!application) return;

    const status = String(payload.toStatus || application.status);

    await prisma.notification.create({
      data: {
        userId: application.applicant.id,
        type: "APPLICATION",
        title: `Application status: ${status.replaceAll("_", " ")}`,
        body: `${application.job.title} - ${application.job.school.schoolName}`,
        payload: {
          applicationId: application.id,
          jobId: application.job.id,
          status,
        },
      },
    });

    await sendStatusUpdate({
      teacherEmail: application.applicant.email,
      teacherName: application.applicant.name,
      jobTitle: application.job.title,
      schoolName: application.job.school.schoolName,
      newStatus: status,
      jobId: application.job.id,
    });
  }
}

async function processAiRefreshEvent(row: ConsumerRow): Promise<void> {
  const payload = row.payload as Record<string, unknown>;

  if (row.event_type === "application_created") {
    await enqueueMatchScoreRefresh(String(payload.jobId), String(payload.applicantId), "application_created");
    return;
  }

  if (row.event_type === "teacher_profile_updated") {
    await enqueueTeacherMatchRefreshes(String(payload.userId), "teacher_profile_updated");
    return;
  }

  if (row.event_type === "job_posted" || row.event_type === "job_updated") {
    await enqueueJobMatchRefreshes(String(payload.jobId), row.event_type);
  }
}

async function processConsumer(row: ConsumerRow): Promise<void> {
  if (row.consumer_name === "notifications") {
    await processNotificationEvent(row);
    return;
  }

  if (row.consumer_name === "ai_match_refresh") {
    await processAiRefreshEvent(row);
  }
}

export async function processDomainEventConsumers(limit = 25): Promise<{ processed: number; failed: number }> {
  const rows = await claimConsumers(limit);
  let processed = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      await processConsumer(row);
      await completeConsumer(row.id);
      logInfo("domain_event_consumer_completed", {
        consumerId: row.id,
        consumerName: row.consumer_name,
        eventType: row.event_type,
        eventId: row.event_id,
      });
      processed += 1;
    } catch (error) {
      await failConsumer(row, error);
      logError("domain_event_consumer_failed", {
        consumerId: row.id,
        consumerName: row.consumer_name,
        eventType: row.event_type,
        eventId: row.event_id,
        attempts: row.attempts,
        error,
      });
      failed += 1;
    }
  }

  return { processed, failed };
}
