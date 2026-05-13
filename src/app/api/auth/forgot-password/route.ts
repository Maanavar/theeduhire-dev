import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { generateOpaqueToken, getClientIp, hashOpaqueToken, normalizeEmail } from "@/lib/security";
import {
  PASSWORD_RESET_EMAIL_LIMIT,
  PASSWORD_RESET_IP_LIMIT,
  PASSWORD_RESET_RATE_LIMIT_WINDOW_MS,
  PASSWORD_RESET_TTL_MS,
} from "@/config/constants";

function resolveBaseUrl(req: NextRequest) {
  const rawCandidates = [
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.APP_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    req.nextUrl.origin,
  ];

  for (const candidate of rawCandidates) {
    if (!candidate) continue;
    try {
      return new URL(candidate).origin;
    } catch {
      continue;
    }
  }

  return req.nextUrl.origin;
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const genericSuccessResponse = NextResponse.json(
      { success: true, message: "If an account with that email exists, we've sent a reset link." },
      { status: 200 }
    );

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = normalizeEmail(email);
    const clientIp = getClientIp(req);
    const ipRateLimit = await checkRateLimit({
      key: `password-reset:ip:${clientIp}`,
      action: "password-reset.ip",
      actorKey: clientIp,
      limit: PASSWORD_RESET_IP_LIMIT,
      windowMs: PASSWORD_RESET_RATE_LIMIT_WINDOW_MS,
    });
    const emailRateLimit = await checkRateLimit({
      key: `password-reset:email:${normalizedEmail}`,
      action: "password-reset.email",
      actorKey: normalizedEmail,
      limit: PASSWORD_RESET_EMAIL_LIMIT,
      windowMs: PASSWORD_RESET_RATE_LIMIT_WINDOW_MS,
    });

    if (!ipRateLimit.allowed || !emailRateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many reset attempts. Please try again later." },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // For security, we don't reveal if email exists or not
    if (!user) {
      return genericSuccessResponse;
    }

    const resetToken = generateOpaqueToken();
    const hashedResetToken = hashOpaqueToken(resetToken);
    const resetTokenExpiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

    await prisma.$transaction(async (tx: any) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          resetToken: hashedResetToken,
          resetTokenExpiresAt,
        },
      });

      await tx.domainEvent.create({
        data: {
          eventType: "password_reset_requested",
          aggregateType: "user",
          aggregateId: user.id,
          actorId: user.id,
          payload: {
            email: user.email,
          },
          metadata: {
            source: "api.auth.forgot-password",
            ipAddress: clientIp,
          },
        },
      });
    });

    const baseUrl = resolveBaseUrl(req);
    const resetUrl = new URL("/auth/forgot-password", baseUrl);
    resetUrl.searchParams.set("token", resetToken);

    await sendEmail({
      to: user.email,
      subject: "Reset your EduHire password",
      html: `
        <h1>Reset your password</h1>
        <p>Hi ${user.name},</p>
        <p>You requested a password reset. Click the link below to create a new password:</p>
        <p><a href="${resetUrl.toString()}" style="display: inline-block; padding: 10px 20px; background-color: #1f9b63; color: white; text-decoration: none; border-radius: 6px;">Reset Password</a></p>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>Best regards,<br/>EduHire Team</p>
      `,
    });

    return genericSuccessResponse;
  } catch (error) {
    console.error("[forgot-password]", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
