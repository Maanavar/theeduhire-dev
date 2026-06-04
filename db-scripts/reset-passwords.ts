import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { assertDestructiveDbScriptAllowed, getRequiredScriptPassword } from "../scripts/lib/script-safety";

const prisma = new PrismaClient();
const NEW_PASSWORD = getRequiredScriptPassword("RESET_PASSWORD");

async function main() {
  assertDestructiveDbScriptAllowed("db-scripts/reset-passwords.ts");
  const hashed = await hash(NEW_PASSWORD, 12);

  const users = await prisma.user.findMany({
    where: { hashedPassword: { not: null } },
    select: { id: true, email: true, role: true },
  });

  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: { hashedPassword: hashed },
    });
    console.log(`Reset: ${user.email} (${user.role})`);
  }

  console.log(`\nDone — ${users.length} accounts reset.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
