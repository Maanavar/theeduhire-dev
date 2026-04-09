// List all users from the database
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("📋 EduHire Users\n");
  console.log("Default Password: eduhire2026\n");
  console.log("═".repeat(90));

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
    },
    orderBy: { role: "asc" },
  });

  // Group by role
  const byRole = users.reduce(
    (acc, user) => {
      if (!acc[user.role]) acc[user.role] = [];
      acc[user.role].push(user);
      return acc;
    },
    {} as Record<string, typeof users>
  );

  // Display ADMIN
  if (byRole[UserRole.ADMIN]) {
    console.log("\n🔐 ADMIN\n");
    byRole[UserRole.ADMIN].forEach((user) => {
      console.log(`  ID:    ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Name:  ${user.name}`);
      console.log();
    });
  }

  // Display SCHOOL_ADMIN
  if (byRole[UserRole.SCHOOL_ADMIN]) {
    console.log("🏫 SCHOOL ADMINS\n");
    byRole[UserRole.SCHOOL_ADMIN].forEach((user, idx) => {
      console.log(`  ${idx + 1}. ${user.name}`);
      console.log(`     ID:    ${user.id}`);
      console.log(`     Email: ${user.email}`);
      console.log(`     Phone: ${user.phone}`);
      console.log();
    });
  }

  // Display TEACHER
  if (byRole[UserRole.TEACHER]) {
    console.log("👨‍🏫 TEACHERS\n");
    byRole[UserRole.TEACHER].forEach((user, idx) => {
      console.log(`  ${idx + 1}. ${user.name}`);
      console.log(`     ID:    ${user.id}`);
      console.log(`     Email: ${user.email}`);
      console.log(`     Phone: ${user.phone}`);
      console.log();
    });
  }

  console.log("═".repeat(90));
  console.log(`\nTotal Users: ${users.length}`);
  console.log(`  - Admins: ${byRole[UserRole.ADMIN]?.length || 0}`);
  console.log(`  - School Admins: ${byRole[UserRole.SCHOOL_ADMIN]?.length || 0}`);
  console.log(`  - Teachers: ${byRole[UserRole.TEACHER]?.length || 0}`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
