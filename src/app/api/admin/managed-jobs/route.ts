import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/admin-audit";

const db = prisma as any;

export async function GET(req: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = 25;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const jobId = searchParams.get("jobId"); // get a single job with its applicants

    if (jobId) {
      const job = await db.jobPosting.findFirst({
        where: { id: jobId, school: { isOfflineManaged: true } },
        select: {
          id: true,
          title: true,
          subject: true,
          board: true,
          gradeLevel: true,
          jobType: true,
          status: true,
          salaryMin: true,
          salaryMax: true,
          description: true,
          postedAt: true,
          school: {
            select: {
              id: true,
              schoolName: true,
              city: true,
              board: true,
              offlineContactName: true,
              offlineContactPhone: true,
              offlineContactEmail: true,
            },
          },
          applications: {
            select: {
              id: true,
              status: true,
              createdAt: true,
              applicant: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  teacherProfile: {
                    select: {
                      city: true,
                      subjects: true,
                      qualification: true,
                      verificationStatus: true,
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: "desc" },
          },
          _count: { select: { applications: true } },
        },
      });
      if (!job) return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
      return NextResponse.json({ success: true, data: job });
    }

    const schoolId = searchParams.get("schoolId");
    const where: any = { school: { isOfflineManaged: true } };
    if (schoolId) where.schoolId = schoolId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
        { school: { schoolName: { contains: search, mode: "insensitive" } } },
      ];
    }
    if (status) where.status = status;

    const [jobs, total] = await Promise.all([
      db.jobPosting.findMany({
        where,
        select: {
          id: true,
          title: true,
          subject: true,
          board: true,
          gradeLevel: true,
          jobType: true,
          status: true,
          salaryMin: true,
          salaryMax: true,
          postedAt: true,
          school: {
            select: {
              id: true,
              schoolName: true,
              city: true,
              offlineContactName: true,
              offlineContactPhone: true,
            },
          },
          _count: { select: { applications: true } },
        },
        orderBy: { postedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.jobPosting.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: jobs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("GET /api/admin/managed-jobs error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch managed jobs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  try {
    const body = await req.json();
    const {
      offlineSchoolId, title, subject, board, gradeLevel, jobType,
      description, salaryMin, salaryMax, experience, isUrgent, applicationDeadline,
    } = body;

    if (!offlineSchoolId || !title?.trim() || !subject?.trim() || !board || !gradeLevel?.trim() || !description?.trim()) {
      return NextResponse.json({ success: false, error: "offlineSchoolId, title, subject, board, gradeLevel and description are required" }, { status: 400 });
    }

    const school = await db.schoolProfile.findUnique({
      where: { id: offlineSchoolId, isOfflineManaged: true },
      select: { id: true, userId: true, schoolName: true },
    });
    if (!school) return NextResponse.json({ success: false, error: "Offline school not found" }, { status: 404 });

    const job = await db.jobPosting.create({
      data: {
        schoolId: offlineSchoolId,
        postedBy: school.userId,
        title: title.trim(),
        subject: subject.trim(),
        board,
        gradeLevel: gradeLevel.trim(),
        jobType: jobType || "FULL_TIME",
        description: description.trim(),
        salaryMin: salaryMin ? Number(salaryMin) : null,
        salaryMax: salaryMax ? Number(salaryMax) : null,
        experience: experience?.trim() || null,
        isUrgent: Boolean(isUrgent),
        applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
        status: "ACTIVE",
      },
    });

    await logAdminAction({
      adminId: auth.user.id,
      action: "managed_job.create",
      entityType: "managed_job",
      entityId: job.id,
      entityLabel: `${title.trim()} @ ${school.schoolName}`,
    });

    return NextResponse.json({ success: true, data: { id: job.id } }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/managed-jobs error:", error);
    return NextResponse.json({ success: false, error: "Failed to create managed job" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  try {
    const body = await req.json();
    const { jobId, action, applicationId, applicationStatus, ...fields } = body;

    if (!jobId) return NextResponse.json({ success: false, error: "jobId required" }, { status: 400 });

    const job = await db.jobPosting.findFirst({
      where: { id: jobId, school: { isOfflineManaged: true } },
      select: { id: true, title: true, school: { select: { schoolName: true } } },
    });
    if (!job) return NextResponse.json({ success: false, error: "Managed job not found" }, { status: 404 });

    // Update applicant status
    if (action === "update-applicant" && applicationId && applicationStatus) {
      await db.application.update({
        where: { id: applicationId },
        data: { status: applicationStatus, updatedAt: new Date() },
      });
      await logAdminAction({
        adminId: auth.user.id,
        action: "managed_job.status_change",
        entityType: "managed_job",
        entityId: jobId,
        entityLabel: job.title,
        notes: `Application ${applicationId} → ${applicationStatus}`,
      });
      return NextResponse.json({ success: true });
    }

    // Update job fields
    const updateData: Record<string, unknown> = {};
    if (fields.title?.trim()) updateData.title = fields.title.trim();
    if (fields.subject?.trim()) updateData.subject = fields.subject.trim();
    if (fields.board) updateData.board = fields.board;
    if (fields.gradeLevel?.trim()) updateData.gradeLevel = fields.gradeLevel.trim();
    if (fields.jobType) updateData.jobType = fields.jobType;
    if (fields.description?.trim()) updateData.description = fields.description.trim();
    if (fields.salaryMin !== undefined) updateData.salaryMin = fields.salaryMin ? Number(fields.salaryMin) : null;
    if (fields.salaryMax !== undefined) updateData.salaryMax = fields.salaryMax ? Number(fields.salaryMax) : null;
    if (fields.experience !== undefined) updateData.experience = fields.experience?.trim() || null;
    if (fields.isUrgent !== undefined) updateData.isUrgent = Boolean(fields.isUrgent);
    if (fields.status) updateData.status = fields.status;
    if (fields.applicationDeadline !== undefined) updateData.applicationDeadline = fields.applicationDeadline ? new Date(fields.applicationDeadline) : null;

    await db.jobPosting.update({ where: { id: jobId }, data: updateData });

    await logAdminAction({
      adminId: auth.user.id,
      action: "managed_job.edit",
      entityType: "managed_job",
      entityId: jobId,
      entityLabel: (updateData.title as string) ?? job.title,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/admin/managed-jobs error:", error);
    return NextResponse.json({ success: false, error: "Failed to update managed job" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");
    if (!jobId) return NextResponse.json({ success: false, error: "jobId required" }, { status: 400 });

    const job = await db.jobPosting.findFirst({
      where: { id: jobId, school: { isOfflineManaged: true } },
      select: { id: true, title: true },
    });
    if (!job) return NextResponse.json({ success: false, error: "Managed job not found" }, { status: 404 });

    await db.jobPosting.delete({ where: { id: jobId } });

    await logAdminAction({
      adminId: auth.user.id,
      action: "managed_job.delete",
      entityType: "managed_job",
      entityId: jobId,
      entityLabel: job.title,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/managed-jobs error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete managed job" }, { status: 500 });
  }
}
