import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
const db = prisma as any;

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAuth(["TEACHER", "SCHOOL_ADMIN", "ADMIN"]);
    if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const body = await req.json().catch(() => ({}));
    const includeArchived = !!body.includeArchived;

    await db.notification.updateMany({
      where: {
        userId: auth.user.id,
        readAt: null,
        ...(includeArchived ? {} : { archivedAt: null }),
      },
      data: { readAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/notifications/mark-all-read error:", error);
    return NextResponse.json({ success: false, error: "Failed to mark all notifications as read" }, { status: 500 });
  }
}

