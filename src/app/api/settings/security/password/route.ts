import { NextRequest, NextResponse } from "next/server";
import { compare, hash } from "bcryptjs";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAuth(["TEACHER", "SCHOOL_ADMIN", "ADMIN"]);
    if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const body = await req.json();
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return NextResponse.json({ success: false, error: "Current password and strong new password are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: auth.user.id } });
    if (!user?.hashedPassword) {
      return NextResponse.json({ success: false, error: "Password update not available for this account" }, { status: 400 });
    }

    const valid = await compare(currentPassword, user.hashedPassword);
    if (!valid) {
      return NextResponse.json({ success: false, error: "Current password is incorrect" }, { status: 400 });
    }

    const hashed = await hash(newPassword, 12);
    await prisma.user.update({ where: { id: auth.user.id }, data: { hashedPassword: hashed } });

    const db = prisma as any;
    await db.securityEvent.create({
      data: { userId: auth.user.id, eventType: "PASSWORD_CHANGED" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/settings/security/password error:", error);
    return NextResponse.json({ success: false, error: "Failed to update password" }, { status: 500 });
  }
}
