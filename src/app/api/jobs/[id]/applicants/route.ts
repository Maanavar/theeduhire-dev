import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(["SCHOOL_ADMIN", "ADMIN"]);
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { id: jobId } = await params;

    // Verify the job belongs to this school admin
    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId },
      select: { postedBy: true },
    });

    if (!job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }
    if (job.postedBy !== auth.user.id && auth.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Not authorized" }, { status: 403 });
    }

    const applications = await prisma.application.findMany({
      where: { jobId },
      include: {
        applicant: {
          select: {
            name: true,
            email: true,
            phone: true,
            teacherProfile: {
              select: {
                qualification: true,
                experience: true,
                currentSchool: true,
                city: true,
              },
            },
          },
        },
      },
      orderBy: { appliedAt: "desc" },
    });

    return NextResponse.json({ success: true, data: applications });
  } catch (error) {
    console.error("GET /api/jobs/[id]/applicants error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch applicants" }, { status: 500 });
  }
}
