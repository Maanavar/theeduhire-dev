import type { Prisma, PrismaClient, UserRole } from "@prisma/client";
import { getSchoolProfileIdForUser } from "./application-policy";

type DbClient = PrismaClient | Prisma.TransactionClient;

interface AuthUser {
  id: string;
  role: UserRole;
}

const SCHOOL_DOCUMENT_ACCESS_STATUSES = [
  "SHORTLISTED",
  "INTERVIEW_SCHEDULED",
  "INTERVIEW_COMPLETED",
  "HIRED",
] as const;

export async function canAccessTeacherPrivateDocument(
  db: DbClient,
  user: AuthUser,
  teacherUserId: string
) {
  if (user.role === "ADMIN" || user.id === teacherUserId) {
    return true;
  }

  if (user.role !== "SCHOOL_ADMIN") {
    return false;
  }

  const schoolProfileId = await getSchoolProfileIdForUser(db, user.id);
  if (!schoolProfileId) {
    return false;
  }

  const matchingApplication = await db.application.findFirst({
    where: {
      applicantId: teacherUserId,
      status: { in: [...SCHOOL_DOCUMENT_ACCESS_STATUSES] as any },
      job: {
        schoolId: schoolProfileId,
      },
    },
    select: { id: true },
  });

  return Boolean(matchingApplication);
}
