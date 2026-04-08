import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("=== Checking School Admin ===");
    const schoolAdmin = await prisma.user.findFirst({
      where: { role: "SCHOOL_ADMIN" },
      include: { schoolProfile: true },
    });

    if (!schoolAdmin) {
      console.error("❌ No school admin found");
      return;
    }

    console.log("✅ School Admin found:", {
      id: schoolAdmin.id,
      email: schoolAdmin.email,
      schoolProfileId: schoolAdmin.schoolProfile?.id,
      schoolName: schoolAdmin.schoolProfile?.schoolName,
    });

    if (!schoolAdmin.schoolProfile?.id) {
      console.error("❌ School admin has no school profile!");
      return;
    }

    const schoolId = schoolAdmin.schoolProfile.id;

    console.log("\n=== Checking School Jobs ===");
    const jobs = await prisma.jobPosting.findMany({
      where: { schoolId },
      select: { id: true, title: true, status: true },
      take: 5,
    });
    console.log(`✅ Found ${jobs.length} jobs for this school`);
    jobs.forEach((j) => console.log(`   - ${j.title} (${j.status})`));

    console.log("\n=== Checking Applications ===");
    const jobIds = jobs.map((j) => j.id);
    const appCount = await prisma.application.count({
      where: { jobId: { in: jobIds } },
    });
    console.log(`✅ Found ${appCount} applications for these jobs`);

    if (appCount > 0) {
      const latestApps = await prisma.application.findMany({
        where: { jobId: { in: jobIds } },
        select: { id: true, status: true, appliedAt: true },
        take: 3,
      });
      console.log("Latest applications:");
      latestApps.forEach((a) =>
        console.log(`   - ${a.status} (${new Date(a.appliedAt).toLocaleDateString()})`)
      );
    }

    console.log("\n=== Checking Status History ===");
    const historyCount = await prisma.applicationStatusHistory.count({
      where: {
        application: { jobId: { in: jobIds } },
      },
    });
    console.log(`✅ Found ${historyCount} status history entries`);

    console.log("\n✨ Data looks good! Analytics should work.");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
