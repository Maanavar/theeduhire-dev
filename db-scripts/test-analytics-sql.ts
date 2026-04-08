import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Testing analytics SQL queries...\n");

    // Get school admin and their jobs
    const schoolAdmin = await prisma.user.findFirst({
      where: { role: "SCHOOL_ADMIN" },
      include: { schoolProfile: true },
    });

    if (!schoolAdmin?.schoolProfile?.id) {
      console.error("No school admin found");
      return;
    }

    const jobs = await prisma.jobPosting.findMany({
      where: { schoolId: schoolAdmin.schoolProfile.id },
      select: { id: true },
    });

    const jobIds = jobs.map((j) => j.id);
    console.log(`Testing with ${jobIds.length} jobs\n`);

    // Test the trend query
    console.log("=== Testing Trend Query ===");
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
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

      console.log("✅ Trend query successful!");
      console.log(`   Found ${trendData.length} days with applications`);
      if (trendData.length > 0) {
        trendData.forEach((d) => {
          console.log(`   - ${d.date}: ${Number(d.count)} applications`);
        });
      }
    } catch (error) {
      console.error("❌ Trend query failed:", error);
    }

    // Test job performance query
    console.log("\n=== Testing Job Performance Query ===");
    try {
      const jobPerformanceData = await prisma.jobPosting.findMany({
        where: { schoolId: schoolAdmin.schoolProfile.id },
        select: {
          id: true,
          title: true,
          _count: { select: { applications: true } },
        },
        take: 10,
      });

      console.log("✅ Job performance query successful!");
      console.log(`   Found ${jobPerformanceData.length} jobs`);

      for (const job of jobPerformanceData) {
        const stats = await prisma.application.findMany({
          where: { jobId: job.id },
          select: { status: true },
        });
        const shortlisted = stats.filter((a) => a.status === "SHORTLISTED").length;
        const hired = stats.filter((a) => a.status === "HIRED").length;
        console.log(`   - ${job.title}: ${stats.length} apps, ${shortlisted} shortlisted, ${hired} hired`);
      }
    } catch (error) {
      console.error("❌ Job performance query failed:", error);
    }

    // Test recent activity query
    console.log("\n=== Testing Recent Activity Query ===");
    try {
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

      console.log("✅ Recent activity query successful!");
      console.log(`   Found ${recentActivity.length} status changes`);
      recentActivity.slice(0, 3).forEach((entry) => {
        console.log(
          `   - ${entry.application.applicant.name} → ${entry.toStatus} (${entry.changedAt.toLocaleDateString()})`
        );
      });
    } catch (error) {
      console.error("❌ Recent activity query failed:", error);
    }

    console.log("\n✨ All queries tested!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
