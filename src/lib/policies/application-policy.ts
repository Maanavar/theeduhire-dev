import type { Prisma, PrismaClient, UserRole } from "@prisma/client";
import { canManageJob } from "./job-policy";

type DbClient = PrismaClient | Prisma.TransactionClient;

interface AuthUser {
  id: string;
  role: UserRole;
}

export async function getSchoolProfileIdForUser(
  db: DbClient,
  userId: string
): Promise<string | null> {
  const schoolProfile = await db.schoolProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  return schoolProfile?.id ?? null;
}

export async function canManageApplication(
  db: DbClient,
  user: AuthUser,
  application: { job: { postedBy: string; schoolId: string } }
): Promise<boolean> {
  const schoolProfileId = user.role === "SCHOOL_ADMIN"
    ? await getSchoolProfileIdForUser(db, user.id)
    : null;

  return canManageJob(user, application.job, schoolProfileId);
}
