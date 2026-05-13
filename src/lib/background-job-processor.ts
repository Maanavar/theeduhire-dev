import { prisma } from "@/lib/prisma";
import { claimBackgroundJobs, completeBackgroundJob, failBackgroundJob } from "./background-jobs";
import { processMatchScoreRefreshJob } from "./match-score-jobs";
import { logError, logInfo } from "./logger";

async function processJob(job: { job_type: string; payload: unknown }): Promise<void> {
  if (job.job_type === "ai_match_refresh") {
    await processMatchScoreRefreshJob(job.payload);
    return;
  }

  throw new Error(`Unsupported background job type: ${job.job_type}`);
}

export async function processBackgroundJobs(limit = 25): Promise<{ processed: number; failed: number }> {
  const jobs = await claimBackgroundJobs(prisma, limit);
  let processed = 0;
  let failed = 0;

  for (const job of jobs) {
    try {
      await processJob(job);
      await completeBackgroundJob(prisma, job.id);
      logInfo("background_job_completed", {
        jobId: job.id,
        jobType: job.job_type,
      });
      processed += 1;
    } catch (error) {
      await failBackgroundJob(prisma, job, error);
      logError("background_job_failed", {
        jobId: job.id,
        jobType: job.job_type,
        attempts: job.attempts,
        error,
      });
      failed += 1;
    }
  }

  return { processed, failed };
}
