import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

function getSeedPassword() {
  const password = process.env.SEED_DEFAULT_PASSWORD?.trim();
  if (!password || password.length < 8) {
    throw new Error("SEED_DEFAULT_PASSWORD must be set and at least 8 characters long.");
  }
  return password;
}

async function main() {
  try {
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

    if (school.user?.role === "SCHOOL_ADMIN") {
      console.log(`School admin already exists: ${school.user.email}`);
      process.exit(0);
    }

    const hashedPassword = await bcryptjs.hash(getSeedPassword(), 10);

    const adminUser = await prisma.user.create({
      data: {
        email: "admin@dpsma.school",
        name: "DPS Madurai Admin",
        role: "SCHOOL_ADMIN",
        hashedPassword,
        emailVerified: true,
      },
    });

    await prisma.schoolProfile.update({
      where: { id: school.id },
      data: { userId: adminUser.id },
    });

    console.log("Created school admin:");
    console.log("Email: admin@dpsma.school");
    console.log("\nYou can now login to /dashboard/school");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
