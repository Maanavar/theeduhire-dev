import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const [
      totalUsers, totalTeachers, totalSchools,
      totalJobs, activeJobs, totalApplications,
      recentUsers, recentJobs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "TEACHER" } }),
      prisma.user.count({ where: { role: "SCHOOL_ADMIN" } }),
      prisma.jobPosting.count(),
      prisma.jobPosting.count({ where: { status: "ACTIVE" } }),
      prisma.application.count(),
      prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 86400000) } } }),
      prisma.jobPosting.count({ where: { postedAt: { gte: new Date(Date.now() - 7 * 86400000) } } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        users: { total: totalUsers, teachers: totalTeachers, schools: totalSchools, recentWeek: recentUsers },
        jobs: { total: totalJobs, active: activeJobs, recentWeek: recentJobs },
        applications: { total: totalApplications },
      },
    });
  } catch (error) {
    console.error("GET /api/admin/stats error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch stats" }, { status: 500 });
  }
}
