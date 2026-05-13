import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientIp, hashOpaqueToken, hashPassword } from "@/lib/security";
import { checkRateLimit } from "@/lib/rate-limit";
import { PASSWORD_RESET_IP_LIMIT, PASSWORD_RESET_RATE_LIMIT_WINDOW_MS } from "@/config/constants";

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();
    const clientIp = getClientIp(req);

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const rateLimit = await checkRateLimit({
      key: `password-reset:complete:${clientIp}`,
      action: "password-reset.complete",
      actorKey: clientIp,
      limit: PASSWORD_RESET_IP_LIMIT,
      windowMs: PASSWORD_RESET_RATE_LIMIT_WINDOW_MS,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many reset attempts. Please try again later." },
        { status: 429 }
      );
    }

    const hashedToken = hashOpaqueToken(token);
    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiresAt: {
          gt: new Date(),
        },
      },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Reset link is invalid or has expired" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(newPassword);

    const updateResult = await prisma.$transaction(async (tx: any) => {
      const updated = await tx.user.updateMany({
        where: {
          id: user.id,
          resetToken: hashedToken,
          resetTokenExpiresAt: {
            gt: new Date(),
          },
        },
        data: {
          hashedPassword,
          resetToken: null,
          resetTokenExpiresAt: null,
        },
      });

      if (updated.count !== 1) {
        return false;
      }

      await tx.securityEvent.create({
        data: {
          userId: user.id,
          eventType: "PASSWORD_CHANGED",
          metadata: { source: "api.auth.reset-password", ipAddress: clientIp },
        },
      });

      await tx.domainEvent.create({
        data: {
          eventType: "password_reset_completed",
          aggregateType: "user",
          aggregateId: user.id,
          actorId: user.id,
          payload: {
            email: user.email,
          },
          metadata: {
            source: "api.auth.reset-password",
            ipAddress: clientIp,
          },
        },
      });

      return true;
    });

    if (!updateResult) {
      return NextResponse.json(
        { error: "Reset link is invalid or has expired" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Password reset successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[reset-password]", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
