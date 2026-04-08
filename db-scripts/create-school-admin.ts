import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  try {
    // Find Delhi Public School Madurai
    const school = await prisma.schoolProfile.findFirst({
      where: {
        schoolName: "Delhi Public School",
        city: "Madurai",
      },
      include: { user: true },
    });

    if (!school) {
      console.error("Delhi Public School not found");
      process.exit(1);
    }

    // Check if school already has an admin user
    if (school.user?.role === "SCHOOL_ADMIN") {
      console.log(`✅ School admin already exists: ${school.user.email}`);
      console.log(`Password: eduhire2026`);
      process.exit(0);
    }

    // Create admin user for school
    const hashedPassword = await bcryptjs.hash("eduhire2026", 10);

    const adminUser = await prisma.user.create({
      data: {
        email: "admin@dpsma.school",
        name: "DPS Madurai Admin",
        role: "SCHOOL_ADMIN",
        hashedPassword,
        emailVerified: true,
      },
    });

    // Link to school
    await prisma.schoolProfile.update({
      where: { id: school.id },
      data: { userId: adminUser.id },
    });

    console.log("✅ Created school admin:");
    console.log(`Email: admin@dpsma.school`);
    console.log(`Password: eduhire2026`);
    console.log(`\nYou can now login to /dashboard/school`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
