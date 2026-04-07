import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(["TEACHER", "ADMIN"]);
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const saved = await prisma.savedJob.findMany({
      where: { userId: auth.user.id },
      include: {
        job: {
          select: {
            id: true, title: true, subject: true, board: true, gradeLevel: true,
            jobType: true, salaryMin: true, salaryMax: true, postedAt: true, status: true,
            school: { select: { schoolName: true, city: true, verified: true } },
          },
        },
      },
      orderBy: { savedAt: "desc" },
    });

    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch saved jobs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(["TEACHER", "ADMIN"]);
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { jobId } = await req.json();
    if (!jobId) {
      return NextResponse.json({ success: false, error: "jobId is required" }, { status: 400 });
    }

    // Toggle: if already saved, unsave; otherwise save
    const existing = await prisma.savedJob.findUnique({
      where: { userId_jobId: { userId: auth.user.id, jobId } },
    });

    if (existing) {
      await prisma.savedJob.delete({ where: { id: existing.id } });
      return NextResponse.json({ success: true, data: { saved: false } });
    }

    await prisma.savedJob.create({
      data: { userId: auth.user.id, jobId },
    });

    return NextResponse.json({ success: true, data: { saved: true } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to save job" }, { status: 500 });
  }
}
