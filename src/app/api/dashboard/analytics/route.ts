import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import type { SchoolAnalytics } from "@/types";
import { cacheTags } from "@/lib/cache-tags";

async function computeSchoolAnalytics(schoolId?: string): Promise<SchoolAnalytics> {
  const jobs = await prisma.jobPosting.findMany({
    where: schoolId ? { schoolId } : undefined,
    select: { id: true, status: true },
  });

  const jobIds = jobs.map((job) => job.id);
  const activeJobsCount = jobs.filter((job) => job.status === "ACTIVE").length;

  const applications = jobIds.length
    ? await prisma.application.findMany({
        where: { jobId: { in: jobIds } },
        select: { id: true, status: true, appliedAt: true },
      })
    : [];

  const shortlistedCount = applications.filter(
    (application) => application.status === "SHORTLISTED"
  ).length;
  const hiredCount = applications.filter(
    (application) => application.status === "HIRED"
  ).length;

  const hiredApplicationIds = applications
    .filter((application) => application.status === "HIRED")
    .map((application) => application.id);
  let avgTimeToHireDays: number | null = null;

  if (hiredApplicationIds.length > 0) {
    const hireTimeData = await prisma.$queryRaw<Array<{ avg_days: number | null }>>`
      SELECT AVG(EXTRACT(DAY FROM (ash."changed_at" - a."applied_at"))) as avg_days
      FROM "application_status_history" ash
      JOIN "applications" a ON a.id = ash."application_id"
      WHERE a.id = ANY(${hiredApplicationIds}::uuid[])
      AND ash."to_status" = 'HIRED'
    `;

    avgTimeToHireDays = hireTimeData[0]?.avg_days
      ? Math.round(Number(hireTimeData[0].avg_days))
      : null;
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const trendData = jobIds.length
    ? await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
        SELECT DATE("applied_at") as date, COUNT(*) as count
        FROM "applications"
        WHERE "job_id" = ANY(${jobIds}::uuid[])
        AND "applied_at" >= ${thirtyDaysAgo}::timestamptz
        GROUP BY DATE("applied_at")
        ORDER BY DATE("applied_at") ASC
      `
    : [];

  const trend: Array<{ date: string; applications: number }> = [];
  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const count = trendData.find((item) => item.date === dateStr)?.count ?? 0;
    trend.push({ date: dateStr, applications: Number(count) });
  }

  const jobPerformanceData = jobIds.length
    ? await prisma.$queryRaw<
        Array<{
          id: string;
          title: string;
          applicationCount: bigint;
          shortlistedCount: bigint;
          hiredCount: bigint;
        }>
      >`
        SELECT
          jp.id,
          jp.title,
          COUNT(a.id) as "applicationCount",
          COUNT(CASE WHEN a.status = 'SHORTLISTED' THEN 1 END) as "shortlistedCount",
          COUNT(CASE WHEN a.status = 'HIRED' THEN 1 END) as "hiredCount"
        FROM "job_postings" jp
        LEFT JOIN "applications" a ON jp.id = a."job_id"
        WHERE jp.id = ANY(${jobIds}::uuid[])
        GROUP BY jp.id, jp.title
        ORDER BY jp."posted_at" DESC
        LIMIT 10
      `
    : [];

  const jobPerformance = jobPerformanceData.map((job) => ({
    jobId: job.id,
    title: job.title,
    applicationCount: Number(job.applicationCount),
    shortlistedCount: Number(job.shortlistedCount),
    hiredCount: Number(job.hiredCount),
  }));

  const recentActivity = jobIds.length
    ? await prisma.applicationStatusHistory.findMany({
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
      })
    : [];

  const recentActivityFormatted = recentActivity.map((entry) => ({
    applicantName: entry.application.applicant.name ?? "Unknown Applicant",
    jobTitle: entry.application.job.title ?? "Unknown Job",
    toStatus: entry.toStatus,
    changedAt: entry.changedAt.toISOString(),
  }));

  return {
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
}

function getCachedSchoolAnalytics(scopeKey: string, schoolId?: string) {
  return unstable_cache(
    () => computeSchoolAnalytics(schoolId),
    [`dashboard-analytics:${scopeKey}`],
    {
      revalidate: 300,
      tags: [cacheTags.schoolAnalytics(scopeKey)],
    }
  )();
}

export async function GET() {
  try {
    const auth = await requireAuth(["SCHOOL_ADMIN", "ADMIN"]);
    if ("error" in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    let schoolId: string | undefined;
    if (auth.user.role === "SCHOOL_ADMIN") {
      const schoolProfile = await prisma.schoolProfile.findUnique({
        where: { userId: auth.user.id },
        select: { id: true },
      });
      if (!schoolProfile) {
        return NextResponse.json(
          { success: false, error: "School profile not found" },
          { status: 404 }
        );
      }
      schoolId = schoolProfile.id;
    }

    const scopeKey = schoolId ?? "all";
    const data = await getCachedSchoolAnalytics(scopeKey, schoolId);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("GET /api/dashboard/analytics error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
