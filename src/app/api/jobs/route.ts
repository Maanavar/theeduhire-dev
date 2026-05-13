import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { createJobSchema } from "@/lib/validators/job";
import { Prisma } from "@prisma/client";
import { sendJobAlertDigest } from "@/lib/email";
import { publishDomainEvent } from "@/lib/domain-events";
import { sanitizePlainText } from "@/lib/sanitize";
import { isPrismaMissingColumnError } from "@/lib/prisma-errors";
import { cacheTags } from "@/lib/cache-tags";

const JOBS_PER_PAGE = 20;

type SortKey = "latest" | "salary_high" | "salary_low";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const now = new Date();
    const search = searchParams.get("search")?.trim() || "";
    const subject = searchParams.get("subject") || "";
    const board = searchParams.get("board") || "";
    const location = searchParams.get("location") || "";
    const gradeLevel = searchParams.get("gradeLevel") || "";
    const experienceLevel = searchParams.get("experienceLevel") || "";
    const urgentOnly = searchParams.get("urgent") === "true";
    const sort = (searchParams.get("sort") as SortKey) || "latest";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || String(JOBS_PER_PAGE))));

    await prisma.jobPosting.updateMany({
      where: {
        status: "ACTIVE" as any,
        expiresAt: { lt: now },
      },
      data: {
        status: "EXPIRED" as any,
      },
    });

    await prisma.jobPosting.updateMany({
      where: {
        status: "ACTIVE" as any,
        applicationDeadline: { lt: now },
      },
      data: {
        status: "CLOSED" as any,
      },
    });

    const where: Prisma.JobPostingWhereInput = {
      status: "ACTIVE" as any,
      isHidden: false,
      AND: [
        {
          OR: [{ applicationDeadline: null }, { applicationDeadline: { gt: now } }],
        },
        {
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        {
          school: { user: { isSuspended: false } },
        },
      ],
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { school: { OR: [{ schoolName: { contains: search, mode: "insensitive" } }, { city: { contains: search, mode: "insensitive" } }] } },
      ];
    }
    if (subject) where.subject = { equals: subject, mode: "insensitive" };
    if (board) where.board = board as any;
    if (location) {
      where.AND = [
        ...((where.AND as any[]) || []),
        { school: { city: { equals: location, mode: "insensitive" } } },
      ];
    }
    if (gradeLevel) where.gradeLevel = gradeLevel;
    if (experienceLevel) where.experienceLevel = experienceLevel as any;
    if (urgentOnly) where.isUrgent = true;

    const orderBy =
      sort === "salary_high"
        ? [{ salaryMax: "desc" as const }, { postedAt: "desc" as const }]
        : sort === "salary_low"
          ? [{ salaryMin: "asc" as const }, { postedAt: "desc" as const }]
          : [{ postedAt: "desc" as const }];

    let total = 0;
    let jobs: any[] = [];

    try {
      total = await prisma.jobPosting.count({ where });
      jobs = await prisma.jobPosting.findMany({
        where,
        select: {
          id: true, title: true, subject: true, board: true, gradeLevel: true,
          jobType: true, experience: true, experienceLevel: true, salaryMin: true, salaryMax: true, isUrgent: true, requiredWithin48h: true, requiresTet: true,
          postedAt: true, status: true, applicationDeadline: true,
          school: { select: { schoolName: true, city: true, verified: true, logoUrl: true } },
          _count: { select: { applications: true } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      });
    } catch (error) {
      if (!isPrismaMissingColumnError(error, "experience_level")) {
        throw error;
      }

      const legacyWhere = { ...where };
      delete (legacyWhere as any).experienceLevel;

      total = await prisma.jobPosting.count({ where: legacyWhere });
      jobs = await prisma.jobPosting.findMany({
        where: legacyWhere,
        select: {
          id: true, title: true, subject: true, board: true, gradeLevel: true,
          jobType: true, experience: true, salaryMin: true, salaryMax: true, isUrgent: true, requiredWithin48h: true, requiresTet: true,
          postedAt: true, status: true, applicationDeadline: true,
          school: { select: { schoolName: true, city: true, verified: true, logoUrl: true } },
          _count: { select: { applications: true } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      });
    }

    return NextResponse.json({ success: true, data: jobs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("GET /api/jobs error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch jobs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(["SCHOOL_ADMIN", "ADMIN"]);
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const requestedStatus = body?.status === "DRAFT" || body?.status === "ACTIVE" ? body.status : "ACTIVE";
    const jobPayload = { ...(body || {}) };
    delete jobPayload.status;
    const parsed = createJobSchema.safeParse(jobPayload);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0]?.message }, { status: 400 });
    }

    const requestedSchoolId = typeof body?.schoolId === "string" ? body.schoolId.trim() : "";
    const school =
      auth.user.role === "ADMIN"
        ? requestedSchoolId
          ? await prisma.schoolProfile.findUnique({
              where: { id: requestedSchoolId },
              select: { id: true, userId: true, city: true, schoolName: true, verificationStatus: true },
            })
          : null
        : await prisma.schoolProfile.findUnique({
            where: { userId: auth.user.id },
            select: { id: true, userId: true, city: true, schoolName: true, verificationStatus: true },
          });

    if (!school) {
      const error =
        auth.user.role === "ADMIN"
          ? "schoolId is required for admin job creation and must reference an existing school"
          : "Please complete your school profile first";
      return NextResponse.json({ success: false, error }, { status: 400 });
    }

    if (auth.user.role !== "ADMIN" && school.verificationStatus !== "VERIFIED") {
      return NextResponse.json(
        { success: false, error: "Only verified schools can post jobs. Please complete verification first." },
        { status: 403 }
      );
    }

    const { requirements, benefits, screeningQuestions, ...jobData } = parsed.data;
    const sanitizedJobData = {
      ...jobData,
      title: sanitizePlainText(jobData.title),
      subject: sanitizePlainText(jobData.subject),
      gradeLevel: sanitizePlainText(jobData.gradeLevel),
      description: sanitizePlainText(jobData.description),
      experience: jobData.experience ? sanitizePlainText(jobData.experience) : jobData.experience,
    };
    const postedBy = auth.user.role === "ADMIN" ? school.userId : auth.user.id;

    const job = await prisma.$transaction(async (tx: any) => {
      const created = await tx.jobPosting.create({
        data: {
          ...sanitizedJobData,
          schoolId: school.id,
          postedBy,
          status: requestedStatus as any,
        },
      });

      if (requirements?.length) {
        await tx.jobRequirement.createMany({
          data: requirements.map((text: string, i: number) => ({ jobId: created.id, text: sanitizePlainText(text), sortOrder: i })),
        });
      }
      if (benefits?.length) {
        await tx.jobBenefit.createMany({
          data: benefits.map((text: string, i: number) => ({ jobId: created.id, text: sanitizePlainText(text), sortOrder: i })),
        });
      }
      if (screeningQuestions?.length) {
        await tx.screeningQuestion.createMany({
          data: screeningQuestions.map((item: { question: string; required?: boolean; sortOrder?: number }, i: number) => ({
            jobId: created.id,
            question: sanitizePlainText(item.question),
            required: item.required ?? false,
            sortOrder: item.sortOrder ?? i,
          })),
        });
      }

      if (requestedStatus === "ACTIVE") {
        await publishDomainEvent(tx, {
          eventType: "job_posted",
          aggregateType: "job",
          aggregateId: created.id,
          actorId: auth.user.id,
          payload: {
            jobId: created.id,
            schoolId: school.id,
            postedBy,
            status: requestedStatus,
          },
          metadata: {
            source: "api.jobs.post",
          },
        });
      }

      return created;
    });

    if (requestedStatus === "ACTIVE") (async () => {
      try {
        const immediateAlerts = await prisma.jobAlert.findMany({
          where: { frequency: "IMMEDIATE", isActive: true },
          include: { user: true },
        });

        for (const alert of immediateAlerts) {
          if (alert.subject && alert.subject !== job.subject) continue;
          if (alert.city && alert.city !== school.city) continue;
          if (alert.board && alert.board !== job.board) continue;
          if (alert.gradeLevel && alert.gradeLevel !== job.gradeLevel) continue;
          if (alert.jobType && alert.jobType !== job.jobType) continue;
          if (alert.salaryMin && job.salaryMax && job.salaryMax < alert.salaryMin) continue;
          if (alert.salaryMax && job.salaryMin && job.salaryMin > alert.salaryMax) continue;

          await sendJobAlertDigest({
            teacherEmail: alert.user.email,
            alertName: alert.name,
            jobs: [
              {
                id: job.id,
                title: job.title,
                subject: job.subject,
                city: school.city,
                schoolName: school.schoolName,
                salaryMin: job.salaryMin || undefined,
                salaryMax: job.salaryMax || undefined,
                description: job.description,
              },
            ],
            frequency: "IMMEDIATE",
          });

          await prisma.alertHistory.create({
            data: {
              alertId: alert.id,
              jobIds: [job.id],
            },
          });
        }
      } catch (error) {
        console.error("Failed to trigger immediate alerts:", error);
      }
    })();

    revalidateTag(cacheTags.homepageStats);
    revalidateTag(cacheTags.schoolAnalytics(school.id));

    return NextResponse.json({ success: true, data: { id: job.id } }, { status: 201 });
  } catch (error) {
    console.error("POST /api/jobs error:", error);
    return NextResponse.json({ success: false, error: "Failed to create job" }, { status: 500 });
  }
}
