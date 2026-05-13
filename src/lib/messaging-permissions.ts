import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

export async function canUsersMessageEachOther(senderId: string, senderRole: UserRole, recipientId: string, recipientRole: UserRole): Promise<boolean> {
  if (senderId === recipientId) return false;
  if (senderRole === "ADMIN" || recipientRole === "ADMIN") return true;

  if (senderRole === "TEACHER" && recipientRole === "SCHOOL_ADMIN") {
    const count = await prisma.application.count({
      where: {
        applicantId: senderId,
        job: { school: { userId: recipientId } },
      },
    });
    return count > 0;
  }

  if (senderRole === "SCHOOL_ADMIN" && recipientRole === "TEACHER") {
    const count = await prisma.application.count({
      where: {
        applicantId: recipientId,
        job: { school: { userId: senderId } },
      },
    });
    return count > 0;
  }

  return false;
}
