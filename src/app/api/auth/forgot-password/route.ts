import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // For security, we don't reveal if email exists or not
    if (!user) {
      return NextResponse.json(
        { success: true, message: "If an account with that email exists, we've sent a reset link" },
        { status: 200 }
      );
    }

    // Generate reset token (32 bytes = 64 hex chars)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiresAt,
      },
    });

    // Send reset email
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/forgot-password?token=${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: "Reset your EduHire password",
      html: `
        <h1>Reset your password</h1>
        <p>Hi ${user.name},</p>
        <p>You requested a password reset. Click the link below to create a new password:</p>
        <p><a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #1f9b63; color: white; text-decoration: none; border-radius: 6px;">Reset Password</a></p>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>Best regards,<br/>EduHire Team</p>
      `,
    });

    return NextResponse.json(
      { success: true, message: "Reset link sent to your email" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[forgot-password]", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
