import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { createJobSchema } from "@/lib/validators/job";
import { Prisma } from "@prisma/client";
import { sendJobAlertDigest } from "@/lib/email";

const JOBS_PER_PAGE = 20;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const subject = searchParams.get("subject") || "";
    const board = searchParams.get("board") || "";
    const location = searchParams.get("location") || "";
    const gradeLevel = searchParams.get("gradeLevel") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || String(JOBS_PER_PAGE))));

    const where: Prisma.JobPostingWhereInput = { status: "ACTIVE" as any };

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
      // Use AND to avoid overwriting the OR clause set by search above
      where.AND = [
        ...((where.AND as any[]) || []),
        { school: { city: { equals: location, mode: "insensitive" } } },
      ];
    }
    if (gradeLevel) where.gradeLevel = gradeLevel;

    const total = await prisma.jobPosting.count({ where });
    const jobs = await prisma.jobPosting.findMany({
      where,
      select: {
        id: true, title: true, subject: true, board: true, gradeLevel: true,
        jobType: true, experience: true, salaryMin: true, salaryMax: true,
        postedAt: true, status: true,
        school: { select: { schoolName: true, city: true, verified: true, logoUrl: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { postedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

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
    const parsed = createJobSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0]?.message }, { status: 400 });
    }

    // Get school profile
    const school = await prisma.schoolProfile.findUnique({ where: { userId: auth.user.id } });
    if (!school) {
      return NextResponse.json({ success: false, error: "Please complete your school profile first" }, { status: 400 });
    }

    const { requirements, benefits, ...jobData } = parsed.data;

    const job = await prisma.$transaction(async (tx: any) => {
      const created = await tx.jobPosting.create({
        data: {
          ...jobData,
          schoolId: school.id,
          postedBy: auth.user.id,
          status: "ACTIVE" as any,
        },
      });

      if (requirements?.length) {
        await tx.jobRequirement.createMany({
          data: requirements.map((text, i) => ({ jobId: created.id, text, sortOrder: i })),
        });
      }
      if (benefits?.length) {
        await tx.jobBenefit.createMany({
          data: benefits.map((text, i) => ({ jobId: created.id, text, sortOrder: i })),
        });
      }

      return created;
    });

    // Trigger immediate alerts in background (non-blocking)
    (async () => {
      try {
        // Find all IMMEDIATE alerts
        const immediateAlerts = await prisma.jobAlert.findMany({
          where: { frequency: "IMMEDIATE", isActive: true },
          include: { user: true },
        });

        for (const alert of immediateAlerts) {
          // Check if job matches all alert criteria
          if (alert.subject && alert.subject !== job.subject) continue;
          if (alert.city && alert.city !== school.city) continue;
          if (alert.board && alert.board !== job.board) continue;
          if (alert.gradeLevel && alert.gradeLevel !== job.gradeLevel) continue;
          if (alert.jobType && alert.jobType !== job.jobType) continue;
          if (alert.salaryMin && job.salaryMax && job.salaryMax < alert.salaryMin) continue;
          if (alert.salaryMax && job.salaryMin && job.salaryMin > alert.salaryMax) continue;

          // Send immediate alert email
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

          // Log to AlertHistory
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

    return NextResponse.json({ success: true, data: { id: job.id } }, { status: 201 });
  } catch (error) {
    console.error("POST /api/jobs error:", error);
    return NextResponse.json({ success: false, error: "Failed to create job" }, { status: 500 });
  }
}
