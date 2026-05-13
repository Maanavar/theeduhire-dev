import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export async function GET() {
  try {
    const auth = await requireAuth(["TEACHER", "SCHOOL_ADMIN", "ADMIN"]);
    if ("error" in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    if (auth.user.role === "TEACHER") {
      const [applications, savedJobs] = await Promise.all([
        prisma.application.findMany({
          where: { applicantId: auth.user.id },
          select: { status: true },
        }),
        prisma.savedJob.count({ where: { userId: auth.user.id } }),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          role: "TEACHER",
          summary: {
            totalApplications: applications.length,
            shortlistedApplications: applications.filter(
              (item) => item.status === "SHORTLISTED"
            ).length,
            hiredApplications: applications.filter(
              (item) => item.status === "HIRED"
            ).length,
            savedJobs,
          },
        },
      });
    }

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

      const jobs = await prisma.jobPosting.findMany({
        where: { schoolId: schoolProfile.id },
        select: {
          status: true,
          postedAt: true,
          _count: { select: { applications: true } },
        },
      });

      const totalApplicants = jobs.reduce(
        (sum, job) => sum + (job._count?.applications || 0),
        0
      );
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;

      return NextResponse.json({
        success: true,
        data: {
          role: "SCHOOL_ADMIN",
          summary: {
            totalJobs: jobs.length,
            activeJobs: jobs.filter((job) => job.status === "ACTIVE").length,
            totalApplicants,
            newApplicants: jobs
              .filter((job) => new Date(job.postedAt).getTime() > cutoff)
              .reduce(
                (sum, job) => sum + (job._count?.applications || 0),
                0
              ),
          },
        },
      });
    }

    const [totalUsers, totalJobs, totalApplications] = await Promise.all([
      prisma.user.count(),
      prisma.jobPosting.count(),
      prisma.application.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        role: "ADMIN",
        summary: {
          totalUsers,
          totalJobs,
          totalApplications,
        },
      },
    });
  } catch (error) {
    console.error("GET /api/dashboard/summary error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard summary" },
      { status: 500 }
    );
  }
}
