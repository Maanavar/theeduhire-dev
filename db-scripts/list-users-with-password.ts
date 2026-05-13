import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
    orderBy: [{ role: "asc" }, { email: "asc" }],
  });

  console.log("\nUSER LIST\n");
  console.log("=".repeat(92));
  console.log("USER ID".padEnd(37) + "EMAIL".padEnd(35) + "ROLE".padEnd(20));
  console.log("=".repeat(92));

  for (const user of users) {
    console.log(user.id.padEnd(37) + user.email.padEnd(35) + user.role.padEnd(20));
  }

  console.log("=".repeat(92));
  console.log(`\nTotal Accounts: ${users.length}`);
  console.log("Password values are not displayed for security reasons.\n");
}

main()
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
