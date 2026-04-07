import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(["SCHOOL_ADMIN", "ADMIN"]);
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const jobs = await prisma.jobPosting.findMany({
      where: { postedBy: auth.user.id },
      select: {
        id: true, title: true, subject: true, board: true, gradeLevel: true,
        jobType: true, experience: true, salaryMin: true, salaryMax: true,
        postedAt: true, status: true,
        school: { select: { schoolName: true, city: true, verified: true, logoUrl: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { postedAt: "desc" },
    });

    return NextResponse.json({ success: true, data: jobs });
  } catch (error) {
    console.error("GET /api/my-jobs error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch your jobs" }, { status: 500 });
  }
}
