// GET /api/jobs/[id] — Full job detail
// PUT /api/jobs/[id] — Update job (auth required, owner only)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { updateJobSchema } from "@/lib/validators/job";
import { sanitizePlainText } from "@/lib/sanitize";
import { computeMatchScore } from "@/lib/ai-match";
import { checkRateLimit } from "@/lib/rate-limit";
import { JOB_POST_RATE_LIMIT_WINDOW_MS, JOB_POST_USER_LIMIT } from "@/config/constants";
import { getStoredMatchScores } from "@/lib/match-score-read-model";
import { canManageJob } from "@/lib/policies/job-policy";
import { getSchoolProfileIdForUser } from "@/lib/policies/application-policy";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();

    const job = await prisma.jobPosting.findUnique({
      where: { id },
      select: {
        id: true,
        schoolId: true,
        postedBy: true,
        title: true,
        subject: true,
        board: true,
        gradeLevel: true,
        jobType: true,
        experience: true,
        experienceLevel: true,
        salaryMin: true,
        salaryMax: true,
        isUrgent: true,
        requiredWithin48h: true,
        requiresTet: true,
        applicationDeadline: true,
        description: true,
        status: true,
        isHidden: true,
        postedAt: true,
        expiresAt: true,
        school: {
          select: {
            id: true,
            schoolName: true,
            city: true,
            board: true,
            address: true,
            website: true,
            about: true,
            logoUrl: true,
            verified: true,
            hasPfEsi: true,
            paymentTrackRecord: true,
            workingHours: true,
            udiseCode: true,
            isOfflineManaged: true,
            user: { select: { isSuspended: true } },
          },
        },
        requirements: {
          orderBy: { sortOrder: "asc" },
          select: { id: true, text: true, sortOrder: true },
        },
        benefits: {
          orderBy: { sortOrder: "asc" },
          select: { id: true, text: true, sortOrder: true },
        },
        screeningQuestions: {
          orderBy: { sortOrder: "asc" },
          select: { id: true, question: true, required: true, sortOrder: true },
        },
        _count: {
          select: { applications: true },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }
    const canBypassModeration = session?.user?.role === "ADMIN" || session?.user?.role === "SCHOOL_ADMIN";
    const schoolSuspended = job.school.user.isSuspended && !job.school.isOfflineManaged;
    if ((job.isHidden || schoolSuspended) && !canBypassModeration) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }
    if (
      job.status === "ACTIVE" &&
      job.expiresAt &&
      job.expiresAt.getTime() <= Date.now()
    ) {
      await prisma.jobPosting.updateMany({
        where: { id, status: "ACTIVE" as any },
        data: { status: "EXPIRED" as any },
      });
      (job as any).status = "EXPIRED";
    } else if (
      job.status === "ACTIVE" &&
      job.applicationDeadline &&
      job.applicationDeadline.getTime() <= Date.now()
    ) {
      await prisma.jobPosting.updateMany({
        where: { id, status: "ACTIVE" as any },
        data: { status: "CLOSED" as any },
      });
      (job as any).status = "CLOSED";
    }

    let isApplied = false;
    let isSaved = false;
    let matchInsights: { score: number; explanation: string; breakdown: any | null } | null = null;

    if (session?.user) {
      const userId = session.user.id;
      const [application, savedJob] = await Promise.all([
        prisma.application.findUnique({
          where: { jobId_applicantId: { jobId: id, applicantId: userId } },
          select: { id: true },
        }),
        prisma.savedJob.findUnique({
          where: { userId_jobId: { userId, jobId: id } },
          select: { id: true },
        }),
      ]);
      isApplied = !!application;
      isSaved = !!savedJob;

      if (session.user.role === "TEACHER") {
        const teacherProfile = await prisma.teacherProfile.findUnique({
          where: { userId },
        });

        if (teacherProfile) {
          const scoreMap = await getStoredMatchScores([id], [userId]);
          const stored = scoreMap.get(`${id}:${userId}`);
          if (stored) {
            matchInsights = {
              score: stored.score,
              explanation: stored.explanation,
              breakdown: stored.breakdown ?? null,
            };
          } else {
            const computed = computeMatchScore(teacherProfile, job as any);
            matchInsights = {
              score: computed.scorePercent,
              explanation: computed.explanation,
              breakdown: computed.breakdown,
            };
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...job,
        school: {
          ...job.school,
          user: undefined,
        },
        isApplied,
        isSaved,
        matchInsights,
      },
    });
  } catch (error) {
    console.error("GET /api/jobs/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch job details" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }
    if (session.user.role !== "SCHOOL_ADMIN" && session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
    }

    const rateLimit = await checkRateLimit({
      key: `jobs.edit:${session.user.id}`,
      action: "jobs.edit",
      actorKey: session.user.id,
      limit: JOB_POST_USER_LIMIT,
      windowMs: JOB_POST_RATE_LIMIT_WINDOW_MS,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many job edits. Please try again later." },
        { status: 429 }
      );
    }

    const job = await prisma.jobPosting.findUnique({
      where: { id },
      select: { postedBy: true, schoolId: true },
    });

    if (!job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }
    const schoolProfileId = session.user.role === "SCHOOL_ADMIN"
      ? await getSchoolProfileIdForUser(prisma, session.user.id)
      : null;
    const authorized = canManageJob(session.user, { postedBy: job.postedBy, schoolId: job.schoolId }, schoolProfileId);
    if (!authorized) {
      return NextResponse.json({ success: false, error: "Not authorized to edit this job" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateJobSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message },
        { status: 400 }
      );
    }

    const { requirements, benefits, screeningQuestions, ...jobData } = parsed.data;
    const sanitizedJobData = {
      ...jobData,
      ...(jobData.title !== undefined ? { title: sanitizePlainText(jobData.title) } : {}),
      ...(jobData.subject !== undefined ? { subject: sanitizePlainText(jobData.subject) } : {}),
      ...(jobData.gradeLevel !== undefined ? { gradeLevel: sanitizePlainText(jobData.gradeLevel) } : {}),
      ...(jobData.description !== undefined ? { description: sanitizePlainText(jobData.description) } : {}),
      ...(jobData.experience !== undefined && jobData.experience !== null
        ? { experience: sanitizePlainText(jobData.experience) }
        : {}),
    };

    const updated = await prisma.$transaction(async (tx: any) => {
      const updatedJob = await tx.jobPosting.update({
        where: { id },
        data: sanitizedJobData,
      });

      if (requirements !== undefined) {
        await tx.jobRequirement.deleteMany({ where: { jobId: id } });
        if (requirements.length > 0) {
          await tx.jobRequirement.createMany({
            data: requirements.map((text: string, i: number) => ({ jobId: id, text: sanitizePlainText(text), sortOrder: i })),
          });
        }
      }
      if (benefits !== undefined) {
        await tx.jobBenefit.deleteMany({ where: { jobId: id } });
        if (benefits.length > 0) {
          await tx.jobBenefit.createMany({
            data: benefits.map((text: string, i: number) => ({ jobId: id, text: sanitizePlainText(text), sortOrder: i })),
          });
        }
      }
      if (screeningQuestions !== undefined) {
        await tx.screeningQuestion.deleteMany({ where: { jobId: id } });
        if (screeningQuestions.length > 0) {
          await tx.screeningQuestion.createMany({
            data: screeningQuestions.map((item: { question: string; required?: boolean; sortOrder?: number }, i: number) => ({
              jobId: id,
              question: sanitizePlainText(item.question),
              required: item.required ?? false,
              sortOrder: item.sortOrder ?? i,
            })),
          });
        }
      }

      return updatedJob;
    });

    return NextResponse.json({ success: true, data: { id: updated.id } });
  } catch (error) {
    console.error("PUT /api/jobs/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update job" },
      { status: 500 }
    );
  }
}
