// GET /api/jobs/[id] — Full job detail
// PUT /api/jobs/[id] — Update job (auth required, owner only)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { createJobSchema } from "@/lib/validators/job";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();

    const job = await prisma.jobPosting.findUnique({
      where: { id },
      include: {
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

    let isApplied = false;
    let isSaved = false;

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
    }

    return NextResponse.json({
      success: true,
      data: {
        ...job,
        isApplied,
        isSaved,
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

    const job = await prisma.jobPosting.findUnique({
      where: { id },
      select: { postedBy: true },
    });

    if (!job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }
    if (job.postedBy !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Not authorized to edit this job" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createJobSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message },
        { status: 400 }
      );
    }

    const { requirements, benefits, ...jobData } = parsed.data;

    const updated = await prisma.$transaction(async (tx: any) => {
      const updatedJob = await tx.jobPosting.update({
        where: { id },
        data: jobData,
      });

      if (requirements !== undefined) {
        await tx.jobRequirement.deleteMany({ where: { jobId: id } });
        if (requirements.length > 0) {
          await tx.jobRequirement.createMany({
            data: requirements.map((text, i) => ({ jobId: id, text, sortOrder: i })),
          });
        }
      }
      if (benefits !== undefined) {
        await tx.jobBenefit.deleteMany({ where: { jobId: id } });
        if (benefits.length > 0) {
          await tx.jobBenefit.createMany({
            data: benefits.map((text, i) => ({ jobId: id, text, sortOrder: i })),
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
