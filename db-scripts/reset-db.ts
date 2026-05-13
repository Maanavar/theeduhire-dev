import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function resetDatabase() {
  try {
    console.log("🗑️  Starting database reset...\n");

    // Delete in order of dependencies (respecting foreign keys)
    console.log("Deleting saved jobs...");
    await prisma.savedJob.deleteMany({});

    console.log("Deleting applications...");
    await prisma.application.deleteMany({});

    console.log("Deleting resumes...");
    await prisma.resume.deleteMany({});

    console.log("Deleting job postings...");
    await prisma.jobPosting.deleteMany({});

    console.log("Deleting teacher profiles...");
    await prisma.teacherProfile.deleteMany({});

    console.log("Deleting school profiles...");
    await prisma.schoolProfile.deleteMany({});

    console.log("Deleting users...");
    const deletedUsers = await prisma.user.deleteMany({});

    console.log("\n✅ Database reset complete!");
    console.log(`   Deleted ${deletedUsers.count} users and all related records\n`);
  } catch (error) {
    console.error("❌ Error resetting database:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase();
