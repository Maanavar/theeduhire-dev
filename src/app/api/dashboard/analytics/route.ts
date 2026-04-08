import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import type { SchoolAnalytics } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(["SCHOOL_ADMIN", "ADMIN"]);
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    // For SCHOOL_ADMIN, scope to their school; for ADMIN, get all
    const schoolId =
      auth.user.role === "SCHOOL_ADMIN"
        ? (
            await prisma.schoolProfile.findUnique({
              where: { userId: auth.user.id },
              select: { id: true },
            })
          )?.id
        : undefined;

    // 1. Summary stats
    const jobs = await prisma.jobPosting.findMany({
      where: schoolId ? { schoolId } : undefined,
      select: { id: true, status: true },
    });

    const jobIds = jobs.map((j) => j.id);
    const activeJobsCount = jobs.filter((j) => j.status === "ACTIVE").length;

    const applications = await prisma.application.findMany({
      where: { jobId: { in: jobIds } },
      select: { id: true, status: true, appliedAt: true },
    });

    const shortlistedCount = applications.filter((a) => a.status === "SHORTLISTED").length;
    const hiredCount = applications.filter((a) => a.status === "HIRED").length;

    // Calculate avg time to hire (days from appliedAt to HIRED status change)
    const hiredApplicationIds = applications.filter((a) => a.status === "HIRED").map((a) => a.id);
    let avgTimeToHireDays: number | null = null;

    if (hiredApplicationIds.length > 0) {
      const hireTimeData = await prisma.$queryRaw<
        Array<{ avg_days: number | null }>
      >`
        SELECT AVG(EXTRACT(DAY FROM (ash."changed_at" - a."applied_at"))) as avg_days
        FROM "application_status_history" ash
        JOIN "applications" a ON a.id = ash."application_id"
        WHERE a.id = ANY(${hiredApplicationIds}::uuid[])
        AND ash."to_status" = 'HIRED'
      `;

      avgTimeToHireDays = hireTimeData[0]?.avg_days ? Math.round(Number(hireTimeData[0].avg_days)) : null;
    }

    // 2. 30-day trend (daily application counts)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trendData = await prisma.$queryRaw<
      Array<{ date: string; count: bigint }>
    >`
      SELECT DATE("applied_at") as date, COUNT(*) as count
      FROM "applications"
      WHERE "job_id" = ANY(${jobIds}::uuid[])
      AND "applied_at" >= ${thirtyDaysAgo}::timestamptz
      GROUP BY DATE("applied_at")
      ORDER BY DATE("applied_at") ASC
    `;

    // Build 30-day array with zero-fill
    const trend: Array<{ date: string; applications: number }> = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const count = trendData.find((d) => d.date === dateStr)?.count ?? 0;
      trend.push({ date: dateStr, applications: Number(count) });
    }

    // 3. Job performance (per active/recent job)
    const jobPerformanceData = await prisma.jobPosting.findMany({
      where: schoolId ? { schoolId } : undefined,
      select: {
        id: true,
        title: true,
        _count: { select: { applications: true } },
      },
      orderBy: { postedAt: "desc" },
      take: 10,
    });

    const jobPerformance = await Promise.all(
      jobPerformanceData.map(async (job) => {
        const stats = await prisma.application.findMany({
          where: { jobId: job.id },
          select: { status: true },
        });

        return {
          jobId: job.id,
          title: job.title,
          applicationCount: stats.length,
          shortlistedCount: stats.filter((a) => a.status === "SHORTLISTED").length,
          hiredCount: stats.filter((a) => a.status === "HIRED").length,
        };
      })
    );

    // 4. Recent activity (last 10 status changes)
    const recentActivity = await prisma.applicationStatusHistory.findMany({
      where: {
        application: { jobId: { in: jobIds } },
      },
      include: {
        application: {
          select: {
            applicant: { select: { name: true } },
            job: { select: { title: true } },
          },
        },
      },
      orderBy: { changedAt: "desc" },
      take: 10,
    });

    const recentActivityFormatted = recentActivity.map((entry) => ({
      applicantName: entry.application.applicant.name,
      jobTitle: entry.application.job.title,
      toStatus: entry.toStatus,
      changedAt: entry.changedAt.toISOString(),
    }));

    const data: SchoolAnalytics = {
      summary: {
        totalJobs: jobs.length,
        activeJobs: activeJobsCount,
        totalApplications: applications.length,
        shortlisted: shortlistedCount,
        hired: hiredCount,
        avgTimeToHireDays,
      },
      trend,
      jobPerformance,
      recentActivity: recentActivityFormatted,
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("GET /api/dashboard/analytics error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch analytics" }, { status: 500 });
  }
}
