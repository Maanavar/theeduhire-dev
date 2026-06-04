import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export async function GET() {
  try {
    const auth = await requireAuth(["SCHOOL_ADMIN"]);
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const now = new Date();
    await prisma.jobPosting.updateMany({
      where: {
        postedBy: auth.user.id,
        status: "ACTIVE" as any,
        expiresAt: { lt: now },
      },
      data: { status: "EXPIRED" as any },
    });

    const jobs = await prisma.jobPosting.findMany({
      where: { postedBy: auth.user.id },
      select: {
        id: true, title: true, subject: true, board: true, gradeLevel: true,
        jobType: true, experience: true, experienceLevel: true,
        salaryMin: true, salaryMax: true,
        isUrgent: true, requiredWithin48h: true, requiresTet: true,
        applicationDeadline: true,
        postedAt: true, expiresAt: true, status: true,
        school: { select: { schoolName: true, city: true, verified: true, logoUrl: true } },
        _count: { select: { applications: true } },
        applications: { select: { status: true } },
      },
      orderBy: { postedAt: "desc" },
    });

    const result = jobs.map(({ applications, ...job }) => ({
      ...job,
      shortlistedCount: applications.filter((a) => ["SHORTLISTED", "INTERVIEW_SCHEDULED", "INTERVIEW_COMPLETED", "HIRED"].includes(a.status)).length,
    }));

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("GET /api/my-jobs error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch your jobs" }, { status: 500 });
  }
}
