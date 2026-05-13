import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { applyJobSchema } from "@/lib/validators/application";
import {
  beginIdempotentRequest,
  completeIdempotentRequest,
  getIdempotencyKey,
  releaseIdempotentRequest,
  stableHash,
} from "@/lib/idempotency";
import { publishDomainEvent } from "@/lib/domain-events";
import { checkRateLimit } from "@/lib/rate-limit";
import { getTeacherApplyReadiness } from "@/lib/profileCompletion";
import { cacheTags } from "@/lib/cache-tags";

const APPLICATION_RATE_LIMIT = 10;
const APPLICATION_RATE_WINDOW_MS = 60 * 60 * 1000;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let idempotencyRecordId: string | null = null;

  try {
    const auth = await requireAuth(["TEACHER"]);
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { id: jobId } = await params;
    const body = await req.json();
    const parsed = applyJobSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0]?.message }, { status: 400 });
    }
    const rateLimit = await checkRateLimit({
      key: `jobs.apply:${auth.user.id}`,
      action: "jobs.apply",
      actorKey: auth.user.id,
      limit: APPLICATION_RATE_LIMIT,
      windowMs: APPLICATION_RATE_WINDOW_MS,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000)).toString(),
            "X-RateLimit-Limit": String(APPLICATION_RATE_LIMIT),
            "X-RateLimit-Remaining": String(rateLimit.remaining),
          },
        }
      );
    }

    if (parsed.data.resumeId) {
      const resume = await prisma.resume.findFirst({
        where: { id: parsed.data.resumeId, userId: auth.user.id },
        select: { id: true, userId: true },
      });

      if (!resume) {
        return NextResponse.json({ success: false, error: "You are not authorized to use this resume" }, { status: 403 });
      }
    }

    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: auth.user.id },
      include: {
        experiences: { select: { id: true } },
        certifications: { select: { id: true } },
      },
    });
    const resumes = await prisma.resume.findMany({
      where: { userId: auth.user.id },
      select: { id: true },
    });
    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { avatarUrl: true },
    });

    const readiness = getTeacherApplyReadiness({
      avatarUrl: user?.avatarUrl,
      bio: teacherProfile?.bio,
      qualification: teacherProfile?.qualification,
      experience: teacherProfile?.experience,
      city: teacherProfile?.city,
      subjects: teacherProfile?.subjects || [],
      preferredBoards: teacherProfile?.preferredBoards || [],
      preferredGrades: teacherProfile?.preferredGrades || [],
      experiences: teacherProfile?.experiences || [],
      certifications: teacherProfile?.certifications || [],
      resumes,
    });

    if (!readiness.ready) {
      return NextResponse.json(
        {
          success: false,
          error: readiness.blockers.join(" "),
        },
        { status: 400 }
      );
    }

    const requestHash = stableHash({
      jobId,
      coverLetter: parsed.data.coverLetter || null,
      resumeId: parsed.data.resumeId || null,
      screeningAnswers: parsed.data.screeningAnswers || [],
    });
    const idempotency = await beginIdempotentRequest(prisma, {
      scope: "jobs.apply",
      actorKey: auth.user.id,
      key: getIdempotencyKey(req.headers.get("idempotency-key"), requestHash),
      requestHash,
    });

    if (idempotency.kind === "replay") {
      return NextResponse.json(idempotency.responseBody, { status: idempotency.responseStatus });
    }

    if (idempotency.kind === "conflict") {
      return NextResponse.json({ success: false, error: idempotency.error }, { status: idempotency.status });
    }

    idempotencyRecordId = idempotency.recordId;

    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId },
      select: {
        id: true, status: true, title: true, applicationDeadline: true, expiresAt: true, isHidden: true,
        screeningQuestions: {
          orderBy: { sortOrder: "asc" },
          select: { id: true, question: true, required: true },
        },
        schoolId: true,
        school: { select: { schoolName: true } },
        poster: { select: { email: true, name: true } },
      },
    });

    if (!job) {
      const responseBody = { success: false, error: "Job not found" };
      await completeIdempotentRequest(prisma, idempotency.recordId, 404, responseBody);
      return NextResponse.json(responseBody, { status: 404 });
    }
    if (job.status !== "ACTIVE") {
      const responseBody = { success: false, error: "This job is no longer accepting applications" };
      await completeIdempotentRequest(prisma, idempotency.recordId, 400, responseBody);
      return NextResponse.json(responseBody, { status: 400 });
    }
    if (job.isHidden) {
      const responseBody = { success: false, error: "This job is currently unavailable" };
      await completeIdempotentRequest(prisma, idempotency.recordId, 400, responseBody);
      return NextResponse.json(responseBody, { status: 400 });
    }
    if (job.applicationDeadline && job.applicationDeadline.getTime() <= Date.now()) {
      await prisma.jobPosting.updateMany({
        where: { id: jobId, status: "ACTIVE" as any },
        data: { status: "CLOSED" as any },
      });
      const responseBody = { success: false, error: "Application deadline has passed for this job" };
      await completeIdempotentRequest(prisma, idempotency.recordId, 400, responseBody);
      return NextResponse.json(responseBody, { status: 400 });
    }
    if (job.expiresAt && job.expiresAt.getTime() <= Date.now()) {
      await prisma.jobPosting.updateMany({
        where: { id: jobId, status: "ACTIVE" as any },
        data: { status: "EXPIRED" as any },
      });
      const responseBody = { success: false, error: "This job has expired and is no longer accepting applications" };
      await completeIdempotentRequest(prisma, idempotency.recordId, 400, responseBody);
      return NextResponse.json(responseBody, { status: 400 });
    }

    const submittedAnswers = parsed.data.screeningAnswers || [];
    const submittedMap = new Map<string, string>();
    for (const item of submittedAnswers) {
      if (submittedMap.has(item.questionId)) {
        const responseBody = { success: false, error: "Duplicate answers submitted for screening questions" };
        await completeIdempotentRequest(prisma, idempotency.recordId, 400, responseBody);
        return NextResponse.json(responseBody, { status: 400 });
      }
      submittedMap.set(item.questionId, item.answer.trim());
    }

    const questionMap = new Map(job.screeningQuestions.map((q) => [q.id, q] as const));
    for (const questionId of submittedMap.keys()) {
      if (!questionMap.has(questionId)) {
        const responseBody = { success: false, error: "Invalid screening question submitted" };
        await completeIdempotentRequest(prisma, idempotency.recordId, 400, responseBody);
        return NextResponse.json(responseBody, { status: 400 });
      }
    }

    for (const question of job.screeningQuestions) {
      if (question.required && !submittedMap.get(question.id)?.trim()) {
        const responseBody = { success: false, error: "Please answer all required screening questions" };
        await completeIdempotentRequest(prisma, idempotency.recordId, 400, responseBody);
        return NextResponse.json(responseBody, { status: 400 });
      }
    }

    const existing = await prisma.application.findUnique({
      where: { jobId_applicantId: { jobId, applicantId: auth.user.id } },
    });
    if (existing) {
      const responseBody = { success: false, error: "You have already applied for this position" };
      await completeIdempotentRequest(prisma, idempotency.recordId, 409, responseBody);
      return NextResponse.json(responseBody, { status: 409 });
    }

    const application = await prisma.$transaction(async (tx: any) => {
      const createdApplication = await tx.application.create({
        data: {
          jobId,
          applicantId: auth.user.id,
          status: "PENDING",
          coverLetter: parsed.data.coverLetter || null,
          resumeId: parsed.data.resumeId || null,
          statusHistory: {
            create: {
              fromStatus: "PENDING",
              toStatus: "PENDING",
              changedBy: auth.user.id,
            },
          },
        },
      });

      if (submittedMap.size > 0) {
        await tx.screeningAnswer.createMany({
          data: Array.from(submittedMap.entries()).map(([questionId, answer]) => ({
            applicationId: createdApplication.id,
            questionId,
            questionSnapshot: questionMap.get(questionId)!.question,
            answer,
          })),
        });
      }

      await publishDomainEvent(tx, {
        eventType: "application_created",
        aggregateType: "application",
        aggregateId: createdApplication.id,
        actorId: auth.user.id,
        payload: {
          applicationId: createdApplication.id,
          jobId,
          applicantId: auth.user.id,
          status: "PENDING",
          resumeId: parsed.data.resumeId || null,
        },
        metadata: {
          source: "api.jobs.apply",
        },
      });

      return createdApplication;
    });

    const responseBody = { success: true, data: { id: application.id } };
    await completeIdempotentRequest(prisma, idempotency.recordId, 201, responseBody);
    revalidateTag(cacheTags.schoolAnalytics(job.schoolId));

    return NextResponse.json(responseBody, { status: 201 });
  } catch (error) {
    if (idempotencyRecordId) {
      await releaseIdempotentRequest(prisma, idempotencyRecordId);
    }
    console.error("POST /api/jobs/[id]/apply error:", error);
    return NextResponse.json({ success: false, error: "Failed to submit application" }, { status: 500 });
  }
}

