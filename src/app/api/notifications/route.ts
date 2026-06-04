import { NextRequest, NextResponse } from "next/server";
import { Prisma, NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(["TEACHER", "SCHOOL_ADMIN", "ADMIN"]);
    if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(req.url);
    const tab = searchParams.get("tab") || "all";
    const type = searchParams.get("type") || "";
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 20)));

    const where: Prisma.NotificationWhereInput = { userId: auth.user.id };
    if (tab === "unread") {
      where.archivedAt = null;
      where.readAt = null;
    } else if (tab === "archived") {
      where.archivedAt = { not: null };
    } else {
      where.archivedAt = null;
    }
    if (type) where.type = type as NotificationType;

    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: auth.user.id, archivedAt: null, readAt: null } }),
    ]);

    return NextResponse.json({
      success: true,
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      meta: { unreadCount },
    });
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json({ success: false, error: "Failed to load notifications" }, { status: 500 });
  }
}
