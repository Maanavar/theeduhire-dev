import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const auth = await requireAuth(["TEACHER", "SCHOOL_ADMIN", "ADMIN"]);
    if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const db = prisma as any;
    const sessions = await db.userSession.findMany({
      where: { userId: auth.user.id },
      orderBy: { lastActiveAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ success: true, data: sessions });
  } catch (error) {
    console.error("GET /api/settings/security/sessions error:", error);
    return NextResponse.json({ success: false, error: "Failed to load sessions" }, { status: 500 });
  }
}
