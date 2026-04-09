// List all users with their IDs and plaintext password
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

  console.log("\n📋 USER ID & PASSWORD LIST\n");
  console.log("═".repeat(100));
  console.log(
    "USER ID".padEnd(37) +
      "EMAIL".padEnd(35) +
      "ROLE".padEnd(15) +
      "PASSWORD"
  );
  console.log("═".repeat(100));

  users.forEach((user) => {
    console.log(
      user.id.padEnd(37) +
        user.email.padEnd(35) +
        user.role.padEnd(15) +
        "eduhire2026"
    );
  });

  console.log("═".repeat(100));
  console.log(`\nTotal Accounts: ${users.length}`);
  console.log(
    "\n⚠️  NOTE: All accounts use the same password: eduhire2026 (set during seeding)\n"
  );
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
