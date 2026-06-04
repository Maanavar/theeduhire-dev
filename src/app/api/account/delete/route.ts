// DELETE /api/account/delete
// Permanently deletes the authenticated user's account and all associated data.
// DPDP Act 2023 — right to erasure.

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { removeStoredObject } from "@/lib/storage";

function uniqueStorageRefs(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

export async function DELETE() {
  const auth = await requireAuth();
  if ("error" in auth) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const userId = auth.user.id;

  try {
    const [user, teacherProfile, schoolProfile, resumes] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { avatarUrl: true },
      }),
      prisma.teacherProfile.findUnique({
        where: { userId },
        select: { demoVideoUrl: true, lessonPlanUrl: true },
      }),
      prisma.schoolProfile.findUnique({
        where: { userId },
        select: { logoUrl: true },
      }),
      prisma.resume.findMany({
        where: { userId },
        select: { fileUrl: true },
      }),
    ]);

    const storageRefs = uniqueStorageRefs([
      user?.avatarUrl,
      teacherProfile?.demoVideoUrl,
      teacherProfile?.lessonPlanUrl,
      schoolProfile?.logoUrl,
      ...resumes.map((resume) => resume.fileUrl),
    ]);

    await Promise.all(storageRefs.map((ref) => removeStoredObject(ref)));

    // Revoke all sessions first so JWT tokens stop working immediately.
    const db = prisma as any;
    await db.userSession.updateMany({
      where: { userId },
      data: { revokedAt: new Date() },
    });

    // Cascade-delete the user. Prisma onDelete: Cascade handles related rows
    // (TeacherProfile, SchoolProfile, Applications, Notifications, etc.).
    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/account/delete error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete account" }, { status: 500 });
  }
}
