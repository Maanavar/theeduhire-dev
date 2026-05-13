import { prisma } from "@/lib/prisma";
import { enqueueBackgroundJob } from "./background-jobs";
import { computeMatchScore } from "./ai-match";

export async function enqueueMatchScoreRefresh(jobId: string, applicantId: string, reason: string): Promise<void> {
  await enqueueBackgroundJob(prisma, {
    jobType: "ai_match_refresh",
    dedupeKey: `ai_match_refresh:${jobId}:${applicantId}`,
    payload: {
      jobId,
      applicantId,
      reason,
    },
    maxAttempts: 5,
  });
}

export async function enqueueTeacherMatchRefreshes(applicantId: string, reason: string): Promise<void> {
  const activeJobs = await prisma.jobPosting.findMany({
    where: { status: "ACTIVE" },
    select: { id: true },
  });

  for (const job of activeJobs) {
    await enqueueMatchScoreRefresh(job.id, applicantId, reason);
  }
}

export async function enqueueJobMatchRefreshes(jobId: string, reason: string): Promise<void> {
  const teachers = await prisma.teacherProfile.findMany({
    select: { userId: true },
  });

  for (const teacher of teachers) {
    await enqueueMatchScoreRefresh(jobId, teacher.userId, reason);
  }
}

export async function processMatchScoreRefreshJob(payload: unknown): Promise<void> {
  const data = payload as { jobId?: string; applicantId?: string };
  if (!data.jobId || !data.applicantId) {
    throw new Error("Invalid ai_match_refresh payload");
  }

  const [job, teacherProfile] = await Promise.all([
    prisma.jobPosting.findUnique({
      where: { id: data.jobId },
      include: { school: true },
    }),
    prisma.teacherProfile.findUnique({
      where: { userId: data.applicantId },
    }),
  ]);

  if (!job || !teacherProfile) {
    return;
  }

  const result = computeMatchScore(teacherProfile, job);

  await prisma.aIMatchScore.upsert({
    where: {
      jobId_applicantId: {
        jobId: data.jobId,
        applicantId: data.applicantId,
      },
    },
    update: {
      score: result.score,
      breakdown: result.breakdown as never,
      explanation: result.explanation,
      computedAt: new Date(),
    },
    create: {
      jobId: data.jobId,
      applicantId: data.applicantId,
      score: result.score,
      breakdown: result.breakdown as never,
      explanation: result.explanation,
    },
  });
}
