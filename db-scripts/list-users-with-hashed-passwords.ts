import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      hashedPassword: true,
    },
    orderBy: [{ role: "asc" }, { email: "asc" }],
  });

  console.log("\n====== USER LIST WITH PASSWORDS ======\n");
  console.log("Total Users:", users.length);
  console.log("\n");
  console.log("=".repeat(120));
  console.log(
    "EMAIL".padEnd(40) +
      "NAME".padEnd(30) +
      "ROLE".padEnd(20) +
      "HASHED PASSWORD"
  );
  console.log("=".repeat(120));

  for (const user of users) {
    const passwordDisplay = user.hashedPassword
      ? user.hashedPassword.substring(0, 50) + "..."
      : "[NO PASSWORD SET]";
    console.log(
      user.email.padEnd(40) +
        (user.name || "").padEnd(30) +
        user.role.padEnd(20) +
        passwordDisplay
    );
  }

  console.log("=".repeat(120));
  console.log(`\nTotal Accounts: ${users.length}\n`);
}

main()
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
