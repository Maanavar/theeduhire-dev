import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
const db = prisma as any;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(["TEACHER", "SCHOOL_ADMIN", "ADMIN"]);
    if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const archived = body.archived !== false;

    const updated = await db.notification.updateMany({
      where: { id, userId: auth.user.id },
      data: { archivedAt: archived ? new Date() : null },
    });

    if (updated.count === 0) {
      return NextResponse.json({ success: false, error: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/notifications/[id]/archive error:", error);
    return NextResponse.json({ success: false, error: "Failed to archive notification" }, { status: 500 });
  }
}

