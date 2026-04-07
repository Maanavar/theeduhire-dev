// POST /api/auth/verify — Verify email with HMAC-signed token
// Token = base64url(userId:timestamp:hmac) — valid for 24 hours

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = body?.token;
    if (!token || typeof token !== "string") {
      return NextResponse.json({ success: false, error: "Token is required" }, { status: 400 });
    }

    const { userId, valid, expired } = verifyToken(token);
    if (!valid) {
      return NextResponse.json({
        success: false,
        error: expired
          ? "This verification link has expired. Please request a new one."
          : "Invalid verification link.",
      }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, emailVerified: true } });
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    if (user.emailVerified) return NextResponse.json({ success: true, data: { message: "Already verified" } });

    await prisma.user.update({ where: { id: userId }, data: { emailVerified: true } });
    return NextResponse.json({ success: true, data: { message: "Email verified successfully" } });
  } catch (error) {
    console.error("POST /api/auth/verify error:", error);
    return NextResponse.json({ success: false, error: "Verification failed" }, { status: 500 });
  }
}
