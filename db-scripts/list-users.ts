import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("EduHire Users\n");
  console.log("=".repeat(90));

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

  const byRole = users.reduce(
    (acc, user) => {
      if (!acc[user.role]) acc[user.role] = [];
      acc[user.role].push(user);
      return acc;
    },
    {} as Record<string, typeof users>
  );

  if (byRole[UserRole.ADMIN]) {
    console.log("\nADMIN\n");
    for (const user of byRole[UserRole.ADMIN]) {
      console.log(`  ID:    ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Name:  ${user.name}`);
      console.log();
    }
  }

  if (byRole[UserRole.SCHOOL_ADMIN]) {
    console.log("SCHOOL ADMINS\n");
    byRole[UserRole.SCHOOL_ADMIN].forEach((user, idx) => {
      console.log(`  ${idx + 1}. ${user.name}`);
      console.log(`     ID:    ${user.id}`);
      console.log(`     Email: ${user.email}`);
      console.log(`     Phone: ${user.phone}`);
      console.log();
    });
  }

  if (byRole[UserRole.TEACHER]) {
    console.log("TEACHERS\n");
    byRole[UserRole.TEACHER].forEach((user, idx) => {
      console.log(`  ${idx + 1}. ${user.name}`);
      console.log(`     ID:    ${user.id}`);
      console.log(`     Email: ${user.email}`);
      console.log(`     Phone: ${user.phone}`);
      console.log();
    });
  }

  console.log("=".repeat(90));
  console.log(`\nTotal Users: ${users.length}`);
  console.log(`  - Admins: ${byRole[UserRole.ADMIN]?.length || 0}`);
  console.log(`  - School Admins: ${byRole[UserRole.SCHOOL_ADMIN]?.length || 0}`);
  console.log(`  - Teachers: ${byRole[UserRole.TEACHER]?.length || 0}`);
}

main()
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
