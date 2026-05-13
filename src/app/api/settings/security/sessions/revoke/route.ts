import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(["TEACHER", "SCHOOL_ADMIN", "ADMIN"]);
    if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const body = await req.json().catch(() => ({}));
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
    const revokeAllOthers = !!body.revokeAllOthers;
    const currentSessionToken = auth.user.sessionToken || "";

    const db = prisma as any;

    if (revokeAllOthers) {
      await db.userSession.updateMany({
        where: {
          userId: auth.user.id,
          revokedAt: null,
          ...(currentSessionToken ? { sessionToken: { not: currentSessionToken } } : {}),
        },
        data: { revokedAt: new Date() },
      });
    } else {
      if (!sessionId) return NextResponse.json({ success: false, error: "sessionId is required" }, { status: 400 });
      await db.userSession.updateMany({
        where: { id: sessionId, userId: auth.user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    await db.securityEvent.create({
      data: {
        userId: auth.user.id,
        eventType: "SESSION_REVOKED",
        metadata: { sessionId: sessionId || null, revokeAllOthers },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/settings/security/sessions/revoke error:", error);
    return NextResponse.json({ success: false, error: "Failed to revoke session" }, { status: 500 });
  }
}
